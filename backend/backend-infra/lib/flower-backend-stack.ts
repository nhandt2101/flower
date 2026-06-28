import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as path from "path";

export class FlowerBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, "FlowerTable", {
      tableName: "FlowerShop",
      partitionKey: { name: "PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "SK", type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: 5,
      writeCapacity: 5,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    table.addGlobalSecondaryIndex({
      indexName: "byStatus",
      partitionKey: { name: "GSI1PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI1SK", type: dynamodb.AttributeType.STRING },
      readCapacity: 5,
      writeCapacity: 5,
      projectionType: dynamodb.ProjectionType.ALL,
    });

    table.addGlobalSecondaryIndex({
      indexName: "byCategory",
      partitionKey: { name: "GSI2PK", type: dynamodb.AttributeType.STRING },
      sortKey: { name: "GSI2SK", type: dynamodb.AttributeType.STRING },
      readCapacity: 5,
      writeCapacity: 5,
      projectionType: dynamodb.ProjectionType.ALL,
    });

    const imageBucket = new s3.Bucket(this, "ImageBucket", {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
      lifecycleRules: [
        {
          prefix: "uploads/",
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    const distribution = new cloudfront.Distribution(this, "ImageDistribution", {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(imageBucket, {
          originPath: "/public",
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
    });

    const userPool = new cognito.UserPool(this, "AdminUserPool", {
      selfSignUpEnabled: false,
      signInAliases: { email: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const userPoolClient = new cognito.UserPoolClient(this, "AdminUserPoolClient", {
      userPool,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      preventUserExistenceErrors: true,
    });
    const turnstileSecret =
      process.env.TURNSTILE_SECRET ??
      this.node.tryGetContext("turnstileSecret") ??
      "1x0000000000000000000000000000000AA";

    const commonEnvironment = {
      TABLE_NAME: table.tableName,
      BUCKET: imageBucket.bucketName,
      UPLOADS_PREFIX: "uploads/",
      PUBLIC_PREFIX: "public/",
    };
    const depsLockFilePath = path.join(__dirname, "../package-lock.json");

    const api = new NodejsFunction(this, "ApiLambda", {
      entry: path.join(__dirname, "../lib/lambda/api/index.ts"),
      depsLockFilePath,
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      bundling: {
        externalModules: [],
      },
      environment: {
        ...commonEnvironment,
        USER_POOL_ID: userPool.userPoolId,
        TURNSTILE_SECRET: turnstileSecret,
        MAX_UPLOAD_BYTES: "5242880",
      },
    });
    table.grantReadWriteData(api);
    imageBucket.grantPut(api, "uploads/*");

    const imageProcessor = new NodejsFunction(this, "ImageProcessorLambda", {
      entry: path.join(__dirname, "../lib/lambda/image-processor/index.ts"),
      depsLockFilePath,
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      timeout: cdk.Duration.seconds(30),
      memorySize: 1024,
      bundling: {
        externalModules: [],
        nodeModules: ["sharp"],
      },
      environment: {
        ...commonEnvironment,
        CDN_BASE_URL: `https://${distribution.distributionDomainName}`,
        MAX_EDGE: "2000",
        THUMB_EDGE: "600",
        WEBP_QUALITY: "82",
      },
    });
    table.grantReadWriteData(imageProcessor);
    imageBucket.grantReadWrite(imageProcessor, "uploads/*");
    imageBucket.grantReadWrite(imageProcessor, "public/*");
    imageBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(imageProcessor),
      { prefix: "uploads/" },
    );

    imageProcessor.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [imageBucket.arnForObjects("uploads/*")],
      }),
    );

    const fnUrl = api.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"],
        allowedHeaders: ["content-type", "authorization"],
        allowedMethods: [lambda.HttpMethod.ALL],
      },
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: fnUrl.url,
    });
    new cdk.CfnOutput(this, "ImageBucketName", {
      value: imageBucket.bucketName,
    });
    new cdk.CfnOutput(this, "ImageCdnUrl", {
      value: `https://${distribution.distributionDomainName}`,
    });
    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });
    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });
  }
}

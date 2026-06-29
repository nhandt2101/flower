import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import sharp from "sharp";

const TABLE_NAME = requireEnv("TABLE_NAME");
const BUCKET = requireEnv("BUCKET");
const CDN_BASE_URL = requireEnv("CDN_BASE_URL").replace(/\/$/, "");
const UPLOADS_PREFIX = process.env.UPLOADS_PREFIX ?? "uploads/";
const PUBLIC_PREFIX = process.env.PUBLIC_PREFIX ?? "public/";
const MAX_EDGE = Number(process.env.MAX_EDGE ?? "2000");
const THUMB_EDGE = Number(process.env.THUMB_EDGE ?? "600");
const WEBP_QUALITY = Number(process.env.WEBP_QUALITY ?? "82");

const s3 = new S3Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: any): Promise<void> => {
  const results = await Promise.allSettled(event.Records.map(processRecord));
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    for (const failure of failed) console.error(failure.reason);
    throw new Error(`${failed.length}/${event.Records.length} record(s) failed`);
  }
};

async function processRecord(record: any): Promise<void> {
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  if (!key.startsWith(UPLOADS_PREFIX)) {
    console.log(`Skipping ${key} (not under ${UPLOADS_PREFIX})`);
    return;
  }

  const head = await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
  const imageId = head.Metadata?.["image-id"];
  const createdAt = head.Metadata?.["created-at"];
  if (!imageId || !createdAt) {
    throw new Error(
      `Missing x-amz-meta-image-id / x-amz-meta-created-at on ${key}`,
    );
  }

  const originalSize = head.ContentLength ?? 0;
  const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const input = Buffer.from(await obj.Body!.transformToByteArray());

  const base = sharp(input).rotate();
  const full = await base
    .clone()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });
  const thumb = await base
    .clone()
    .resize({
      width: THUMB_EDGE,
      height: THUMB_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const fullKey = `${PUBLIC_PREFIX}${imageId}.webp`;
  const thumbKey = `${PUBLIC_PREFIX}${imageId}_thumb.webp`;
  const put = (Key: string, Body: Buffer) =>
    s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key,
        Body,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
  await Promise.all([put(fullKey, full.data), put(thumbKey, thumb)]);

  const url = `${CDN_BASE_URL}/${cdnPath(fullKey)}`;
  const thumbUrl = `${CDN_BASE_URL}/${cdnPath(thumbKey)}`;
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { PK: "IMAGE", SK: `${createdAt}#${imageId}` },
      UpdateExpression:
        "SET #s = :active, #u = :url, thumbUrl = :turl, #w = :w, #h = :h, sizeBytes = :sz",
      ExpressionAttributeNames: {
        "#s": "status",
        "#u": "url",
        "#w": "width",
        "#h": "height",
      },
      ExpressionAttributeValues: {
        ":active": "active",
        ":url": url,
        ":turl": thumbUrl,
        ":w": full.info.width,
        ":h": full.info.height,
        ":sz": originalSize,
      },
    }),
  );

  console.log(
    `Processed ${key} -> ${fullKey} + ${thumbKey} (${full.info.width}x${full.info.height})`,
  );
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

function cdnPath(key: string): string {
  return key.startsWith(PUBLIC_PREFIX) ? key.slice(PUBLIC_PREFIX.length) : key;
}

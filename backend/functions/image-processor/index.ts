import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import sharp from "sharp";
import type { S3Event, S3EventRecord } from "aws-lambda";

/**
 * image-processor — triggered by S3 ObjectCreated on the `uploads/` prefix.
 *
 * Per record it: downloads the original, converts to WebP (resized, rotated by
 * EXIF), uploads the result to `public/`, and flips the matching DynamoDB image
 * record to `status: "active"` with width/height/url.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * INTEGRATION CONTRACT (must match the API Lambda + infra — see ./README.md):
 *
 * 1. ENV VARS (set by infra):
 *      TABLE_NAME      DynamoDB table name (required)
 *      BUCKET          S3 bucket holding both prefixes (required)
 *      CDN_BASE_URL    CloudFront base, no trailing slash, e.g.
 *                      https://dxxxx.cloudfront.net (required)
 *      UPLOADS_PREFIX  default "uploads/"
 *      PUBLIC_PREFIX   default "public/"
 *      MAX_EDGE        longest side in px, default "2000"
 *      WEBP_QUALITY    1-100, default "82"
 *
 * 2. S3 OBJECT METADATA on the uploaded original (set when the presigned PUT is
 *    created by the API Lambda) — used to locate the DynamoDB row:
 *      x-amz-meta-image-id     the image id
 *      x-amz-meta-created-at   the row's createdAt (ISO 8601)
 *    => If your table key differs, adjust buildItemKey() below — it is the ONLY
 *       place that encodes the DynamoDB key shape.
 *
 * 3. DYNAMODB ROW (created earlier by the API Lambda with status "processing";
 *    this function only UPDATES it). Matches AdminImage in
 *    web/src/lib/api/types.ts: { url, width, height, sizeBytes, status }.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const TABLE_NAME = requireEnv("TABLE_NAME");
const BUCKET = requireEnv("BUCKET");
const CDN_BASE_URL = requireEnv("CDN_BASE_URL").replace(/\/$/, "");
const UPLOADS_PREFIX = process.env.UPLOADS_PREFIX ?? "uploads/";
const PUBLIC_PREFIX = process.env.PUBLIC_PREFIX ?? "public/";
const MAX_EDGE = Number(process.env.MAX_EDGE ?? "2000");
const WEBP_QUALITY = Number(process.env.WEBP_QUALITY ?? "82");

const s3 = new S3Client({});
const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const handler = async (event: S3Event): Promise<void> => {
  // Process records in parallel; one failure shouldn't block the others.
  const results = await Promise.allSettled(event.Records.map(processRecord));
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    // Throw so Lambda marks the batch failed and S3/DLQ can retry.
    for (const f of failed) console.error(f.reason);
    throw new Error(`${failed.length}/${event.Records.length} record(s) failed`);
  }
};

async function processRecord(record: S3EventRecord): Promise<void> {
  const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

  // Safety: only handle originals under the uploads prefix.
  if (!key.startsWith(UPLOADS_PREFIX)) {
    console.log(`Skipping ${key} (not under ${UPLOADS_PREFIX})`);
    return;
  }

  // 1. Read metadata + original bytes.
  const head = await s3.send(
    new HeadObjectCommand({ Bucket: BUCKET, Key: key }),
  );
  const imageId = head.Metadata?.["image-id"];
  const createdAt = head.Metadata?.["created-at"];
  if (!imageId || !createdAt) {
    throw new Error(
      `Missing x-amz-meta-image-id / x-amz-meta-created-at on ${key}. ` +
        `The presigned PUT must attach these (see README).`,
    );
  }
  const originalSize = head.ContentLength ?? 0;

  const obj = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
  );
  const input = Buffer.from(await obj.Body!.transformToByteArray());

  // 2. Convert → WebP (auto-rotate via EXIF, downscale only).
  const { data, info } = await sharp(input)
    .rotate()
    .resize({
      width: MAX_EDGE,
      height: MAX_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer({ resolveWithObject: true });

  // 3. Upload WebP to the public prefix (immutable → long cache).
  const publicKey = `${PUBLIC_PREFIX}${imageId}.webp`;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: publicKey,
      Body: data,
      ContentType: "image/webp",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  // 4. Activate the DynamoDB row.
  const url = `${CDN_BASE_URL}/${publicKey}`;
  await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: buildItemKey(imageId, createdAt),
      UpdateExpression:
        "SET #s = :active, #u = :url, #w = :w, #h = :h, sizeBytes = :sz",
      ExpressionAttributeNames: {
        "#s": "status",
        "#u": "url",
        "#w": "width",
        "#h": "height",
      },
      ExpressionAttributeValues: {
        ":active": "active",
        ":url": url,
        ":w": info.width,
        ":h": info.height,
        // Store the ORIGINAL upload size (what the shop owner recognizes).
        // Change to `data.length` if you'd rather track the served WebP size.
        ":sz": originalSize,
      },
    }),
  );

  console.log(`Processed ${key} → ${publicKey} (${info.width}x${info.height})`);
}

/**
 * The ONLY place that encodes the DynamoDB key. Matches the single-table design
 * in backend/ARCHITECTURE.md (PK="IMAGE", SK="<createdAt>#<id>"). If the API
 * Lambda writes the row with a different key, change this to match.
 */
function buildItemKey(imageId: string, createdAt: string) {
  return { PK: "IMAGE", SK: `${createdAt}#${imageId}` };
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

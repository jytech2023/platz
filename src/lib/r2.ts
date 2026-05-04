import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getEndpoint(): string {
  if (process.env.R2_S3_ENDPOINT) return process.env.R2_S3_ENDPOINT;
  if (process.env.R2_ACCOUNT_ID) {
    return `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  }
  throw new Error("R2 endpoint not configured (set R2_S3_ENDPOINT or R2_ACCOUNT_ID)");
}

// Bucket: from R2_BUCKET_NAME. If R2_KEY_PREFIX is set, use it. Otherwise,
// for backwards compatibility, allow R2_BUCKET_NAME="bucket/prefix" form.
function getBucketAndPrefix(): { bucket: string; prefix: string } {
  const raw = String(process.env.R2_BUCKET_NAME || "").replace(/^\/+|\/+$/g, "");
  if (!raw) throw new Error("R2_BUCKET_NAME not configured");

  if (process.env.R2_KEY_PREFIX) {
    const prefix = process.env.R2_KEY_PREFIX.replace(/^\/+/, "");
    return {
      bucket: raw.split("/")[0],
      prefix: prefix.endsWith("/") || prefix === "" ? prefix : prefix + "/",
    };
  }

  const [bucket, ...prefixParts] = raw.split("/");
  const prefix = prefixParts.length ? prefixParts.join("/") + "/" : "";
  return { bucket, prefix };
}

function getClient(): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: getEndpoint(),
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

function withPrefix(key: string, prefix: string): string {
  const cleanKey = key.replace(/^\/+/, "");
  return cleanKey.startsWith(prefix) ? cleanKey : prefix + cleanKey;
}

export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const { bucket, prefix } = getBucketAndPrefix();
  const fullKey = withPrefix(key, prefix);
  const client = getClient();
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: fullKey,
      Body: buffer,
      ContentType: contentType,
    })
  );
  const publicBase = String(process.env.R2_PUBLIC_URL || "").replace(/\/+$/, "");
  return publicBase ? `${publicBase}/${fullKey}` : fullKey;
}

export async function deleteFile(key: string): Promise<void> {
  const { bucket, prefix } = getBucketAndPrefix();
  const fullKey = withPrefix(key, prefix);
  const client = getClient();
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: fullKey,
    })
  );
}

/**
 * Generate a short-lived presigned GET URL for an R2 object.
 * Use this to grant temporary access without exposing credentials.
 *
 * @param key  Object key (with or without the configured prefix).
 * @param expiresInSeconds Default 300 (5 min). R2 max ≈ 7 days (604800).
 * @param downloadFilename If set, forces Content-Disposition: attachment with this name.
 */
export async function getPresignedDownloadUrl(
  key: string,
  expiresInSeconds = 300,
  downloadFilename?: string
): Promise<string> {
  const { bucket, prefix } = getBucketAndPrefix();
  const fullKey = withPrefix(key, prefix);
  const client = getClient();
  const cmd = new GetObjectCommand({
    Bucket: bucket,
    Key: fullKey,
    ...(downloadFilename
      ? { ResponseContentDisposition: `attachment; filename="${downloadFilename}"` }
      : {}),
  });
  return getSignedUrl(client, cmd, { expiresIn: expiresInSeconds });
}

export function getR2Key(key: string): string {
  const { prefix } = getBucketAndPrefix();
  return withPrefix(key, prefix);
}

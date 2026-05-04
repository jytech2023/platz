#!/usr/bin/env node

/**
 * One-off: upload all local catalog PDFs (public/catalogs/*.pdf) to R2.
 * Idempotent — re-running just overwrites.
 *
 * Usage: node scripts/upload-catalogs-to-r2.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
loadEnv({ path: path.join(ROOT, ".env.local") });

const required = [
  "R2_S3_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME",
  "R2_PUBLIC_URL",
];
for (const k of required) {
  if (!process.env[k]) {
    console.error(`Missing env: ${k}`);
    process.exit(1);
  }
}

function parseBucketAndPrefix(bucketName, prefixEnv) {
  const trimmed = String(bucketName || "").replace(/^\/+|\/+$/g, "");
  if (!trimmed) throw new Error("R2_BUCKET_NAME not set");
  if (prefixEnv) {
    const p = prefixEnv.replace(/^\/+/, "");
    return {
      bucket: trimmed.split("/")[0],
      prefix: p === "" || p.endsWith("/") ? p : p + "/",
    };
  }
  const [bucket, ...prefixParts] = trimmed.split("/");
  const prefix = prefixParts.length ? prefixParts.join("/") + "/" : "";
  return { bucket, prefix };
}

const { bucket, prefix } = parseBucketAndPrefix(
  process.env.R2_BUCKET_NAME,
  process.env.R2_KEY_PREFIX
);
const publicBase = process.env.R2_PUBLIC_URL.replace(/\/+$/, "");

const client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const catalogsDir = path.join(ROOT, "public", "catalogs");
const files = fs
  .readdirSync(catalogsDir)
  .filter((f) => f.toLowerCase().endsWith(".pdf"));

if (files.length === 0) {
  console.log("No catalog PDFs found.");
  process.exit(0);
}

console.log(`Uploading ${files.length} catalog(s) to bucket=${bucket}\n`);

for (const file of files) {
  const filePath = path.join(catalogsDir, file);
  const buf = fs.readFileSync(filePath);
  const key = `${prefix}catalogs/${file}`;
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buf,
      ContentType: "application/pdf",
    })
  );
  const url = `${publicBase}/${key}`;
  console.log(`  ${file}  (${(buf.length / 1024).toFixed(1)} KiB)`);
  console.log(`  → ${url}\n`);
}

console.log("Done.");

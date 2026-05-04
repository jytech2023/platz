#!/usr/bin/env node

/**
 * One-off test:
 *   1. Fetch a sample PDF from platz-ltd.co.jp
 *   2. Upload to R2
 *   3. Send via Resend with the PDF as an attachment + R2 public link in body
 *
 * Usage: node scripts/test-pdf-email.mjs [recipient@example.com] [pdfUrl]
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
loadEnv({ path: path.join(ROOT, ".env.local") });

const recipient = process.argv[2] || "jay.lin@usproglove.com";
const pdfUrl =
  process.argv[3] ||
  "https://www.platz-ltd.co.jp/whatnew/pdf/2026/20260414_gw.pdf";

const required = [
  "RESEND_API_KEY",
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

async function fetchPdf(url) {
  console.log(`Fetching: ${url}`);
  const res = await fetch(url, {
    headers: { "User-Agent": "PlatzPdfTest/1.0" },
  });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  const ct = res.headers.get("content-type") || "";
  if (!ct.toLowerCase().includes("pdf") && !url.endsWith(".pdf")) {
    console.warn(`  warn: content-type is ${ct}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  console.log(`  ok: ${(buf.length / 1024).toFixed(1)} KiB`);
  return { buf, contentType: ct || "application/pdf" };
}

function parseBucketAndPrefix(value) {
  // R2_BUCKET_NAME may be "bucket" or "bucket/prefix/path".
  const trimmed = String(value || "").replace(/^\/+|\/+$/g, "");
  const [bucket, ...prefixParts] = trimmed.split("/");
  const prefix = prefixParts.length ? prefixParts.join("/") + "/" : "";
  return { bucket, prefix };
}

async function uploadToR2(buf, key, contentType) {
  const { bucket, prefix } = parseBucketAndPrefix(process.env.R2_BUCKET_NAME);
  const fullKey = prefix + key;
  console.log(`Uploading to R2: bucket=${bucket} key=${fullKey}`);
  const client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: fullKey,
      Body: buf,
      ContentType: contentType,
    })
  );
  const publicUrl = `${process.env.R2_PUBLIC_URL.replace(/\/+$/, "")}/${fullKey}`;
  console.log(`  ok: ${publicUrl}`);
  return publicUrl;
}

async function sendEmail({ to, filename, buf, publicUrl, sourceUrl }) {
  console.log(`Sending email to: ${to}`);
  const subject = `Your requested PDF: ${filename}`;
  const html = `
    <div style="font-family: -apple-system, system-ui, sans-serif; line-height: 1.5; color: #1f2937;">
      <p>Hi,</p>
      <p>Thanks for your interest in Platz. The requested document is attached to this email.</p>
      <p>If your email client cannot display attachments, you can also download it here:</p>
      <p><a href="${publicUrl}" style="color: #0070C0;">${publicUrl}</a></p>
      <p style="color: #6b7280; font-size: 12px;">Original source: <a href="${sourceUrl}" style="color: #6b7280;">${sourceUrl}</a></p>
      <p style="color: #6b7280; font-size: 12px;">— Platz</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Platz <platz@notify.usproglove.com>",
      to: [to],
      subject,
      html,
      attachments: [
        {
          filename,
          content: buf.toString("base64"),
        },
      ],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error("  resend error:", res.status, data);
    throw new Error(`Resend failed: ${res.status}`);
  }
  console.log(`  ok: id=${data.id}`);
  return data;
}

async function main() {
  const filename = path.basename(new URL(pdfUrl).pathname) || "document.pdf";
  const { buf, contentType } = await fetchPdf(pdfUrl);

  const ts = new Date().toISOString().slice(0, 10);
  const key = `news-pdf/${ts}/${filename}`;
  const publicUrl = await uploadToR2(buf, key, contentType);

  await sendEmail({
    to: recipient,
    filename,
    buf,
    publicUrl,
    sourceUrl: pdfUrl,
  });

  console.log("\nDone.");
  console.log(`  attachment: ${filename} (${(buf.length / 1024).toFixed(1)} KiB)`);
  console.log(`  r2:         ${publicUrl}`);
  console.log(`  recipient:  ${recipient}`);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});

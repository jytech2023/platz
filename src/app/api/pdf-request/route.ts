import { NextRequest, NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { uploadFile, getR2Key } from "@/lib/r2";

const ALLOWED_REMOTE_HOST = "www.platz-ltd.co.jp";
const LOCAL_PUBLIC_PREFIX = "/catalogs/";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PDF_BYTES = 30 * 1024 * 1024;

const TOKEN_TTL_DAYS = 7;
const TOKEN_MAX_USES = 5;

type PdfSource =
  | { kind: "local"; absPath: string; baseName: string; r2Key: string }
  | { kind: "remote"; url: URL; baseName: string; r2Key: string };

function resolvePdfSource(pdfUrl: string): PdfSource | { error: string } {
  if (!pdfUrl || typeof pdfUrl !== "string") return { error: "pdfUrl required" };

  if (pdfUrl.startsWith(LOCAL_PUBLIC_PREFIX)) {
    const safe = path.posix.normalize(pdfUrl);
    if (!safe.startsWith(LOCAL_PUBLIC_PREFIX)) return { error: "invalid pdfUrl" };
    const baseName = path.posix.basename(safe);
    if (!baseName.toLowerCase().endsWith(".pdf")) return { error: "not a pdf" };
    const absPath = path.join(process.cwd(), "public", safe.replace(/^\//, ""));
    return { kind: "local", absPath, baseName, r2Key: `catalogs/${baseName}` };
  }

  try {
    const url = new URL(pdfUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { error: "invalid protocol" };
    }
    if (url.hostname !== ALLOWED_REMOTE_HOST) {
      return { error: `host not allowed: ${url.hostname}` };
    }
    const baseName = path.posix.basename(url.pathname) || "document.pdf";
    if (!baseName.toLowerCase().endsWith(".pdf")) return { error: "not a pdf" };
    const r2Key = `news-pdf${url.pathname}`.replace(/\/+/g, "/");
    return { kind: "remote", url, baseName, r2Key };
  } catch {
    return { error: "invalid pdfUrl" };
  }
}

async function ensurePdfInR2(source: PdfSource): Promise<{ size: number }> {
  let buf: Buffer;
  if (source.kind === "local") {
    buf = await fs.readFile(source.absPath);
  } else {
    const res = await fetch(source.url.toString(), {
      headers: { "User-Agent": "PlatzPdfRequest/1.0" },
    });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    buf = Buffer.from(await res.arrayBuffer());
  }
  if (buf.length > MAX_PDF_BYTES) throw new Error("pdf too large");
  await uploadFile(buf, source.r2Key, "application/pdf");
  return { size: buf.length };
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function getOrigin(req: NextRequest): string {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  if (host) return `${proto}://${host}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return req.nextUrl.origin;
}

async function syncToBrevo(email: string, pdfTitle: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;
  await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      attributes: { PDF_REQUEST: true, PDF_TITLE: pdfTitle },
      listIds: [6],
      updateEnabled: true,
    }),
  }).catch(() => {});
}

async function sendDownloadEmail(opts: {
  to: string;
  pdfTitle: string;
  downloadUrl: string;
  expiresAt: Date;
  maxUses: number;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured");

  const expiresStr = opts.expiresAt.toUTCString();
  const html = `
    <div style="font-family:-apple-system,system-ui,sans-serif;line-height:1.5;color:#1f2937;max-width:560px;">
      <p>Hi,</p>
      <p>Thanks for your interest in Platz. Your requested document — <strong>${opts.pdfTitle}</strong> — is ready.</p>
      <p style="margin:24px 0;">
        <a href="${opts.downloadUrl}" style="display:inline-block;background:#0070C0;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
          Download PDF
        </a>
      </p>
      <p style="color:#6b7280;font-size:13px;">This link is valid until <strong>${expiresStr}</strong> and may be used up to <strong>${opts.maxUses}</strong> times.</p>
      <p style="color:#9ca3af;font-size:12px;margin-top:32px;">
        If the button doesn't work, copy this URL into your browser:<br/>
        <span style="word-break:break-all;">${opts.downloadUrl}</span>
      </p>
      <p style="color:#9ca3af;font-size:12px;">— Platz</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Platz <platz@notify.usproglove.com>",
      to: [opts.to],
      subject: `Your requested document: ${opts.pdfTitle}`,
      html,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(`Resend failed: ${res.status} ${JSON.stringify(data)}`);
  }
}

export async function POST(req: NextRequest) {
  let body: { email?: string; pdfUrl?: string; pdfTitle?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const pdfUrl = String(body.pdfUrl || "").trim();
  const pdfTitle = String(body.pdfTitle || "").trim() || "Platz document";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  const resolved = resolvePdfSource(pdfUrl);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: 400 });
  }

  try {
    await ensurePdfInR2(resolved);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed to load pdf" },
      { status: 502 }
    );
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  const fullKey = getR2Key(resolved.r2Key);

  try {
    await prisma.pdfDownload.create({
      data: {
        token,
        email,
        pdfKey: fullKey,
        pdfTitle,
        sourceUrl: resolved.kind === "remote" ? resolved.url.toString() : pdfUrl,
        expiresAt,
        maxUses: TOKEN_MAX_USES,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "db error", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }

  const origin = getOrigin(req);
  const downloadUrl = `${origin}/p/${token}`;

  try {
    await sendDownloadEmail({
      to: email,
      pdfTitle,
      downloadUrl,
      expiresAt,
      maxUses: TOKEN_MAX_USES,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "email send failed", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }

  // Background: persist lead. Non-blocking on the user-visible response.
  prisma.contact
    .upsert({
      where: { email },
      update: { isLead: true, source: "pdf-request" },
      create: { email, isLead: true, source: "pdf-request" },
    })
    .catch(() => {});
  syncToBrevo(email, pdfTitle);

  return NextResponse.json({ success: true, expiresAt });
}

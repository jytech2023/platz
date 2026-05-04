import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { getPresignedDownloadUrl } from "@/lib/r2";

const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes — enough to start the download

function expiredHtml(message: string): NextResponse {
  return new NextResponse(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Link no longer valid — Platz</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; background: #f9fafb; margin: 0; padding: 4rem 1rem; color: #1f2937; }
    .card { max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 2rem; text-align: center; }
    h1 { font-size: 1.25rem; margin: 0 0 .5rem; }
    p { color: #4b5563; line-height: 1.6; margin: .5rem 0; }
    a { color: #0070C0; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>This download link is no longer valid</h1>
    <p>${message}</p>
    <p><a href="/">Return to platz.jytech.us →</a></p>
    <p style="font-size: 12px; color: #9ca3af; margin-top: 1.5rem;">If you still need this document, please request it again from the original page.</p>
  </div>
</body>
</html>`,
    { status: 410, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function notFoundHtml(): NextResponse {
  return new NextResponse(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Link not found — Platz</title>
  <style>
    body { font-family: -apple-system, system-ui, sans-serif; background: #f9fafb; margin: 0; padding: 4rem 1rem; color: #1f2937; }
    .card { max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 2rem; text-align: center; }
    h1 { font-size: 1.25rem; margin: 0 0 .5rem; }
    p { color: #4b5563; line-height: 1.6; margin: .5rem 0; }
    a { color: #0070C0; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Link not found</h1>
    <p>This download link doesn't exist or has been revoked.</p>
    <p><a href="/">Return to platz.jytech.us →</a></p>
  </div>
</body>
</html>`,
    { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

function clientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip");
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  if (!token || token.length < 16) return notFoundHtml();

  const record = await prisma.pdfDownload.findUnique({ where: { token } });
  if (!record) return notFoundHtml();

  if (record.expiresAt.getTime() < Date.now()) {
    return expiredHtml("This link has expired.");
  }
  if (record.maxUses > 0 && record.useCount >= record.maxUses) {
    return expiredHtml(
      `This link has already been used the maximum number of times (${record.maxUses}).`
    );
  }

  // Generate a short-lived signed URL for the actual R2 object.
  const filename = path.posix.basename(record.pdfKey);
  let signedUrl: string;
  try {
    signedUrl = await getPresignedDownloadUrl(
      record.pdfKey,
      SIGNED_URL_TTL_SECONDS,
      filename
    );
  } catch {
    return new NextResponse("Download temporarily unavailable.", { status: 502 });
  }

  prisma.pdfDownload
    .update({
      where: { token },
      data: {
        useCount: { increment: 1 },
        firstUsedAt: record.firstUsedAt ?? new Date(),
        lastUsedAt: new Date(),
        lastUserAgent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
        lastIp: clientIp(req),
      },
    })
    .catch(() => {});

  return NextResponse.redirect(signedUrl, 302);
}

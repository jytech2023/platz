CREATE TABLE IF NOT EXISTS "PdfDownload" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pdfKey" TEXT NOT NULL,
    "pdfTitle" TEXT NOT NULL,
    "sourceUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 0,
    "useCount" INTEGER NOT NULL DEFAULT 0,
    "firstUsedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "lastUserAgent" TEXT,
    "lastIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PdfDownload_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PdfDownload_token_key" ON "PdfDownload"("token");
CREATE INDEX IF NOT EXISTS "PdfDownload_email_idx" ON "PdfDownload"("email");
CREATE INDEX IF NOT EXISTS "PdfDownload_expiresAt_idx" ON "PdfDownload"("expiresAt");

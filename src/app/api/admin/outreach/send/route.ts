import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth0";
import { trackApiUsage } from "@/lib/api-usage";

const UNAUTHORIZED = NextResponse.json({ error: "Unauthorized" }, { status: 403 });

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return UNAUTHORIZED;

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json({ error: "Resend API key not configured" }, { status: 503 });
  }

  const body = await req.json();
  const { emailIds, campaignId } = body as { emailIds?: string[]; campaignId?: string };

  const where: Record<string, unknown> = { status: "approved" };
  if (emailIds?.length) where.id = { in: emailIds };
  else if (campaignId) where.campaignId = campaignId;
  else return NextResponse.json({ error: "emailIds or campaignId required" }, { status: 400 });

  const emails = await prisma.outreachEmail.findMany({
    where,
    include: {
      contact: true,
      campaign: { select: { senderName: true, senderEmail: true } },
    },
    take: 100,
  });

  let sent = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      const fromEmail = email.campaign.senderEmail || "platz@notify.usproglove.com";

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${email.campaign.senderName} <${fromEmail}>`,
          to: [email.contact.email],
          subject: email.subject,
          html: email.htmlContent,
        }),
      });

      if (res.ok) {
        await prisma.outreachEmail.update({
          where: { id: email.id },
          data: { status: "sent", sentAt: new Date() },
        });
        await trackApiUsage("resend", "outreach_send", true);
        sent++;
      } else {
        const errText = await res.text();
        await prisma.outreachEmail.update({
          where: { id: email.id },
          data: { status: "failed", error: errText.slice(0, 500) },
        });
        await trackApiUsage("resend", "outreach_send", false);
        failed++;
      }
    } catch (e) {
      await prisma.outreachEmail.update({
        where: { id: email.id },
        data: { status: "failed", error: e instanceof Error ? e.message : "Unknown error" },
      });
      failed++;
    }

    // Rate limit: 200ms between sends
    await new Promise((r) => setTimeout(r, 200));
  }

  return NextResponse.json({ sent, failed, total: emails.length });
}

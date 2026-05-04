import { NextRequest, NextResponse } from "next/server";
import { enrichContact } from "@/lib/apollo";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, message } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: "Service unavailable" },
        { status: 503 }
      );
    }

    // Enrich contact via Apollo
    const enrichment = await enrichContact(email);

    // Save to our database
    await prisma.contact.upsert({
      where: { email },
      update: {
        firstName: name || enrichment?.firstName || undefined,
        lastName: enrichment?.lastName || undefined,
        company: enrichment?.company || undefined,
        jobTitle: enrichment?.title || undefined,
        industry: enrichment?.industry || undefined,
        linkedinUrl: enrichment?.linkedinUrl || undefined,
        city: enrichment?.city || undefined,
        country: enrichment?.country || undefined,
        companySize: enrichment?.companySize || undefined,
        companyWebsite: enrichment?.companyWebsite || undefined,
        message: message || undefined,
        isLead: true,
      },
      create: {
        email,
        firstName: name || enrichment?.firstName || "",
        lastName: enrichment?.lastName,
        company: enrichment?.company,
        jobTitle: enrichment?.title,
        industry: enrichment?.industry,
        linkedinUrl: enrichment?.linkedinUrl,
        city: enrichment?.city,
        country: enrichment?.country,
        companySize: enrichment?.companySize,
        companyWebsite: enrichment?.companyWebsite,
        message,
        source: "form",
        isLead: true,
      },
    });

    // Save to contact list with enriched data
    const attributes: Record<string, string> = {
      FIRSTNAME: name || enrichment?.firstName || "",
      MESSAGE: message || "",
    };
    if (enrichment?.lastName) attributes.LASTNAME = enrichment.lastName;
    if (enrichment?.company) attributes.COMPANY = enrichment.company;
    if (enrichment?.title) attributes.JOB_TITLE = enrichment.title;
    if (enrichment?.industry) attributes.INDUSTRY = enrichment.industry;
    if (enrichment?.linkedinUrl) attributes.LINKEDIN = enrichment.linkedinUrl;
    if (enrichment?.country) attributes.COUNTRY = enrichment.country;
    if (enrichment?.city) attributes.CITY = enrichment.city;

    const brevoApiKey = process.env.BREVO_API_KEY;
    if (brevoApiKey) {
      const contactRes = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          attributes,
          // List 5: "Platz AIBOX Leads"
          listIds: [5],
          updateEnabled: true,
        }),
      });

      if (!contactRes.ok) {
        const err = await contactRes.json();
        if (err.code !== "duplicate_parameter") {
          return NextResponse.json(
            { error: "Failed to register" },
            { status: 500 }
          );
        }
      }
    }

    // Build enrichment section for notification email
    let enrichmentHtml = "";
    if (enrichment) {
      const fields = [
        enrichment.title && `<strong>Title:</strong> ${enrichment.title}`,
        enrichment.company && `<strong>Company:</strong> ${enrichment.company}`,
        enrichment.industry &&
          `<strong>Industry:</strong> ${enrichment.industry}`,
        enrichment.companySize &&
          `<strong>Company Size:</strong> ${enrichment.companySize}`,
        enrichment.companyWebsite &&
          `<strong>Website:</strong> <a href="${enrichment.companyWebsite}">${enrichment.companyWebsite}</a>`,
        enrichment.linkedinUrl &&
          `<strong>LinkedIn:</strong> <a href="${enrichment.linkedinUrl}">${enrichment.linkedinUrl}</a>`,
        enrichment.city &&
          enrichment.country &&
          `<strong>Location:</strong> ${enrichment.city}, ${enrichment.country}`,
      ].filter(Boolean);

      if (fields.length > 0) {
        enrichmentHtml = `
          <h3 style="margin-top:16px;color:#333;">Contact Intelligence</h3>
          ${fields.map((f) => `<p style="margin:4px 0;">${f}</p>`).join("")}
        `;
      }
    }

    const notificationEmails = (process.env.NOTIFICATION_EMAILS || "")
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean);

    if (notificationEmails.length === 0) {
      notificationEmails.push("jay.lin@usproglove.com");
    }

    // Send notification email to sales team
    const notificationRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Platz <platz@notify.usproglove.com>",
        to: notificationEmails,
        subject: `New Inquiry from ${name || enrichment?.firstName || "Website Visitor"}${enrichment?.company ? ` (${enrichment.company})` : ""}`,
        html: `
          <h2>New Platz AIBOX Inquiry</h2>
          <p><strong>Name:</strong> ${name || "N/A"}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p>${(message || "No message provided.").replace(/\n/g, "<br>")}</p>
          ${enrichmentHtml}
          <hr>
          <p style="color:#888;font-size:12px;">Sent from platz.jytech.us contact form</p>
        `,
      }),
    });

    if (!notificationRes.ok) {
      const errText = await notificationRes.text();
      return NextResponse.json(
        { error: `Failed to send notification: ${errText}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    try {
      if (err instanceof Error) {
        console.error("/api/subscribe error:", err.message);
        console.error(err.stack);
      } else {
        console.error("/api/subscribe error:", err);
      }
    } catch (logErr) {
      // ignore logging failures
      console.error("/api/subscribe logging failed:", logErr);
    }

    if (process.env.NODE_ENV !== "production") {
      const msg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

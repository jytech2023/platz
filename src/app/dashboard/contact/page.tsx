"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        }
      ) => string;
      reset: (widgetId?: string) => void;
    };
  }
}

export default function ContactPage() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileError, setTurnstileError] = useState("");
  const turnstileRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetId = useRef<string | null>(null);
  const { dict } = useI18n();
  const t = dict.dashboard?.contact || {};
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!turnstileSiteKey || typeof window === "undefined") return;

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"]'
    );

    const renderWidget = () => {
      if (!window.turnstile || !turnstileRef.current || turnstileWidgetId.current) return;

      turnstileWidgetId.current = window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        theme: "light",
        callback: (token) => {
          setTurnstileToken(token);
          setTurnstileError("");
        },
        "expired-callback": () => {
          setTurnstileToken("");
          setTurnstileError("Verification expired. Please try again.");
        },
        "error-callback": () => {
          setTurnstileToken("");
          setTurnstileError("Verification failed. Please refresh and try again.");
        },
      });
      setTurnstileReady(true);
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      script.onload = renderWidget;
      document.head.appendChild(script);
      return () => {
        script.remove();
      };
    }

    if (window.turnstile) {
      renderWidget();
      return;
    }

    const onLoad = () => renderWidget();
    existingScript.addEventListener("load", onLoad);
    return () => existingScript.removeEventListener("load", onLoad);
  }, [turnstileSiteKey]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    if (!turnstileSiteKey) {
      setTurnstileError("Turnstile is not configured.");
      return;
    }
    if (!turnstileToken) {
      setTurnstileError("Please complete the verification first.");
      return;
    }
    setSubmitting(true);

    try {
      const res = await fetch("/api/dashboard/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, type: "support", message, turnstileToken }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => null);
        setTurnstileError(data?.error || "Failed to send message.");
        window.turnstile?.reset(turnstileWidgetId.current ?? undefined);
        setTurnstileToken("");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="text-4xl mb-4">&#9989;</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{t.sent || "Message Sent"}</h2>
          <p className="text-sm text-gray-500 mb-6">{t.sentDesc || "We'll get back to you as soon as possible."}</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={() => router.push("/dashboard/tickets")} className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
              {t.viewTickets || "View My Tickets"}
            </button>
            <button onClick={() => { setSubmitted(false); setSubject(""); setMessage(""); }} className="text-sm text-gray-500 hover:text-gray-700">
              {t.sendAnother || "Send Another"}
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">{t.title || "Contact Us"}</h2>

      <div className="grid gap-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <a href="https://calendly.com/platz" target="_blank" rel="noopener noreferrer"
            className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors">
            <h3 className="font-semibold text-gray-900 text-sm">{t.bookDemo || "Book a Demo"}</h3>
            <p className="text-xs text-gray-500 mt-1">{t.bookDemoDesc || "Schedule a live product demonstration"}</p>
          </a>
          <a href="mailto:jay.lin@usproglove.com" className="bg-white rounded-lg border border-gray-200 p-5 hover:border-gray-300 transition-colors">
            <h3 className="font-semibold text-gray-900 text-sm">{t.emailUs || "Email Us"}</h3>
            <p className="text-xs text-gray-500 mt-1">jay.lin@usproglove.com</p>
          </a>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">{t.sendMessage || "Send a Message"}</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.subject || "Subject"}</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder={t.subjectPlaceholder || "What can we help with?"}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-gray-900" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t.message || "Message"}</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder={t.messagePlaceholder || "Describe your question or request..."}
              rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:border-gray-900" required />
          </div>
          <div className="space-y-2">
            <div ref={turnstileRef} />
            {!turnstileSiteKey && (
              <p className="text-xs text-amber-600">
                Turnstile is not configured yet. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY and TURNSTILE_SECRET_KEY.
              </p>
            )}
            {turnstileError && <p className="text-xs text-red-600">{turnstileError}</p>}
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-gray-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed">
            {submitting ? (t.sending || "Sending...") : (t.send || "Send Message")}
          </button>
          {!turnstileReady && turnstileSiteKey && (
            <p className="text-xs text-gray-500">Loading verification widget...</p>
          )}
        </form>
      </div>
    </main>
  );
}

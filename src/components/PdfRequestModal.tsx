"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "submitting" | "success" | "error";

export default function PdfRequestModal({
  open,
  onClose,
  pdfUrl,
  pdfTitle,
}: {
  open: boolean;
  onClose: () => void;
  pdfUrl: string;
  pdfTitle: string;
}) {
  const { dict } = useI18n();
  const t = dict.pdfRequest;

  const [email, setEmail] = useState(() => {
    if (typeof document === "undefined") return "";
    const stored = document.cookie
      .split("; ")
      .find((c) => c.startsWith("platz_pdf_email="))
      ?.split("=")[1];
    return stored ? decodeURIComponent(stored) : "";
  });
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus("error");
      setErrorMsg(t.errorInvalidEmail);
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/pdf-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, pdfUrl, pdfTitle }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data?.error ? `${t.errorGeneric} (${data.error})` : t.errorGeneric);
        return;
      }
      // Remember email for 30 days
      const maxAge = 30 * 24 * 60 * 60;
      document.cookie = `platz_pdf_email=${encodeURIComponent(
        trimmed
      )}; path=/; max-age=${maxAge}; SameSite=Lax`;
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMsg(t.errorGeneric);
    }
  }

  const successMessage =
    typeof t.success === "string"
      ? t.success.replace("{email}", email.trim())
      : "Sent.";

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 sm:p-7"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="pdf-request-title"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t.close}
          className="float-right text-gray-400 hover:text-gray-600 transition-colors -mr-2 -mt-2 p-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {status === "success" ? (
          <div className="text-center py-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-800 leading-relaxed">{successMessage}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full bg-stone-900 text-white py-2.5 rounded-lg font-medium hover:bg-stone-800 transition-colors"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <>
            <h2 id="pdf-request-title" className="text-xl font-semibold text-gray-900 mb-1.5 pr-6">
              {t.title}
            </h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">{t.description}</p>

            <div className="bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 mb-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-0.5">
                {t.documentLabel}
              </p>
              <p className="text-sm text-gray-800 font-medium truncate">{pdfTitle}</p>
            </div>

            <form onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition"
                disabled={status === "submitting"}
              />

              {status === "error" && errorMsg && (
                <p className="mt-2 text-sm text-red-600">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === "submitting"}
                className="mt-4 w-full bg-accent text-white py-2.5 rounded-lg font-medium hover:bg-[#005baa] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "submitting" ? t.submitting : t.submit}
              </button>

              <p className="mt-3 text-xs text-gray-400 leading-relaxed">{t.privacy}</p>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

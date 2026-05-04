"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";

export default function CTA() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const { dict, locale } = useI18n();
  const t = dict.cta;
  const supportPoints =
    locale === "en"
      ? [
          "Request pricing for hospital, care-facility, or home-care projects",
          "Get matched product catalogs and key specifications",
          "Talk through distributor, pilot, or bulk-order requirements",
        ]
      : [
          "获取医院、护理机构或居家项目报价",
          "获得匹配的产品目录与关键规格",
          "沟通经销合作、试用评估或批量采购需求",
        ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("loading");
    const form = e.currentTarget;
    const formData = new FormData(form);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          message: formData.get("message"),
        }),
      });
      if (res.ok) { setStatus("success"); form.reset(); }
      else { setStatus("error"); }
    } catch { setStatus("error"); }
  };

  const inputClass =
    "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-accent focus:bg-white/10 focus:ring-2 focus:ring-accent/30 transition";
  const labelClass = "block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2";

  return (
    <section id="contact" className="py-24 bg-[linear-gradient(135deg,#0f1b2d_0%,#142339_45%,#0b1320_100%)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-300">{t.title}</p>
            <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-bold leading-[1.15] tracking-tight">{t.subtitle}</h2>

            <ol className="mt-10 space-y-3">
              {supportPoints.map((point, i) => (
                <li key={point} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 transition hover:border-white/20 hover:bg-white/[0.07]">
                  <span className="mt-0.5 shrink-0 font-mono text-xs font-semibold text-accent tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-6 text-gray-200">{point}</p>
                </li>
              ))}
            </ol>

            <div className="mt-10 border-t border-white/10 pt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400 mb-4">
                {locale === "en" ? "Prefer to talk live?" : "更想直接对话？"}
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <a href="https://calendly.com/sienovo" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-gray-900 px-5 py-2.5 rounded-full font-medium hover:bg-gray-100 transition-colors text-sm">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  {t.scheduleDemo}
                </a>
                <a href="mailto:jay.lin@usproglove.us" className="text-sm text-blue-200 hover:text-white transition-colors">
                  jay.lin@usproglove.us
                </a>
              </div>
            </div>
          </div>

          <div className="bg-white/[0.04] rounded-[1.75rem] border border-white/10 p-7 sm:p-9 text-left w-full backdrop-blur-sm">
          {status === "success" ? (
            <div className="text-center py-8">
              <div className="mx-auto w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{t.successTitle}</h3>
              <p className="text-gray-300 text-sm">{t.successMessage}</p>
              <button onClick={() => setStatus("idle")} className="mt-5 text-accent hover:underline text-sm">
                {t.sendAnother}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className={labelClass}>{t.nameLabel}</label>
                  <input type="text" id="name" name="name" required className={inputClass} placeholder={t.namePlaceholder} />
                </div>
                <div>
                  <label htmlFor="email" className={labelClass}>{t.emailLabel}</label>
                  <input type="email" id="email" name="email" required className={inputClass} placeholder={t.emailPlaceholder} />
                </div>
              </div>
              <div>
                <label htmlFor="message" className={labelClass}>{t.messageLabel}</label>
                <textarea id="message" name="message" rows={5} className={inputClass} placeholder={t.messagePlaceholder} />
              </div>
              <button type="submit" disabled={status === "loading"} className="w-full bg-accent hover:bg-[#005baa] disabled:bg-accent/50 text-white py-3.5 rounded-xl font-semibold tracking-wide transition-colors">
                {status === "loading" ? t.sending : t.submit}
              </button>
              {status === "error" && <p className="text-red-400 text-sm text-center">{t.errorMessage}</p>}
              <p className="text-xs text-gray-500 text-center">
                {locale === "en"
                  ? "We reply within 24 hours."
                  : "我们将在 24 小时内回复。"}
              </p>
            </form>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}

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

  return (
    <section id="contact" className="py-20 bg-[linear-gradient(135deg,#0f1b2d_0%,#142339_45%,#0b1320_100%)] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">{t.title}</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-bold">{t.subtitle}</h2>
            <div className="mt-8 space-y-4">
              {supportPoints.map((point) => (
                <div key={point} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
                  <span className="mt-1 inline-block h-2.5 w-2.5 rounded-full bg-accent" />
                  <p className="text-sm leading-6 text-gray-200">{point}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <a href="https://calendly.com/platz" target="_blank" rel="noopener noreferrer" className="bg-white text-gray-900 px-6 py-3 rounded-full font-medium hover:bg-gray-100 transition-colors text-sm">
                {t.scheduleDemo}
              </a>
              <a href="mailto:leo.liu@jytech.us" className="text-blue-200 hover:text-white text-sm">
                leo.liu@jytech.us
              </a>
            </div>
          </div>

          <div className="bg-white/6 rounded-[1.75rem] border border-white/10 p-8 text-left max-w-xl lg:ml-auto">
          {status === "success" ? (
            <div className="text-center py-4">
              <div className="text-3xl mb-3">&#10003;</div>
              <h3 className="text-lg font-bold text-white mb-2">{t.successTitle}</h3>
              <p className="text-gray-300 text-sm">{t.successMessage}</p>
              <button onClick={() => setStatus("idle")} className="mt-4 text-accent hover:underline text-sm">
                {t.sendAnother}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">{t.nameLabel}</label>
                <input type="text" id="name" name="name" required className="w-full px-4 py-3 bg-gray-900/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-accent" placeholder={t.namePlaceholder} />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">{t.emailLabel}</label>
                <input type="email" id="email" name="email" required className="w-full px-4 py-3 bg-gray-900/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-accent" placeholder={t.emailPlaceholder} />
              </div>
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-1">{t.messageLabel}</label>
                <textarea id="message" name="message" rows={4} className="w-full px-4 py-3 bg-gray-900/70 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-accent" placeholder={t.messagePlaceholder} />
              </div>
              <button type="submit" disabled={status === "loading"} className="w-full bg-accent hover:bg-[#005baa] disabled:bg-accent/50 text-white py-3 rounded-full font-medium transition-colors">
                {status === "loading" ? t.sending : t.submit}
              </button>
              {status === "error" && <p className="text-red-400 text-sm text-center">{t.errorMessage}</p>}
            </form>
          )}
          </div>
        </div>
      </div>
    </section>
  );
}

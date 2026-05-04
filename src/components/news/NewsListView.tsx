"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

type Item = {
  slug: string;
  date: string;
  title: string;
};

export default function NewsListView({
  items,
  total,
  currentPage,
  totalPages,
}: {
  items: Item[];
  total: number;
  currentPage: number;
  totalPages: number;
}) {
  const { dict, locale } = useI18n();
  const t = dict.news;
  const dateFmt = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              {t.title}
            </h1>
            <p className="text-sm text-gray-500">{t.subtitle}</p>
            <p className="text-xs text-gray-400 mt-1">{total} entries</p>
          </div>
          <a
            href="/news/rss.xml"
            target="_blank"
            rel="noopener noreferrer"
            title={t.rssTitle}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-accent transition-colors mt-2 shrink-0"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6.18 15.64a2.18 2.18 0 0 1 2.18 2.18C8.36 19 7.38 20 6.18 20C5 20 4 19 4 17.82a2.18 2.18 0 0 1 2.18-2.18M4 4.44A15.56 15.56 0 0 1 19.56 20h-2.83A12.73 12.73 0 0 0 4 7.27V4.44m0 5.66a9.9 9.9 0 0 1 9.9 9.9h-2.83A7.07 7.07 0 0 0 4 12.93V10.1z" />
            </svg>
            RSS
          </a>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 text-gray-400">{t.empty}</div>
        ) : (
          <ul className="divide-y divide-gray-200 bg-white rounded-lg border border-gray-200">
            {items.map((item) => {
              const formatted = item.date
                ? dateFmt.format(new Date(item.date))
                : item.date;
              return (
                <li key={item.slug}>
                  <Link
                    href={`/news/${item.slug}`}
                    className="group flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <time className="text-xs text-gray-400 font-mono shrink-0 sm:w-28">
                      {formatted}
                    </time>
                    <span className="text-sm text-gray-800 group-hover:text-accent transition-colors leading-snug">
                      {item.title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-2 text-sm">
            {currentPage > 1 && (
              <Link
                href={`/news?page=${currentPage - 1}`}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                {t.previous}
              </Link>
            )}
            <span className="px-3 py-2 text-gray-500">
              {currentPage} / {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/news?page=${currentPage + 1}`}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
              >
                {t.next}
              </Link>
            )}
          </nav>
        )}
      </div>
    </main>
  );
}

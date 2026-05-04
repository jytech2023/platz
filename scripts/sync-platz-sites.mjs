#!/usr/bin/env node

/**
 * Crawl and sync content from official Platz websites into local MDX files.
 *
 * Sources:
 * - https://www.platz-ltd.co.jp/
 * - http://www.platz-cn.com/
 * - https://www.platz-ltd.com/
 *
 * Output:
 * - content/site-sync/<domain>/<slug>.mdx
 * - content/site-sync/manifest.json
 *
 * Usage:
 *   node scripts/sync-platz-sites.mjs
 *   node scripts/sync-platz-sites.mjs --max-pages 80 --max-depth 3
 *   node scripts/sync-platz-sites.mjs --dry-run
 */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import * as cheerio from "cheerio";
import TurndownService from "turndown";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
loadEnv({ path: path.join(ROOT, ".env.local") });

const SOURCE_SITES = [
  "https://www.platz-ltd.co.jp/",
  "http://www.platz-cn.com/",
  "https://www.platz-ltd.com/",
];

const DEFAULT_MAX_PAGES = 120;
const DEFAULT_MAX_DEPTH = 3;
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_OUT_DIR = path.join(ROOT, "content", "site-sync");
const NEWS_DIR = path.join(ROOT, "content", "news");
const NEWS_SOURCE_FILE = path.join(
  ROOT,
  "content",
  "site-sync",
  "platz-ltd-co-jp",
  "whatnew--entry-html.mdx"
);
const NEWS_SOURCE_URL = "https://www.platz-ltd.co.jp/whatnew/entry.html";
const NEWS_SOURCE_DOMAIN = "www.platz-ltd.co.jp";
const firecrawlApiKey = process.env.FIRECRAWL_API_KEY || process.env.FIRECLOWER_API_KEY || "";

function getArgValue(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return fallback;
  const next = process.argv[idx + 1];
  if (!next || next.startsWith("--")) return fallback;
  return next;
}

function hasArg(name) {
  return process.argv.includes(name);
}

const maxPages = Number(getArgValue("--max-pages", String(DEFAULT_MAX_PAGES)));
const maxDepth = Number(getArgValue("--max-depth", String(DEFAULT_MAX_DEPTH)));
const timeoutMs = Number(getArgValue("--timeout", String(DEFAULT_TIMEOUT_MS)));
const outDir = getArgValue("--out-dir", DEFAULT_OUT_DIR);
const dryRun = hasArg("--dry-run");
const newsOnly = hasArg("--news-only");

if (!Number.isFinite(maxPages) || maxPages <= 0) {
  throw new Error("--max-pages must be a positive number");
}
if (!Number.isFinite(maxDepth) || maxDepth < 0) {
  throw new Error("--max-depth must be a non-negative number");
}
if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  throw new Error("--timeout must be a positive number");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function sanitizeSegment(segment) {
  return segment
    .toLowerCase()
    .replace(/%[0-9a-f]{2}/gi, "")
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function pathnameToSlug(pathname) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  if (clean === "/") return "home";
  const parts = clean
    .split("/")
    .filter(Boolean)
    .map((p) => sanitizeSegment(decodeURIComponent(p)))
    .filter(Boolean);
  if (parts.length === 0) return "home";
  return parts.join("--");
}

function normalizeUrl(urlLike) {
  const u = new URL(urlLike);
  u.hash = "";
  // Avoid duplicate URLs caused by trailing slash differences.
  if (u.pathname.length > 1) {
    u.pathname = u.pathname.replace(/\/+$/, "");
  }
  return u.toString();
}

function isLikelyHtmlPath(pathname) {
  const blockedExt = [
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".webp",
    ".svg",
    ".ico",
    ".pdf",
    ".zip",
    ".rar",
    ".7z",
    ".doc",
    ".docx",
    ".xls",
    ".xlsx",
    ".ppt",
    ".pptx",
    ".mp4",
    ".mp3",
    ".avi",
    ".mov",
    ".json",
    ".xml",
    ".rss",
    ".txt",
  ];
  return !blockedExt.some((ext) => pathname.toLowerCase().endsWith(ext));
}

async function fetchText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "PlatzSiteSyncBot/1.0 (+https://www.platz-ltd.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return { ok: false, status: res.status, text: "" };
    }

    const type = res.headers.get("content-type") || "";
    if (!type.includes("text/html") && !type.includes("application/xhtml+xml")) {
      return { ok: false, status: res.status, text: "" };
    }

    const text = await res.text();
    return { ok: true, status: res.status, text };
  } catch {
    return { ok: false, status: 0, text: "" };
  } finally {
    clearTimeout(timer);
  }
}

async function scrapeWithFirecrawl(url) {
  if (!firecrawlApiKey) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firecrawlApiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const markdown = data?.data?.markdown;
    if (!markdown || typeof markdown !== "string") return null;

    return {
      title: data?.data?.metadata?.title || "",
      description: data?.data?.metadata?.description || "",
      markdown,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function findBestContentRoot($) {
  const selectors = [
    "main article",
    "article",
    "main",
    "#content",
    ".content",
    ".entry-content",
    ".post-content",
    "body",
  ];

  for (const selector of selectors) {
    const node = $(selector).first();
    if (!node.length) continue;
    const textLen = node.text().trim().length;
    if (textLen >= 120) return node;
  }

  return $("body").first();
}

function extractPageData(url, html, turndown) {
  const $ = cheerio.load(html);
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("h1").first().text().trim() ||
    $("title").text().trim() ||
    url;

  const description =
    $('meta[name="description"]').attr("content") ||
    $('meta[property="og:description"]').attr("content") ||
    "";

  // Remove obvious chrome/noise before conversion.
  const root = findBestContentRoot($).clone();
  root.find("script, style, noscript, svg, canvas, iframe, form").remove();
  root.find("nav, footer, header").remove();

  // Keep images but remove tracking-only anchors.
  root.find('a[href^="#"]').remove();

  const contentHtml = root.html() || "";
  const markdown = turndown.turndown(contentHtml).trim();

  const links = [];
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    links.push(href);
  });

  return {
    title: title.replace(/\s+/g, " ").trim(),
    description: description.replace(/\s+/g, " ").trim(),
    markdown,
    links,
  };
}

function toAbsoluteUrl(baseUrl, href) {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function getDomainFolder(hostname) {
  return sanitizeSegment(hostname.replace(/^www\./, ""));
}

function formatFrontmatter({ source, title, description, domain, pathName }) {
  const safe = (value) => String(value || "").replace(/"/g, '\\"');
  return [
    "---",
    `title: "${safe(title)}"`,
    `source: "${safe(source)}"`,
    `domain: "${safe(domain)}"`,
    `path: "${safe(pathName)}"`,
    `description: "${safe(description)}"`,
    "---",
    "",
  ].join("\n");
}

function parseSitemapUrls(xmlText, origin) {
  const matches = [...xmlText.matchAll(/<loc>([^<]+)<\/loc>/g)];
  const urls = [];
  for (const match of matches) {
    const candidate = match[1].trim();
    try {
      const u = new URL(candidate);
      if (u.origin === origin && isLikelyHtmlPath(u.pathname)) {
        urls.push(normalizeUrl(u.toString()));
      }
    } catch {
      // ignore invalid URLs
    }
  }
  return urls;
}

async function getInitialUrls(siteUrl) {
  const base = new URL(siteUrl);
  const rootUrl = normalizeUrl(base.toString());
  const initial = new Set([rootUrl]);

  // Try sitemap first to maximize synced coverage.
  for (const sitemapPath of ["/sitemap.xml", "/sitemap_index.xml"]) {
    const sitemapUrl = `${base.origin}${sitemapPath}`;
    const result = await fetchText(sitemapUrl);
    if (!result.ok || !result.text) continue;

    for (const url of parseSitemapUrls(result.text, base.origin)) {
      initial.add(url);
    }
  }

  return [...initial];
}

async function crawlSite(siteUrl) {
  const base = new URL(siteUrl);
  const domainFolder = getDomainFolder(base.hostname);
  const siteOutDir = path.join(outDir, domainFolder);
  if (!dryRun) ensureDir(siteOutDir);

  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  const manifestItems = [];
  const visited = new Set();
  const queued = new Set();
  const queue = [];
  let changedFiles = 0;

  const initialUrls = await getInitialUrls(siteUrl);
  for (const u of initialUrls) {
    queue.push({ url: u, depth: 0 });
    queued.add(u);
  }

  while (queue.length > 0 && visited.size < maxPages) {
    const current = queue.shift();
    if (!current) break;

    const normalized = normalizeUrl(current.url);
    if (visited.has(normalized)) continue;
    visited.add(normalized);

    const result = await fetchText(normalized);
    if (!result.ok || !result.text) {
      manifestItems.push({
        url: normalized,
        status: result.status,
        syncedAt,
        skipped: true,
      });
      continue;
    }

    const extractedPage = extractPageData(normalized, result.text, turndown);
    const firecrawlPage = await scrapeWithFirecrawl(normalized);

    const page = firecrawlPage?.markdown && firecrawlPage.markdown.length >= 60
      ? {
          ...extractedPage,
          title: firecrawlPage.title || extractedPage.title,
          description: firecrawlPage.description || extractedPage.description,
          markdown: firecrawlPage.markdown,
        }
      : extractedPage;

    if (!page.markdown || page.markdown.length < 60) {
      manifestItems.push({
        url: normalized,
        status: result.status,
        skipped: true,
      });
      continue;
    }

    const currentUrl = new URL(normalized);
    const slug = pathnameToSlug(currentUrl.pathname);
    const fileName = `${slug}.mdx`;
    const filePath = path.join(siteOutDir, fileName);

    const frontmatter = formatFrontmatter({
      source: normalized,
      title: page.title,
      description: page.description,
      domain: currentUrl.hostname,
      pathName: currentUrl.pathname || "/",
    });

    const mdxBody = `${frontmatter}${page.markdown}\n`;
    let changed = true;

    if (!dryRun) {
      const prev = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
      changed = prev !== mdxBody;
      if (changed) {
        fs.writeFileSync(filePath, mdxBody, "utf8");
        changedFiles++;
      }
    }

    manifestItems.push({
      url: normalized,
      status: result.status,
      file: path.relative(ROOT, filePath),
      title: page.title,
      description: page.description,
      chars: page.markdown.length,
      changed,
      extractor: firecrawlPage?.markdown ? "firecrawl" : "local",
    });

    if (current.depth >= maxDepth) continue;

    for (const href of page.links) {
      const abs = toAbsoluteUrl(normalized, href);
      if (!abs) continue;

      let candidate;
      try {
        candidate = new URL(abs);
      } catch {
        continue;
      }

      if (candidate.origin !== base.origin) continue;
      if (!isLikelyHtmlPath(candidate.pathname)) continue;
      if (candidate.search.includes("lang=")) continue;

      const normalizedCandidate = normalizeUrl(candidate.toString());
      if (visited.has(normalizedCandidate) || queued.has(normalizedCandidate)) continue;

      queue.push({ url: normalizedCandidate, depth: current.depth + 1 });
      queued.add(normalizedCandidate);
    }
  }

  return {
    site: base.origin,
    domainFolder,
    pages: manifestItems,
    crawled: visited.size,
    changedFiles,
  };
}

function parseJpDate(line) {
  const m = line.match(/^\s*(\d{4})年(\d{1,2})月(\d{1,2})日\s*$/);
  if (!m) return null;
  const yyyy = m[1];
  const mm = m[2].padStart(2, "0");
  const dd = m[3].padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function stripBracketsAndLinks(text) {
  // Strip markdown links → label only, then drop outer 【】 decoration if present.
  // Keep 「」 intact — those are normal Japanese quotes.
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^【\s*/, "")
    .replace(/\s*】$/, "")
    .trim();
}

function extractFirstHref(text) {
  const m = text.match(/\[[^\]]+\]\(([^)]+)\)/);
  return m ? m[1] : null;
}

function absolutizeUrl(href, base) {
  if (!href) return href;
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function rewriteBody(line, base) {
  // Convert relative markdown links to absolute URLs against the source host,
  // and drop the outer 【】 decoration if present.
  const linksAbs = line.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) => {
    return `[${label}](${absolutizeUrl(href, base)})`;
  });
  return linksAbs.replace(/^【\s*/, "").replace(/\s*】$/, "").trim();
}

function makeNewsSlug(date, title) {
  const compactDate = date.replace(/-/g, "");
  const hash = crypto.createHash("sha1").update(title).digest("hex").slice(0, 6);
  return `${compactDate}-${hash}`;
}

function parseNewsEntries(rawMdx) {
  // Skip frontmatter.
  const body = rawMdx.replace(/^---[\s\S]*?---\s*/m, "");
  const lines = body.split("\n");

  const entries = [];
  let pendingDate = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith("#")) continue;

    const date = parseJpDate(line);
    if (date) {
      pendingDate = date;
      continue;
    }

    if (!pendingDate) continue;

    const title = stripBracketsAndLinks(line);
    if (!title) continue;

    const rawHref = extractFirstHref(line);
    entries.push({
      date: pendingDate,
      title,
      body: rewriteBody(line, NEWS_SOURCE_URL),
      primaryLink: rawHref ? absolutizeUrl(rawHref, NEWS_SOURCE_URL) : null,
    });
    pendingDate = null;
  }

  return entries;
}

function syncNewsEntries() {
  if (!fs.existsSync(NEWS_SOURCE_FILE)) {
    console.log(`News source not found: ${path.relative(ROOT, NEWS_SOURCE_FILE)}`);
    return { entries: 0, written: 0, removed: 0 };
  }

  const raw = fs.readFileSync(NEWS_SOURCE_FILE, "utf8");
  const parsed = parseNewsEntries(raw);

  if (!dryRun) ensureDir(NEWS_DIR);

  const seenSlugs = new Set();
  let written = 0;

  for (const entry of parsed) {
    const slug = makeNewsSlug(entry.date, entry.title);
    if (seenSlugs.has(slug)) continue;
    seenSlugs.add(slug);

    const safe = (v) => String(v || "").replace(/"/g, '\\"');
    const frontmatter = [
      "---",
      `slug: "${safe(slug)}"`,
      `date: "${entry.date}"`,
      `title: "${safe(entry.title)}"`,
      `sourceUrl: "${NEWS_SOURCE_URL}"`,
      `sourceDomain: "${NEWS_SOURCE_DOMAIN}"`,
      `primaryLink: "${safe(entry.primaryLink || "")}"`,
      "---",
      "",
    ].join("\n");

    const mdxBody = `${frontmatter}${entry.body}\n`;
    const filePath = path.join(NEWS_DIR, `${slug}.mdx`);

    if (dryRun) {
      written++;
      continue;
    }

    const prev = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : null;
    if (prev !== mdxBody) {
      fs.writeFileSync(filePath, mdxBody, "utf8");
      written++;
    }
  }

  // Remove news files no longer present in the source list.
  let removed = 0;
  if (!dryRun && fs.existsSync(NEWS_DIR)) {
    for (const file of fs.readdirSync(NEWS_DIR)) {
      if (!file.endsWith(".mdx")) continue;
      const slug = file.replace(/\.mdx$/, "");
      if (!seenSlugs.has(slug)) {
        fs.unlinkSync(path.join(NEWS_DIR, file));
        removed++;
      }
    }
  }

  return { entries: parsed.length, written, removed };
}

async function main() {
  if (!dryRun) ensureDir(outDir);

  const startedAt = new Date().toISOString();
  const summary = {
    startedAt,
    maxPages,
    maxDepth,
    timeoutMs,
    dryRun,
    outDir: path.relative(ROOT, outDir),
    sites: [],
  };

  for (const site of SOURCE_SITES) {
    if (newsOnly) break;
    console.log(`Syncing ${site} ...`);
    const siteResult = await crawlSite(site);
    summary.sites.push({
      site: siteResult.site,
      domainFolder: siteResult.domainFolder,
      crawled: siteResult.crawled,
      saved: siteResult.pages.filter((p) => !p.skipped).length,
      skipped: siteResult.pages.filter((p) => p.skipped).length,
      changed: siteResult.changedFiles,
      pages: siteResult.pages,
    });

    console.log(
      `  done: crawled ${siteResult.crawled}, saved ${siteResult.pages.filter((p) => !p.skipped).length}, changed ${siteResult.changedFiles}`
    );
  }

  const newsResult = syncNewsEntries();
  summary.news = {
    sourceFile: path.relative(ROOT, NEWS_SOURCE_FILE),
    parsed: newsResult.entries,
    written: newsResult.written,
    removed: newsResult.removed,
  };
  console.log(
    `News: parsed ${newsResult.entries}, written ${newsResult.written}, removed ${newsResult.removed}`
  );

  summary.finishedAt = new Date().toISOString();

  const manifestPath = path.join(outDir, "manifest.json");
  const hasContentChanges =
    summary.sites.some((s) => s.changed > 0) ||
    newsResult.written > 0 ||
    newsResult.removed > 0;
  if (!dryRun) {
    if (hasContentChanges || !fs.existsSync(manifestPath)) {
      fs.writeFileSync(manifestPath, JSON.stringify(summary, null, 2), "utf8");
    } else {
      console.log("No content changes detected. Manifest left unchanged.");
    }
  }

  console.log(`\nSync finished. Manifest: ${path.relative(ROOT, manifestPath)}`);
}

main().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});

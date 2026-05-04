import fs from "fs";
import path from "path";
import matter from "gray-matter";

const NEWS_DIR = path.join(process.cwd(), "content/news");

export interface NewsEntry {
  slug: string;
  date: string;
  title: string;
  sourceUrl: string;
  sourceDomain: string;
  primaryLink: string;
  body: string;
}

export function getAllNews(): NewsEntry[] {
  if (!fs.existsSync(NEWS_DIR)) return [];

  const files = fs.readdirSync(NEWS_DIR).filter((f) => f.endsWith(".mdx"));

  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(NEWS_DIR, file), "utf-8");
      const { data, content } = matter(raw);
      return {
        slug: data.slug || file.replace(/\.mdx$/, ""),
        date: data.date || "",
        title: data.title || "",
        sourceUrl: data.sourceUrl || "",
        sourceDomain: data.sourceDomain || "",
        primaryLink: data.primaryLink || "",
        body: content.trim(),
      } as NewsEntry;
    })
    .sort((a, b) => (b.date > a.date ? 1 : -1));
}

export function getNewsBySlug(slug: string): NewsEntry | null {
  const filePath = path.join(NEWS_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug: data.slug || slug,
    date: data.date || "",
    title: data.title || "",
    sourceUrl: data.sourceUrl || "",
    sourceDomain: data.sourceDomain || "",
    primaryLink: data.primaryLink || "",
    body: content.trim(),
  };
}

export const NEWS_PER_PAGE = 30;

export function getPaginatedNews(page: number) {
  const all = getAllNews();
  const totalPages = Math.max(1, Math.ceil(all.length / NEWS_PER_PAGE));
  const start = (page - 1) * NEWS_PER_PAGE;
  const items = all.slice(start, start + NEWS_PER_PAGE);
  return { items, totalPages, currentPage: page, total: all.length };
}

import type { NewsArticle } from "@/lib/agents/types";

export type TopicKey =
  | "ai"
  | "technology"
  | "jobs"
  | "world"
  | "careers"
  | "healthcare"
  | "finance"
  | "startups";

export const TOPICS: { key: TopicKey; label: string; emoji: string; query: string; hn?: string; blurb: string }[] = [
  { key: "ai", label: "AI & ML", emoji: "🤖", query: "artificial intelligence OR machine learning", hn: "AI", blurb: "Model releases, research and AI policy" },
  { key: "technology", label: "Technology", emoji: "💻", query: "technology industry", hn: "software", blurb: "Product, software and platform news" },
  { key: "jobs", label: "Jobs & Hiring", emoji: "📋", query: "job market OR hiring OR layoffs", blurb: "Hiring trends, layoffs and labour demand" },
  { key: "careers", label: "Careers & Skills", emoji: "🎯", query: "career advice OR upskilling OR workplace skills", blurb: "Skills, interviews and career growth" },
  { key: "world", label: "World & Business", emoji: "🌍", query: "world business economy", blurb: "Economy and global business" },
  { key: "healthcare", label: "Healthcare", emoji: "🩺", query: "healthcare industry jobs", blurb: "Clinical, pharma and health systems" },
  { key: "finance", label: "Finance", emoji: "💰", query: "finance banking industry", blurb: "Banking, markets and fintech" },
  { key: "startups", label: "Startups", emoji: "🚀", query: "startup funding", hn: "startup", blurb: "Funding, founders and new ventures" },
];

export function topicLabel(key: string): string {
  return TOPICS.find((t) => t.key === key)?.label ?? "Updates";
}

function hashId(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function decodeEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
}

function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return m ? decodeEntities(m[1]) : "";
}

async function fetchWithTimeout(url: string, ms = 8000): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "AutoApply/1.0 (job-search assistant)" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function parseRss(xml: string, topic: string): NewsArticle[] {
  const items = xml.split(/<item[\s>]/i).slice(1);
  const out: NewsArticle[] = [];
  for (const raw of items.slice(0, 24)) {
    const block = raw.slice(0, raw.indexOf("</item>") === -1 ? undefined : raw.indexOf("</item>"));
    const rawTitle = pick(block, "title");
    const link = pick(block, "link");
    if (!rawTitle || !link) continue;
    const sourceTag = pick(block, "source");
    // Google News titles are formatted "Headline - Publisher"
    const split = rawTitle.lastIndexOf(" - ");
    const title = sourceTag && split > 30 ? rawTitle.slice(0, split) : rawTitle;
    const source = sourceTag || (split > 30 ? rawTitle.slice(split + 3) : "News");
    const pubDate = pick(block, "pubDate");
    const parsedDate = pubDate ? new Date(pubDate) : null;
    out.push({
      id: hashId(link),
      title,
      url: link,
      source,
      topic,
      publishedAt: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : null,
      summary: stripTags(pick(block, "description")).slice(0, 240),
    });
  }
  return out;
}

type HnHit = { objectID: string; title?: string; url?: string; story_text?: string; created_at?: string; points?: number; author?: string };

async function fetchHackerNews(query: string, topic: string): Promise<NewsArticle[]> {
  const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=12`;
  const text = await fetchWithTimeout(url);
  if (!text) return [];
  try {
    const data = JSON.parse(text) as { hits?: HnHit[] };
    return (data.hits ?? [])
      .filter((h) => h.title && (h.url || h.objectID))
      .map((h) => ({
        id: hashId(h.url ?? h.objectID),
        title: h.title as string,
        url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
        source: "Hacker News",
        topic,
        publishedAt: h.created_at ?? null,
        summary: stripTags(h.story_text ?? "").slice(0, 200) || `${h.points ?? 0} points · discussion on Hacker News`,
      }));
  } catch {
    return [];
  }
}

/** Evergreen, always-available material so the page is never empty offline. */
function fallbackArticles(topic: string): NewsArticle[] {
  const base: Record<string, { title: string; url: string; source: string; summary: string }[]> = {
    jobs: [
      { title: "State of Online Recruiting: ghosting and ghost jobs", url: "https://www.ihire.com/resourcecenter/employer/pages/the-state-of-online-recruiting-2025", source: "iHire", summary: "Survey data on why candidates hear nothing back and how common fake postings are." },
      { title: "Annual Job Search Trends Report", url: "https://huntr.co/research/2025-annual-job-search-trends-report", source: "Huntr", summary: "Application-to-interview conversion by job board, timelines and candidate sentiment." },
    ],
    careers: [
      { title: "Occupational Outlook Handbook", url: "https://www.bls.gov/ooh/", source: "U.S. Bureau of Labor Statistics", summary: "Official outlook, pay and entry requirements for hundreds of occupations." },
      { title: "Job scams: how to spot and avoid them", url: "https://consumer.ftc.gov/articles/job-scams", source: "FTC", summary: "Warning signs of fake recruiters, fee requests and fake-check schemes." },
    ],
    ai: [
      { title: "AI Index Report", url: "https://aiindex.stanford.edu/report/", source: "Stanford HAI", summary: "Annual data on AI capability, investment, policy and labour-market impact." },
    ],
  };
  const list = base[topic] ?? base.careers;
  return list.map((a) => ({
    id: hashId(a.url),
    title: a.title,
    url: a.url,
    source: a.source,
    topic,
    publishedAt: null,
    summary: a.summary,
  }));
}

export async function fetchTopicNews(topicKey: string): Promise<{ articles: NewsArticle[]; live: boolean }> {
  const topic = TOPICS.find((t) => t.key === topicKey) ?? TOPICS[0];
  const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic.query)}&hl=en-US&gl=US&ceid=US:en`;

  const [rssText, hnArticles] = await Promise.all([
    fetchWithTimeout(rssUrl),
    topic.hn ? fetchHackerNews(topic.hn, topic.key) : Promise.resolve([]),
  ]);

  const rssArticles = rssText ? parseRss(rssText, topic.key) : [];
  const merged = [...rssArticles, ...hnArticles];
  const seen = new Set<string>();
  const unique = merged.filter((a) => (seen.has(a.id) ? false : (seen.add(a.id), true)));

  unique.sort((a, b) => {
    if (!a.publishedAt && !b.publishedAt) return 0;
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  if (unique.length === 0) return { articles: fallbackArticles(topic.key), live: false };
  return { articles: unique.slice(0, 30), live: true };
}

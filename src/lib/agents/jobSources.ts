import type { JobListing } from "./types";

/**
 * Job Discovery — live listing sources.
 *
 * Every source below is a public, key-free feed whose terms allow linking back
 * to the original posting. AutoApply never re-hosts or auto-submits an
 * application: each listing keeps its real `applyUrl` so the candidate applies
 * on the employer's own site.
 */

function hashId(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/(p|div|h\d|ul|ol)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, c) => String.fromCharCode(Number(c)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function toIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "number") return new Date(value * 1000).toISOString();
  if (typeof value === "string") {
    if (/^\d+$/.test(value)) return new Date(Number(value) * 1000).toISOString();
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

async function getJson<T>(url: string, timeoutMs = 11000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "AutoApply/1.0 (job search assistant)", Accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ─────────────────────────── Remotive ───────────────────────────
type RemotiveJob = {
  id: number; url: string; title: string; company_name: string; category?: string;
  tags?: string[]; job_type?: string; publication_date?: string;
  candidate_required_location?: string; salary?: string; description?: string;
};

async function fromRemotive(query: string): Promise<JobListing[]> {
  const url = `https://remotive.com/api/remote-jobs?limit=50${query ? `&search=${encodeURIComponent(query)}` : ""}`;
  const data = await getJson<{ jobs?: RemotiveJob[] }>(url);
  return (data?.jobs ?? []).map((j) => ({
    id: `remotive-${j.id}`,
    title: j.title,
    company: (j.company_name ?? "").trim(),
    location: j.candidate_required_location || "Remote",
    remote: true,
    salaryText: j.salary?.trim() || "",
    employmentType: (j.job_type ?? "").replace(/_/g, " "),
    postedAt: toIso(j.publication_date),
    applyUrl: j.url,
    source: "Remotive",
    description: stripHtml(j.description ?? "").slice(0, 9000),
    tags: (j.tags ?? []).slice(0, 12),
  }));
}

// ─────────────────────────── Arbeitnow ───────────────────────────
type ArbeitnowJob = {
  slug: string; company_name: string; title: string; description?: string;
  remote?: boolean; url: string; tags?: string[]; job_types?: string[];
  location?: string; created_at?: number | string;
};

async function fromArbeitnow(): Promise<JobListing[]> {
  const data = await getJson<{ data?: ArbeitnowJob[] }>("https://www.arbeitnow.com/api/job-board-api");
  return (data?.data ?? []).map((j) => ({
    id: `arbeitnow-${hashId(j.slug)}`,
    title: j.title,
    company: (j.company_name ?? "").trim(),
    location: j.location || (j.remote ? "Remote" : ""),
    remote: Boolean(j.remote),
    salaryText: "",
    employmentType: (j.job_types ?? []).join(", "),
    postedAt: toIso(j.created_at),
    applyUrl: j.url,
    source: "Arbeitnow",
    description: stripHtml(j.description ?? "").slice(0, 9000),
    tags: (j.tags ?? []).slice(0, 12),
  }));
}

// ─────────────────────────── Jobicy ───────────────────────────
type JobicyJob = {
  id: number; url: string; jobTitle: string; companyName: string;
  jobIndustry?: string[] | string; jobType?: string[] | string; jobGeo?: string;
  jobLevel?: string; jobExcerpt?: string; jobDescription?: string; pubDate?: string;
  annualSalaryMin?: number; annualSalaryMax?: number; salaryCurrency?: string;
};

async function fromJobicy(query: string): Promise<JobListing[]> {
  const url = `https://jobicy.com/api/v2/remote-jobs?count=50${query ? `&tag=${encodeURIComponent(query)}` : ""}`;
  const data = await getJson<{ jobs?: JobicyJob[] }>(url);
  return (data?.jobs ?? []).map((j) => {
    const min = j.annualSalaryMin;
    const max = j.annualSalaryMax;
    const cur = j.salaryCurrency ?? "USD";
    return {
      id: `jobicy-${j.id}`,
      title: j.jobTitle,
      company: (j.companyName ?? "").trim(),
      location: j.jobGeo || "Remote",
      remote: true,
      salaryText: min && max ? `${cur} ${Math.round(min / 1000)}k–${Math.round(max / 1000)}k` : "",
      employmentType: Array.isArray(j.jobType) ? j.jobType.join(", ") : (j.jobType ?? ""),
      postedAt: toIso(j.pubDate),
      applyUrl: j.url,
      source: "Jobicy",
      description: stripHtml(j.jobDescription || j.jobExcerpt || "").slice(0, 9000),
      tags: Array.isArray(j.jobIndustry) ? j.jobIndustry.slice(0, 8) : [],
    };
  });
}

// ─────────────────────────── Himalayas ───────────────────────────
type HimalayasJob = {
  guid?: string; title: string; companyName: string; excerpt?: string; description?: string;
  employmentType?: string; minSalary?: number; maxSalary?: number; currency?: string;
  seniority?: string[] | string; locationRestrictions?: string[]; categories?: string[];
  pubDate?: number | string; applicationLink?: string;
};

async function fromHimalayas(): Promise<JobListing[]> {
  const data = await getJson<{ jobs?: HimalayasJob[] }>("https://himalayas.app/jobs/api?limit=50");
  return (data?.jobs ?? []).map((j) => ({
    id: `himalayas-${hashId(j.guid ?? `${j.title}-${j.companyName}`)}`,
    title: j.title,
    company: (j.companyName ?? "").trim(),
    location: (j.locationRestrictions ?? []).join(", ") || "Remote",
    remote: true,
    salaryText:
      j.minSalary && j.maxSalary
        ? `${j.currency ?? "USD"} ${Math.round(j.minSalary / 1000)}k–${Math.round(j.maxSalary / 1000)}k`
        : "",
    employmentType: j.employmentType ?? "",
    postedAt: toIso(j.pubDate),
    applyUrl: j.applicationLink ?? "",
    source: "Himalayas",
    description: stripHtml(j.description || j.excerpt || "").slice(0, 9000),
    tags: (j.categories ?? []).slice(0, 8),
  }));
}

// ──────────────────── Greenhouse (company career boards) ────────────────────
type GreenhouseJob = {
  id: number; title: string; absolute_url: string; updated_at?: string;
  location?: { name?: string }; content?: string; company_name?: string;
};

/** Popular public Greenhouse boards — real employer career pages, key-free. */
export const GREENHOUSE_BOARDS = [
  "stripe", "figma", "databricks", "anthropic", "discord",
  "gitlab", "asana", "robinhood", "duolingo", "lyft",
];

async function fromGreenhouse(boards: string[]): Promise<JobListing[]> {
  const results = await Promise.all(
    boards.map(async (board) => {
      // `content=true` is required — without it Greenhouse omits the job body,
      // leaving nothing for the skill matcher to score against.
      const data = await getJson<{ jobs?: GreenhouseJob[] }>(
        `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`,
        11000,
      );
      return (data?.jobs ?? []).slice(0, 40).map((j) => ({
        id: `greenhouse-${board}-${j.id}`,
        title: j.title,
        company: j.company_name ?? board.charAt(0).toUpperCase() + board.slice(1),
        location: j.location?.name ?? "",
        remote: /remote/i.test(j.location?.name ?? ""),
        salaryText: "",
        employmentType: "",
        postedAt: toIso(j.updated_at),
        applyUrl: j.absolute_url,
        source: `Greenhouse · ${board}`,
        description: stripHtml(j.content ?? "").slice(0, 9000),
        tags: [] as string[],
      }));
    }),
  );
  return results.flat();
}

export type SourceKey = "remotive" | "arbeitnow" | "jobicy" | "himalayas" | "greenhouse";

export const JOB_SOURCES: { key: SourceKey; label: string; note: string }[] = [
  { key: "remotive", label: "Remotive", note: "Curated remote roles across many functions" },
  { key: "jobicy", label: "Jobicy", note: "Remote jobs with salary data" },
  { key: "himalayas", label: "Himalayas", note: "Remote roles with seniority and pay bands" },
  { key: "arbeitnow", label: "Arbeitnow", note: "European and visa-friendly listings" },
  { key: "greenhouse", label: "Company boards", note: "Direct employer career pages" },
];

/** Fetches from all selected sources in parallel and de-duplicates. */
export async function fetchLiveJobs(options: {
  query?: string;
  sources?: SourceKey[];
}): Promise<{ jobs: JobListing[]; sourcesUsed: string[]; failed: string[] }> {
  const query = (options.query ?? "").trim();
  const selected = options.sources?.length
    ? options.sources
    : (["remotive", "jobicy", "himalayas", "arbeitnow", "greenhouse"] as SourceKey[]);

  const tasks: { key: SourceKey; run: Promise<JobListing[]> }[] = [];
  if (selected.includes("remotive")) tasks.push({ key: "remotive", run: fromRemotive(query) });
  if (selected.includes("jobicy")) tasks.push({ key: "jobicy", run: fromJobicy(query) });
  if (selected.includes("himalayas")) tasks.push({ key: "himalayas", run: fromHimalayas() });
  if (selected.includes("arbeitnow")) tasks.push({ key: "arbeitnow", run: fromArbeitnow() });
  if (selected.includes("greenhouse")) tasks.push({ key: "greenhouse", run: fromGreenhouse(GREENHOUSE_BOARDS.slice(0, 6)) });

  const settled = await Promise.allSettled(tasks.map((t) => t.run));
  const jobs: JobListing[] = [];
  const sourcesUsed: string[] = [];
  const failed: string[] = [];

  settled.forEach((res, i) => {
    const key = tasks[i].key;
    if (res.status === "fulfilled" && res.value.length > 0) {
      jobs.push(...res.value);
      sourcesUsed.push(key);
    } else {
      failed.push(key);
    }
  });

  // De-duplicate the same role posted to multiple aggregators.
  const seen = new Set<string>();
  const unique = jobs.filter((j) => {
    if (!j.title || !j.applyUrl) return false;
    const fingerprint = `${j.title.toLowerCase().replace(/\s+/g, " ")}|${j.company.toLowerCase()}`;
    if (seen.has(fingerprint)) return false;
    seen.add(fingerprint);
    return true;
  });

  return { jobs: unique, sourcesUsed, failed };
}

import { getOrCreateProfile } from "@/db/queries";
import { type SourceKey } from "@/lib/agents/jobSources";
import { scoreJobs, suggestedQuery } from "@/lib/agents/jobDiscovery";
import { getOrSyncLiveJobs } from "@/lib/agents/jobCache";
import type { Profile } from "@/lib/agents/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    const body = await request.json().catch(() => ({}));
    const profile: Profile = body?.profile ?? (await getOrCreateProfile());
    const sources = Array.isArray(body?.sources) ? (body.sources as SourceKey[]) : undefined;
    const remoteOnly = body?.remoteOnly === true;
    const forceRefresh = body?.forceRefresh === true;
    const minFit = Number(body?.minFit ?? 0);
    const query = typeof body?.query === "string" && body.query.trim()
      ? body.query.trim()
      : suggestedQuery(profile);

    // Pull from PostgreSQL cache if fresh (<25 mins) or sync feeds in background
    const { jobs, isCached, sourcesUsed, lastSyncTime } = await getOrSyncLiveJobs({
      query,
      sources,
      forceRefresh,
    });

    let scored = scoreJobs(jobs, profile);
    let relevanceApplied = false;

    // Relevance filter. A loose "any term" match made a search for
    // "machine learning engineer" return every job containing "engineer",
    // so full-phrase and title matches are ranked ahead of tag matches.
    if (query) {
      const q = query.toLowerCase().trim();
      const terms = q.split(/\s+/).filter((t: string) => t.length > 2);

      const relevance = (j: (typeof scored)[number]): number => {
        const title = j.title.toLowerCase();
        const tags = j.tags.join(" ").toLowerCase();
        if (title.includes(q)) return 3; // exact phrase in the title
        const titleHits = terms.filter((t: string) => title.includes(t)).length;
        if (titleHits === terms.length && terms.length > 0) return 3;
        if (titleHits > 0) return 2;
        if (terms.some((t: string) => tags.includes(t))) return 1;
        return 0;
      };

      const ranked = scored
        .map((j) => ({ job: j, rel: relevance(j) }))
        .filter((x) => x.rel > 0)
        .sort((a, b) => b.rel - a.rel || b.job.fitScore - a.job.fitScore);

      if (ranked.length >= 3) {
        scored = ranked.map((x) => x.job);
        relevanceApplied = true;
      }
    }

    if (remoteOnly) scored = scored.filter((j) => j.remote);
    if (minFit > 0) scored = scored.filter((j) => j.fitScore >= minFit);

    // When a relevance filter ran, its ordering (phrase > title > tag, then
    // fit) is already correct and must not be flattened by a pure fit sort.
    if (!relevanceApplied) {
      scored.sort((a, b) => b.fitScore - a.fitScore || (a.freshnessDays ?? 999) - (b.freshnessDays ?? 999));
    }

    return Response.json(
      {
        jobs: scored.slice(0, 60),
        totalFetched: jobs.length,
        query,
        sourcesUsed,
        isCached,
        lastSyncTime,
        requestId,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error(`[job-discovery:${requestId}]`, error);
    return Response.json(
      { error: "Job search could not complete. Please try again.", requestId },
      { status: 500 },
    );
  }
}

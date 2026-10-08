import { db } from "@/db";
import { liveJobsCache } from "@/db/schema";
import { fetchLiveJobs, type SourceKey } from "./jobSources";
import type { JobListing } from "./types";
import { desc, gt, sql } from "drizzle-orm";

const CACHE_TTL_MS = 25 * 60 * 1000; // 25 minutes TTL for fresh job crawling

/**
 * Returns cached jobs from PostgreSQL if fresh, otherwise runs parallel live fetching
 * and caches results in the database for instant sub-10ms subsequent queries.
 */
export async function getOrSyncLiveJobs(options: {
  query?: string;
  sources?: SourceKey[];
  forceRefresh?: boolean;
}): Promise<{ jobs: JobListing[]; isCached: boolean; sourcesUsed: string[]; lastSyncTime: string }> {
  const cutoff = new Date(Date.now() - CACHE_TTL_MS);

  if (!options.forceRefresh) {
    try {
      const cachedRows = await db
        .select()
        .from(liveJobsCache)
        .where(gt(liveJobsCache.cachedAt, cutoff))
        .orderBy(desc(liveJobsCache.cachedAt))
        .limit(300);

      if (cachedRows.length >= 20) {
        const jobs: JobListing[] = cachedRows.map((r) => ({
          id: r.jobId,
          title: r.title,
          company: r.company,
          location: r.location,
          remote: r.remote,
          salaryText: r.salaryText,
          employmentType: r.employmentType,
          postedAt: r.postedAt,
          applyUrl: r.applyUrl,
          source: r.source,
          description: r.description,
          tags: r.tags,
        }));

        return {
          jobs,
          isCached: true,
          sourcesUsed: Array.from(new Set(cachedRows.map((r) => r.source.split(" · ")[0]))),
          lastSyncTime: cachedRows[0]?.cachedAt?.toISOString() || new Date().toISOString(),
        };
      }
    } catch (e) {
      console.warn("[JobCache:DBQuery]", e);
    }
  }

  // Fetch live from feeds
  const { jobs, sourcesUsed } = await fetchLiveJobs({
    query: options.query,
    sources: options.sources,
  });

  const now = new Date();

  // Async non-blocking cache insert into PostgreSQL
  if (jobs.length > 0) {
    (async () => {
      try {
        // Upsert into liveJobsCache
        for (const j of jobs.slice(0, 200)) {
          await db
            .insert(liveJobsCache)
            .values({
              jobId: j.id,
              title: j.title,
              company: j.company,
              location: j.location,
              remote: j.remote,
              salaryText: j.salaryText,
              employmentType: j.employmentType,
              postedAt: j.postedAt,
              applyUrl: j.applyUrl,
              source: j.source,
              description: j.description.slice(0, 9000),
              tags: j.tags,
              cachedAt: now,
            })
            .onConflictDoUpdate({
              target: liveJobsCache.jobId,
              set: {
                title: j.title,
                company: j.company,
                salaryText: j.salaryText,
                cachedAt: now,
              },
            });
        }
      } catch (err) {
        console.warn("[JobCache:Persist]", err);
      }
    })();
  }

  return {
    jobs,
    isCached: false,
    sourcesUsed,
    lastSyncTime: now.toISOString(),
  };
}

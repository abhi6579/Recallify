"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Profile, SavedJobRecord, ScoredJob } from "@/lib/agents/types";
import { JOB_SOURCES, type SourceKey } from "@/lib/agents/jobSources";
import JobAlertsModal from "./JobAlertsModal";
import CompanyIntelModal from "./CompanyIntelModal";

const VERDICT: Record<ScoredJob["verdict"], { label: string; cls: string }> = {
  strong_fit: { label: "Strong fit", cls: "bg-emerald-100 text-emerald-700" },
  worth_applying: { label: "Worth applying", cls: "bg-indigo-100 text-indigo-700" },
  stretch: { label: "Stretch", cls: "bg-amber-100 text-amber-700" },
  low_fit: { label: "Low fit", cls: "bg-slate-100 text-slate-600" },
};

function freshness(days: number | null): string {
  if (days === null) return "date unknown";
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function JobSearchTab({
  profile,
  onTailor,
}: {
  profile: Profile | null;
  onTailor: () => void;
}) {
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<ScoredJob[]>([]);
  const [saved, setSaved] = useState<SavedJobRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{ totalFetched: number; sourcesUsed: string[]; query: string } | null>(null);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minFit, setMinFit] = useState(0);
  const [sources, setSources] = useState<SourceKey[]>(JOB_SOURCES.map((s) => s.key));
  const [showSaved, setShowSaved] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [selectedCompanyIntel, setSelectedCompanyIntel] = useState<string | null>(null);

  const loadSaved = useCallback(async () => {
    const res = await fetch("/api/jobs/saved");
    const data = await res.json();
    setSaved(data.saved ?? []);
  }, []);

  useEffect(() => {
    loadSaved();
    const transferredQuery = window.sessionStorage.getItem("autoapply:job-query");
    if (transferredQuery) {
      setQuery(transferredQuery);
      window.sessionStorage.removeItem("autoapply:job-query");
    }
  }, [loadSaved]);

  async function search() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, profile, sources, remoteOnly, minFit }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setJobs(data.jobs ?? []);
      setMeta({ totalFetched: data.totalFetched, sourcesUsed: data.sourcesUsed ?? [], query: data.query });
      setShowSaved(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  const savedIds = useMemo(() => new Set(saved.map((s) => s.id)), [saved]);

  async function toggleSave(job: ScoredJob) {
    const existing = saved.find((s) => s.id === job.id);
    if (existing) await fetch(`/api/jobs/saved/${existing.savedId}`, { method: "DELETE" });
    else await fetch("/api/jobs/saved", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(job) });
    await loadSaved();
  }

  /** Hands the real listing to the Resume Agent with its true JD and context. */
  function tailorFor(job: ScoredJob | SavedJobRecord) {
    sessionStorage.setItem(
      "autoapply:resume-draft",
      JSON.stringify({
        jobDescription: job.description || `Position: ${job.title}\nCompany: ${job.company}`,
        companyName: job.company,
        roleTitle: job.title,
        jobContext: {
          source: job.source,
          sourceUrl: job.applyUrl,
          postedDate: job.postedAt ? job.postedAt.slice(0, 10) : "",
          salaryText: job.salaryText,
          workMode: job.remote ? "remote" : "not-specified",
        },
      }),
    );
    onTailor();
  }

  const list: (ScoredJob | SavedJobRecord)[] = showSaved ? saved : jobs;

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900">Find live jobs</h2>
        <p className="prose-muted mt-1 max-w-3xl text-sm">
          Pulls real, currently-open listings from public job feeds and company career boards, then ranks them against
          your profile evidence. AutoApply never auto-submits — you apply on the employer&apos;s own site, which is what
          keeps your application legitimate.
        </p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-64 flex-1 text-xs font-semibold text-slate-500">
            Search role or skill
            <input
              className="input mt-1"
              placeholder={profile?.skills?.[0] ? `e.g. ${profile.skills[0]}` : "e.g. pharmacovigilance"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
            />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            Minimum fit
            <select className="input mt-1" value={minFit} onChange={(e) => setMinFit(Number(e.target.value))}>
              <option value={0}>Any</option>
              <option value={30}>30%+</option>
              <option value={50}>50%+</option>
              <option value={70}>70%+ only</option>
            </select>
          </label>
          <label className="mb-2 flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={remoteOnly} onChange={(e) => setRemoteOnly(e.target.checked)} />
            Remote only
          </label>
          <div className="flex gap-2">
            <button onClick={search} disabled={loading} className="btn-primary">
              {loading ? "Searching…" : "Search jobs"}
            </button>
            <button
              onClick={() => setShowAlertsModal(true)}
              className="btn-secondary text-xs px-3"
              title="Configure Automated Job Alerts"
            >
              🔔 Alerts
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {JOB_SOURCES.map((s) => {
            const on = sources.includes(s.key);
            return (
              <button
                key={s.key}
                title={s.note}
                onClick={() => setSources((prev) => (on ? prev.filter((k) => k !== s.key) : [...prev, s.key]))}
                className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                  on ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 text-slate-500 hover:border-slate-300"
                }`}
              >
                {on ? "✓ " : ""}{s.label}
              </button>
            );
          })}
        </div>

        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
        {meta && !showSaved && (
          <p className="mt-3 text-xs text-slate-500">
            Scanned {meta.totalFetched} live listings from {meta.sourcesUsed.length} source(s) for &ldquo;{meta.query}&rdquo; · showing {jobs.length} ranked by fit.
          </p>
        )}
      </div>

      <div className="flex rounded-lg border border-slate-300 bg-white p-1">
        <button
          onClick={() => setShowSaved(false)}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${!showSaved ? "bg-indigo-600 text-white" : "text-slate-600"}`}
        >
          Results ({jobs.length})
        </button>
        <button
          onClick={() => setShowSaved(true)}
          className={`rounded-md px-3 py-1.5 text-sm font-semibold ${showSaved ? "bg-indigo-600 text-white" : "text-slate-600"}`}
        >
          Shortlist ({saved.length})
        </button>
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 w-2/3 rounded bg-slate-200" />
              <div className="mt-2 h-3 w-1/3 rounded bg-slate-200" />
              <div className="mt-4 h-3 w-full rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : list.length === 0 ? (
        <div className="card text-center">
          <p className="font-semibold text-slate-900">{showSaved ? "Your shortlist is empty" : "No jobs loaded yet"}</p>
          <p className="prose-muted mt-1 text-sm">
            {showSaved ? "Save any result to compare it later." : "Run a search to pull live openings that match your profile."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((job) => {
            const v = VERDICT[job.verdict];
            const isSaved = savedIds.has(job.id);
            const open = expanded === job.id;
            return (
              <article key={job.id} className="card card-hover flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-slate-900">{job.title}</h3>
                    <p className="truncate text-sm text-slate-600">
                      {job.company || "Company not stated"}{job.location ? ` · ${job.location}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-2xl font-black ${job.fitScore >= 70 ? "text-emerald-600" : job.fitScore >= 50 ? "text-indigo-600" : "text-slate-500"}`}>
                      {job.fitScore}
                    </p>
                    <p className="text-[10px] font-semibold uppercase text-slate-400">fit</p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className={`badge ${v.cls}`}>{v.label}</span>
                  {job.remote && <span className="badge bg-sky-100 text-sky-700">Remote</span>}
                  {job.salaryText ? (
                    <span className="badge bg-emerald-50 text-emerald-700">{job.salaryText}</span>
                  ) : (
                    <span className="badge bg-slate-100 text-slate-500">Salary not shown</span>
                  )}
                  <span className="badge bg-slate-100 text-slate-600">{freshness(job.freshnessDays)}</span>
                  <span className="badge bg-slate-100 text-slate-500">{job.source}</span>
                </div>

                {job.matchedSkills.length > 0 && (
                  <p className="mt-3 text-xs text-slate-600">
                    <span className="font-semibold text-emerald-700">You match:</span> {job.matchedSkills.join(", ")}
                  </p>
                )}
                {job.missingSkills.length > 0 && (
                  <p className="mt-1 text-xs text-slate-600">
                    <span className="font-semibold text-amber-700">Gaps:</span> {job.missingSkills.slice(0, 5).join(", ")}
                  </p>
                )}

                {open && job.description && (
                  <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-700">
                    {job.description.slice(0, 2500)}
                  </pre>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <button onClick={() => tailorFor(job)} className="btn-primary px-3 py-1.5 text-xs">
                    Tailor resume →
                  </button>
                  {job.company && (
                    <button
                      onClick={() => setSelectedCompanyIntel(job.company)}
                      className="btn-secondary px-2.5 py-1.5 text-xs text-indigo-700"
                    >
                      🏢 Brief
                    </button>
                  )}
                  <a href={job.applyUrl} target="_blank" rel="noreferrer" className="btn-secondary px-3 py-1.5 text-xs">
                    Apply on site ↗
                  </a>
                  {job.description && (
                    <button onClick={() => setExpanded(open ? null : job.id)} className="text-xs font-semibold text-slate-500 hover:text-slate-800">
                      {open ? "Hide JD" : "View JD"}
                    </button>
                  )}
                  <button
                    onClick={() => toggleSave(job as ScoredJob)}
                    className={`ml-auto rounded-lg px-3 py-1.5 text-xs font-bold ${isSaved ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
                  >
                    {isSaved ? "✓ Shortlisted" : "Shortlist"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {showAlertsModal && (
        <JobAlertsModal
          onClose={() => setShowAlertsModal(false)}
          onRunSearch={(q) => {
            setQuery(q);
            search();
          }}
        />
      )}

      {selectedCompanyIntel && (
        <CompanyIntelModal
          companyName={selectedCompanyIntel}
          profile={profile}
          onClose={() => setSelectedCompanyIntel(null)}
        />
      )}
    </div>
  );
}

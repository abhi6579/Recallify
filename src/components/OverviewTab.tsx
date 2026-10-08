"use client";

import { useCallback, useEffect, useState } from "react";
import type { ResumeAgentResult } from "@/lib/agents/types";
import AgentTrace from "./AgentTrace";
import CustomerFeedbackModal from "./CustomerFeedbackModal";

type Analytics = {
  totalApplications: number;
  byStage: Record<string, number>;
  byStatus: Record<string, number>;
  responseRate: number;
  avgResponseDays: number | null;
  totalFollowUps: number;
  overdueFollowUps: number;
  totalResumeRuns: number;
  avgAtsScore: number;
  approvedRuns: number;
  recentRuns: { id: number; companyName: string; roleTitle: string; atsScore: number; finalStatus: string; createdAt: string }[];
  llm: { available: boolean; provider: string | null; model: string | null };
};

type PipelineResult = {
  steps: { agent: string; detail: string }[];
  resumeRunId: number;
  resume: ResumeAgentResult;
  applicationId: number | null;
  requiresConfirmation: boolean;
  generatedBrief: boolean;
};

const STAGES = ["applied", "screening", "interview", "offer", "rejected"];

export default function OverviewTab({ onNavigate }: { onNavigate: (tab: "overview" | "coaching" | "profile" | "style" | "recommender" | "jobs" | "mock-interview" | "linkedin" | "salary" | "resume" | "followup") => void }) {
  const [data, setData] = useState<Analytics | null>(null);
  const [running, setRunning] = useState(false);
  const [pipeline, setPipeline] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/analytics");
    setData(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function runAutopilot() {
    setRunning(true);
    setError(null);
    setPipeline(null);
    try {
      const res = await fetch("/api/pipeline/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followUpDelayDays: 7 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Autopilot failed");
      setPipeline(json);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Autopilot failed");
    } finally {
      setRunning(false);
    }
  }

  function continueInResumeAgent() {
    if (!pipeline) return;
    sessionStorage.setItem(
      "autoapply:resume-draft",
      JSON.stringify({
        jobDescription: pipeline.resume.jobDescription,
        companyName: pipeline.resume.companyName,
        roleTitle: pipeline.resume.roleTitle,
        jobContext: pipeline.resume.jobContext,
      }),
    );
    onNavigate("resume");
  }

  const maxStage = data ? Math.max(1, ...STAGES.map((s) => data.byStage[s] ?? 0)) : 1;

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Autopilot</h2>
            <p className="mt-1 max-w-xl text-sm text-indigo-100">
              Runs the connected workflow: recommend your best role → build a role-specific brief → tailor and verify a
              resume → pause for your review. After you confirm a real application, follow-up scheduling begins.
            </p>
          </div>
          <button
            onClick={runAutopilot}
            disabled={running}
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-indigo-700 shadow hover:bg-indigo-50 disabled:opacity-60"
          >
            {running ? "Agents running…" : "Run Autopilot"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-200">{error}</p>}
        {pipeline && (
          <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {pipeline.steps.map((s, i) => (
              <li key={i} className="rounded-lg bg-white/10 p-3 text-sm backdrop-blur">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-200">
                  {i + 1}. {s.agent}
                </p>
                <p className="mt-1 text-white">{s.detail}</p>
              </li>
            ))}
          </ol>
        )}
        {pipeline && (
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <a href={`/resume/${pipeline.resumeRunId}`} target="_blank" className="rounded-lg bg-white/20 px-3 py-1.5 font-semibold hover:bg-white/30">
              Open print-ready resume ↗
            </a>
            {pipeline.applicationId ? (
              <button onClick={() => onNavigate("followup")} className="rounded-lg bg-white/20 px-3 py-1.5 font-semibold hover:bg-white/30">
                View confirmed application →
              </button>
            ) : (
              <button onClick={continueInResumeAgent} className="rounded-lg bg-white px-3 py-1.5 font-semibold text-indigo-700 hover:bg-indigo-50">
                Review and edit in Resume Agent →
              </button>
            )}
          </div>
        )}
      </div>

      {pipeline && <AgentTrace trace={pipeline.resume.trace} />}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Applications" value={data.totalApplications} sub={`${data.overdueFollowUps} overdue follow-up(s)`} />
            <Stat label="Response rate" value={`${data.responseRate}%`} sub={data.avgResponseDays !== null ? `avg ${data.avgResponseDays}d to reply` : "no replies yet"} />
            <Stat label="Resumes generated" value={data.totalResumeRuns} sub={`${data.approvedRuns} approved by verifier`} />
            <Stat label="Avg ATS score" value={`${data.avgAtsScore}%`} sub={`${data.totalFollowUps} reminders sent`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Pipeline funnel</h3>
              <div className="space-y-2">
                {STAGES.map((s) => (
                  <div key={s} className="flex items-center gap-3 text-sm">
                    <span className="w-20 capitalize text-slate-600">{s}</span>
                    <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                      <div
                        className={`h-full ${s === "rejected" ? "bg-rose-400" : s === "offer" ? "bg-emerald-500" : "bg-indigo-500"}`}
                        style={{ width: `${((data.byStage[s] ?? 0) / maxStage) * 100}%` }}
                      />
                    </div>
                    <span className="w-6 text-right font-semibold text-slate-800">{data.byStage[s] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h3 className="mb-3 text-sm font-semibold text-slate-700">Recent resume runs</h3>
              {data.recentRuns.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No runs yet.{" "}
                  <button onClick={() => onNavigate("resume")} className="font-semibold text-indigo-600 hover:underline">
                    Generate one →
                  </button>
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 text-sm">
                  {data.recentRuns.map((r) => (
                    <li key={r.id} className="flex items-center justify-between py-2">
                      <div>
                        <p className="font-medium text-slate-900">{r.roleTitle || "Untitled role"}</p>
                        <p className="text-xs text-slate-500">{r.companyName || "—"} · {new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${r.finalStatus === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                          ATS {Math.round(r.atsScore * 100)}%
                        </span>
                        <a href={`/resume/${r.id}`} target="_blank" className="text-xs font-semibold text-indigo-600 hover:underline">
                          Open ↗
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-700">Why am I not hearing back?</h3>
              <span className="text-xs text-slate-500">Live diagnosis from your real funnel</span>
            </div>
            <p className="text-sm text-slate-600">
              Based on {data.totalApplications} application(s), {data.totalResumeRuns} resume run(s) and an average ATS of{" "}
              {data.avgAtsScore}%, Alex would call the main blocker:{" "}
              <strong className="text-slate-900">
                {data.totalApplications === 0
                  ? "You haven't submitted a real application yet."
                  : data.avgAtsScore < 70
                    ? "Resumes are not passing ATS screening."
                    : data.responseRate < 15
                      ? "Role targeting, not your resume."
                      : data.responseRate >= 15
                        ? "Interview conversion."
                        : "Follow-up discipline."}
              </strong>
            </p>
          </div>

          <div className="card flex flex-wrap items-center justify-between gap-3 text-sm">
            <div>
              <p className="font-semibold text-slate-800">LLM enhancement layer</p>
              <p className="text-slate-600">
                {data.llm.available
                  ? `Active: ${data.llm.provider} / ${data.llm.model}. Summaries are polished by the model and re-verified by the fact checker.`
                  : "Not configured — running fully deterministic. Set GROQ_API_KEY or TOGETHER_API_KEY to enable open-weight model polish (output is always sanitized and re-verified)."}
              </p>
            </div>
            <span className={`badge ${data.llm.available ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {data.llm.available ? "LLM on" : "Deterministic"}
            </span>
          </div>

          <div className="card bg-gradient-to-r from-indigo-50 via-slate-50 to-violet-50 border-indigo-100 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl">💬</span>
                <p className="font-bold text-slate-900">Your Opinion &amp; Candidate Feedback</p>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Tell us what you understood about AutoApply, what you liked, and what features or local portals you think we lack.
              </p>
            </div>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="btn-primary text-xs px-4 py-2"
            >
              Give Feedback / Rate System →
            </button>
          </div>
        </>
      )}

      {showFeedbackModal && (
        <CustomerFeedbackModal
          profile={null}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="card">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{sub}</p>
    </div>
  );
}

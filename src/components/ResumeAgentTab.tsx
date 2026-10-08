"use client";

import { useEffect, useState } from "react";
import type { JobContext, Profile, ResumeAgentResult, StyleProfile } from "@/lib/agents/types";
import { SAMPLE_JDS } from "@/lib/agents/sampleJds";
import { inferJobMetadata } from "@/lib/agents/jobMetadata";
import { exportResumeToDocx, exportResumeToPdf } from "@/lib/agents/documentExporter";
import CompanyIntelModal from "./CompanyIntelModal";
import AgentTrace from "./AgentTrace";

type ApiError = { error?: string; detail?: string; requestId?: string };

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text.trim()) {
    throw new Error(`The server returned an empty response (${response.status}). Please try again.`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    const looksLikeHtml = /^\s*<!doctype|^\s*<html/i.test(text);
    throw new Error(
      looksLikeHtml
        ? `The application server returned an error page (${response.status}). Please retry—the job description has not been lost.`
        : `The server returned an unreadable response (${response.status}). Please try again.`,
    );
  }
}

function scoreColor(score: number, threshold: number): string {
  return score >= threshold ? "text-emerald-600" : "text-amber-600";
}

type View = "strategy" | "resume" | "cover" | "interview" | "evidence";

export default function ResumeAgentTab({
  profile,
  onProfileChange,
}: {
  profile: Profile | null;
  onProfileChange: (p: Profile) => void;
}) {
  const [jobDescription, setJobDescription] = useState(SAMPLE_JDS[0].text);
  const [companyName, setCompanyName] = useState(SAMPLE_JDS[0].company);
  const [roleTitle, setRoleTitle] = useState(SAMPLE_JDS[0].role);
  const [jobContext, setJobContext] = useState<JobContext>({
    source: "Company careers page",
    sourceUrl: "",
    postedDate: new Date().toISOString().slice(0, 10),
    salaryText: "",
    workMode: "not-specified",
  });
  const [result, setResult] = useState<ResumeAgentResult | null>(null);
  const [runId, setRunId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("resume");
  const [challenge, setChallenge] = useState<{ skill: string; evidence: string } | null>(null);
  const [challengeBusy, setChallengeBusy] = useState(false);
  const [logged, setLogged] = useState<string | null>(null);
  const [showCompanyIntel, setShowCompanyIntel] = useState(false);
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);
  const [applyingStyle, setApplyingStyle] = useState(false);
  const [styleMessage, setStyleMessage] = useState<string | null>(null);

  useEffect(() => {
    const ephemeral = sessionStorage.getItem("autoapply:style-profile");
    if (ephemeral) {
      try {
        setStyleProfile(JSON.parse(ephemeral) as StyleProfile);
      } catch {
        sessionStorage.removeItem("autoapply:style-profile");
      }
    }
    fetch("/api/style")
      .then((response) => response.json())
      .then((data) => {
        if (data.profile) setStyleProfile(data.profile as StyleProfile);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem("autoapply:resume-draft");
    if (!stored) return;
    try {
      const draft = JSON.parse(stored) as {
        jobDescription?: string;
        companyName?: string;
        roleTitle?: string;
        jobContext?: JobContext;
      };
      if (draft.jobDescription) setJobDescription(draft.jobDescription);
      if (draft.companyName) setCompanyName(draft.companyName);
      if (draft.roleTitle) setRoleTitle(draft.roleTitle);
      if (draft.jobContext) setJobContext(draft.jobContext);
      setResult(null);
      setRunId(null);
    } catch {
      // Ignore an invalid/old draft; the default sample remains available.
    } finally {
      sessionStorage.removeItem("autoapply:resume-draft");
    }
  }, []);

  function loadSample(id: string) {
    const jd = SAMPLE_JDS.find((j) => j.id === id);
    if (!jd) return;
    setJobDescription(jd.text);
    setCompanyName(jd.company);
    setRoleTitle(jd.role);
  }

  function handleJobDescriptionChange(value: string) {
    const previousSample = SAMPLE_JDS.find(
      (sample) => sample.company === companyName && sample.role === roleTitle,
    );
    const meta = inferJobMetadata(value);
    // Only adopt the opening heading when the current fields are a stale sample.
    const detected = {
      roleTitle: meta.roleTitle ?? (previousSample ? meta.headingTitle : null),
      companyName: meta.companyName,
    };

    setJobDescription(value);
    if (detected.roleTitle) {
      setRoleTitle(detected.roleTitle);
      // If the previous company came from a sample and the newly pasted JD is
      // clearly a different role but has no company name, do not falsely keep
      // "Infosys DaAI" attached to an Assistant Professor application.
      if (!detected.companyName && previousSample && detected.roleTitle !== previousSample.role) {
        setCompanyName("");
      }
    }
    if (detected.companyName) setCompanyName(detected.companyName);
  }

  async function handleGenerate(overrideProfile?: Profile) {
    setLoading(true);
    setError(null);
    setLogged(null);
    try {
      const res = await fetch("/api/resume/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, companyName, roleTitle, jobContext, profile: overrideProfile ?? profile }),
      });
      const data = await readApiJson<{
        result: ResumeAgentResult;
        id: number;
        requestId?: string;
        detected?: { roleTitle?: string | null; companyName?: string | null };
      } & ApiError>(res);
      if (!res.ok) {
        throw new Error(`${data.error ?? "Failed to generate resume"}${data.requestId ? ` (reference ${data.requestId})` : ""}`);
      }
      setResult(data.result);
      setRunId(data.id);
      setRoleTitle(data.result.roleTitle);
      setCompanyName(data.result.companyName);
      setView("strategy");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function submitChallenge() {
    if (!challenge) return;
    setChallengeBusy(true);
    try {
      const res = await fetch("/api/profile/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(challenge),
      });
      const data = await readApiJson<{ profile: Profile } & ApiError>(res);
      if (!res.ok) throw new Error(data.error ?? "Challenge failed");
      onProfileChange(data.profile);
      setChallenge(null);
      await handleGenerate(data.profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Challenge failed");
    } finally {
      setChallengeBusy(false);
    }
  }

  async function logApplication() {
    if (!result) return;
    setLogged(null);
    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: result.companyName || companyName || "Company not specified",
          role: result.roleTitle || roleTitle || "Role not specified",
          contactEmail: "",
          appliedDate: new Date().toISOString().slice(0, 10),
          followUpDelayDays: 7,
          maxFollowUps: 3,
          resumeRunId: runId,
          notes: `ATS ${Math.round(result.atsScore * 100)}% · match ${result.matchRange[0]}–${result.matchRange[1]}%`,
        }),
      });
      const data = await readApiJson<{ application?: { id: number } } & ApiError>(res);
      if (!res.ok || !data.application) throw new Error(data.error ?? "Failed to log application");
      setLogged(`Application #${data.application.id} logged and connected to this resume with a 7-day follow-up.`);
    } catch (e) {
      setLogged(e instanceof Error ? e.message : "Failed to log application");
    }
  }

  async function applyMyVoice() {
    if (!result || !styleProfile) return;
    setApplyingStyle(true);
    setStyleMessage(null);

    const summaryMatch = result.resumeText.match(/SUMMARY\n([\s\S]*?)\n\nCORE SKILLS/);
    const requests = [
      { key: "cover", kind: "cover_letter", text: result.coverLetter },
      { key: "recruiter", kind: "recruiter_message", text: result.jobIntelligence.recruiterMessage },
      { key: "referral", kind: "recruiter_message", text: result.jobIntelligence.referralRequest },
      ...(summaryMatch ? [{ key: "summary", kind: "summary", text: summaryMatch[1] }] : []),
    ];

    try {
      const rewrittenItems = await Promise.all(
        requests.map(async (item) => {
          const response = await fetch("/api/style/rewrite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: item.text,
              kind: item.kind,
              style: styleProfile,
            }),
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error ?? "Style rewrite failed.");
          return { ...item, output: data.text as string, provider: data.provider as string };
        }),
      );

      const byKey = Object.fromEntries(rewrittenItems.map((item) => [item.key, item.output]));
      const styledSummary = byKey.summary as string | undefined;
      setResult({
        ...result,
        resumeText: styledSummary && summaryMatch
          ? result.resumeText.replace(summaryMatch[1], styledSummary)
          : result.resumeText,
        coverLetter: (byKey.cover as string | undefined) ?? result.coverLetter,
        jobIntelligence: {
          ...result.jobIntelligence,
          recruiterMessage: (byKey.recruiter as string | undefined) ?? result.jobIntelligence.recruiterMessage,
          referralRequest: (byKey.referral as string | undefined) ?? result.jobIntelligence.referralRequest,
        },
      });
      const provider = rewrittenItems.find((item) => item.provider !== "deterministic")?.provider ?? "deterministic";
      setStyleMessage(`Application voice matched successfully using ${provider}. Scores and factual evidence were not changed.`);
    } catch (cause) {
      setStyleMessage(cause instanceof Error ? cause.message : "Style Mirror could not update this package.");
    } finally {
      setApplyingStyle(false);
    }
  }

  function download(text: string, name: string) {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadPdf() {
    if (!result) return;
    const blob = exportResumeToPdf(result.resumeText, {
      candidateName: profile?.name || "Candidate",
      roleTitle: result.roleTitle,
      style: "modern",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(profile?.name || "Candidate").replace(/\s+/g, "_")}_${result.roleTitle.replace(/\s+/g, "_")}_Resume.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadDocx() {
    if (!result) return;
    const blob = exportResumeToDocx(result.resumeText, `${result.roleTitle} Resume - ${profile?.name || "Candidate"}`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(profile?.name || "Candidate").replace(/\s+/g, "_")}_${result.roleTitle.replace(/\s+/g, "_")}_Resume.doc`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Resume Agent</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Parses the JD → retrieves grounded evidence → drafts → scores ATS coverage→ fact-checks every claim →
              revises in a loop → produces resume, cover letter, interview brief, listing trust scan and salary snapshot.
              <span className="mt-1 block text-xs font-medium text-emerald-700">
                Includes the $200+ bundle most services sell separately — cover letter, ATS keyword scan, and interview prep.
              </span>
            </p>
          </div>
          <label className="text-xs text-slate-500">
            Load sample JD
            <select className="input mt-1" defaultValue={SAMPLE_JDS[0].id} onChange={(e) => loadSample(e.target.value)}>
              {SAMPLE_JDS.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.role} @ {j.company}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Company</span>
            <input className="input" placeholder="Enter the employer name if it is not in the JD" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Role title</span>
            <input className="input" value={roleTitle} onChange={(e) => setRoleTitle(e.target.value)} />
          </label>
        </div>

        <details className="rounded-xl border border-slate-200 bg-slate-50 p-4" open>
          <summary className="cursor-pointer text-sm font-semibold text-slate-700">Posting context · helps detect stale, ghost, or risky listings</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block text-xs font-semibold text-slate-500">
              Where did you find it?
              <select className="input mt-1" value={jobContext.source ?? ""} onChange={(e) => setJobContext({ ...jobContext, source: e.target.value })}>
                <option>Company careers page</option>
                <option>LinkedIn</option>
                <option>Indeed</option>
                <option>Glassdoor</option>
                <option>Referral</option>
                <option>Recruiter message</option>
                <option>Other</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-500 lg:col-span-2">
              Posting URL
              <input className="input mt-1" placeholder="https://company.com/careers/..." value={jobContext.sourceUrl ?? ""} onChange={(e) => setJobContext({ ...jobContext, sourceUrl: e.target.value })} />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              Posted date
              <input type="date" className="input mt-1" value={jobContext.postedDate ?? ""} onChange={(e) => setJobContext({ ...jobContext, postedDate: e.target.value })} />
            </label>
            <label className="block text-xs font-semibold text-slate-500">
              Work mode
              <select className="input mt-1" value={jobContext.workMode ?? "not-specified"} onChange={(e) => setJobContext({ ...jobContext, workMode: e.target.value as JobContext["workMode"] })}>
                <option value="not-specified">Not specified</option>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-500 sm:col-span-2 lg:col-span-5">
              Salary shown (optional)
              <input className="input mt-1" placeholder="e.g. ₹12–18 LPA or $120k–150k" value={jobContext.salaryText ?? ""} onChange={(e) => setJobContext({ ...jobContext, salaryText: e.target.value })} />
            </label>
          </div>
        </details>

        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Job description</span>
          <textarea className="input min-h-[220px] text-sm" value={jobDescription} onChange={(e) => handleJobDescriptionChange(e.target.value)} />
        </label>

        <button onClick={() => handleGenerate()} disabled={loading || !profile} className="btn-primary">
          {loading ? "Agents running…" : "Generate Tailored Resume"}
        </button>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>

      {result && (
        <>
          <div className="card space-y-5">
            <div className="flex flex-wrap items-center gap-6">
              <Metric label="Apply priority" value={`${result.jobIntelligence.applicationPriority}/100`} cls={result.jobIntelligence.applicationPriority >= 72 ? "text-emerald-600" : "text-amber-600"} />
              <Metric label="Listing trust" value={`${result.jobIntelligence.trustScore}/100`} cls={result.jobIntelligence.trustScore >= 70 ? "text-emerald-600" : "text-rose-600"} />
              <Metric label="ATS score" value={`${Math.round(result.atsScore * 100)}%`} cls={scoreColor(result.atsScore * 100, 85)} />
              <Metric label="Match confidence" value={`${result.matchRange[0]}–${result.matchRange[1]}%`} cls="text-indigo-700" />
              <Metric label="Factual score" value={`${Math.round(result.factualScore * 100)}%`} cls={scoreColor(result.factualScore * 100, 95)} />
              <Metric label="Revisions" value={String(result.revisionCount)} cls="text-slate-800" />
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                <span className={`badge ${result.finalStatus === "approved" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                  {result.finalStatus}
                </span>
                {result.llmEnhanced && <span className="badge ml-1 bg-violet-100 text-violet-700">LLM polished</span>}
              </div>
              <div className="ml-auto flex flex-wrap gap-2">
                {styleProfile ? (
                  <button onClick={applyMyVoice} disabled={applyingStyle} className="btn-secondary border-violet-200 bg-violet-50 text-xs text-violet-700">
                    {applyingStyle ? "Matching voice…" : "Apply my Style Mirror"}
                  </button>
                ) : (
                  <span className="self-center text-[11px] text-slate-500">Create Style Mirror to personalize the voice</span>
                )}
                {companyName && (
                  <button
                    onClick={() => setShowCompanyIntel(true)}
                    className="btn-secondary text-xs"
                  >
                    🏢 Company Brief
                  </button>
                )}
                <a href={`#salary`} onClick={(e) => {
                  e.preventDefault();
                  sessionStorage.setItem("autoapply:salary-role", result.roleTitle || roleTitle);
                  window.dispatchEvent(new CustomEvent("autoapply:open-salary"));
                }} className="btn-secondary text-xs">
                  💰 Salary Coach →
                </a>
                <button onClick={downloadPdf} className="btn-primary text-xs bg-indigo-600">
                  📥 Download PDF
                </button>
                <button onClick={downloadDocx} className="btn-secondary text-xs">
                  📄 Word (.doc)
                </button>
                {runId && (
                  <a href={`/resume/${runId}`} target="_blank" className="btn-secondary text-xs">
                    Print View ↗
                  </a>
                )}
                <button onClick={logApplication} className="btn-primary text-xs bg-emerald-600 hover:bg-emerald-700">
                  + Log Application
                </button>
              </div>
            </div>
            {logged && <p className="text-sm font-medium text-emerald-700">{logged}</p>}
            {styleMessage && <p className={`text-sm font-medium ${styleMessage.includes("successfully") ? "text-violet-700" : "text-rose-600"}`}>{styleMessage}</p>}

            {result.atsMissingKeywords.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-semibold text-amber-900">Gaps detected — challenge if you actually have them</p>
                <p className="mb-2 text-xs text-amber-800">
                  The agent refuses to fabricate. If you truly have a skill, add evidence and it becomes part of your profile memory
                  and the resume is regenerated.
                </p>
                <div className="flex flex-wrap gap-2">
                  {result.atsMissingKeywords.map((k) => (
                    <button
                      key={k}
                      onClick={() => setChallenge({ skill: k, evidence: "" })}
                      className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                    >
                      {k} · challenge
                    </button>
                  ))}
                </div>
                {challenge && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-semibold text-slate-700">Evidence for &quot;{challenge.skill}&quot;</p>
                    <textarea
                      className="input min-h-[70px]"
                      placeholder="e.g. Deployed a FastAPI model server on Kubernetes (minikube + HPA) for my DocTune project in 2025."
                      value={challenge.evidence}
                      onChange={(e) => setChallenge({ ...challenge, evidence: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <button onClick={submitChallenge} disabled={challengeBusy} className="btn-primary">
                        {challengeBusy ? "Updating…" : "Add to profile & regenerate"}
                      </button>
                      <button onClick={() => setChallenge(null)} className="btn-secondary">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {result.factualIssues.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-rose-700">Factual issues flagged</p>
                <ul className="list-disc pl-5 text-sm text-rose-600">
                  {result.factualIssues.map((issue, idx) => (
                    <li key={idx}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="mb-1 text-sm font-semibold text-slate-700">Change report</p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
                {result.changeReport.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="card">
              <div className="mb-3 flex flex-wrap gap-1 border-b border-slate-200 pb-2">
                {(
                  [
                    ["strategy", "Job strategy"],
                    ["resume", "Resume"],
                    ["cover", "Cover letter"],
                    ["interview", `Interview prep (${result.interviewQuestions.length})`],
                    ["evidence", "Evidence map"],
                  ] as [View, string][]
                ).map(([id, label]) => (
                  <button
                    key={id}
                    onClick={() => setView(id)}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold ${view === id ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {view === "strategy" && (
                <div className="space-y-5">
                  <div className={`rounded-xl border p-4 ${result.jobIntelligence.recommendation === "apply_now" ? "border-emerald-200 bg-emerald-50" : result.jobIntelligence.recommendation === "verify_first" ? "border-rose-200 bg-rose-50" : "border-amber-200 bg-amber-50"}`}>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Agent recommendation</p>
                    <p className="mt-1 text-xl font-bold capitalize text-slate-900">{result.jobIntelligence.recommendation.replaceAll("_", " ")}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <RiskBadge label="Scam risk" value={result.jobIntelligence.scamRisk} />
                      <RiskBadge label="Ghost-job risk" value={result.jobIntelligence.ghostRisk} />
                      <span className={`badge ${result.jobIntelligence.salaryTransparent ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                        Salary {result.jobIntelligence.salaryTransparent ? "disclosed" : "not disclosed"}
                      </span>
                      <span className="badge bg-indigo-100 text-indigo-700">JD clarity {result.jobIntelligence.clarityScore}/100</span>
                      {result.jobIntelligence.postingAgeDays !== null && <span className="badge bg-slate-200 text-slate-700">{result.jobIntelligence.postingAgeDays} days old</span>}
                    </div>
                  </div>

                  {/* Jobscan-style per-job ATS keyword scan */}
                  <div className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-800">
                        <span>Keywords matched</span>
                        <span className="badge bg-emerald-100 text-emerald-700">{result.matchedEvidence.filter((e) => e.score > 0).length}</span>
                      </p>
                      {result.matchedEvidence.filter((e) => e.score > 0).length === 0 ? (
                        <p className="text-xs text-slate-500">No requirement was backed by your evidence yet.</p>
                      ) : (
                        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                          {result.matchedEvidence.filter((e) => e.score > 0).map((e, i) => (
                            <li key={i} className="flex items-center gap-1.5 text-slate-700">
                              <span className="font-bold text-emerald-600">✓</span>
                              <span className="truncate">{e.requirement}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-rose-800">
                        <span>Keywords missing</span>
                        <span className="badge bg-rose-100 text-rose-700">{result.atsMissingKeywords.length}</span>
                      </p>
                      {result.atsMissingKeywords.length === 0 ? (
                        <p className="text-xs text-emerald-700">Nothing missing — this resume covers every parsed requirement.</p>
                      ) : (
                        <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                          {result.atsMissingKeywords.map((k, i) => (
                            <li key={i} className="flex items-center gap-1.5 text-slate-700">
                              <span className="font-bold text-rose-600">✕</span>
                              <span className="truncate">{k}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="mb-2 text-sm font-semibold text-emerald-800">Positive signals</p>
                      {result.jobIntelligence.positiveSignals.length === 0 ? <p className="text-xs text-slate-500">No strong trust signals detected yet.</p> : (
                        <ul className="space-y-1 text-xs text-slate-700">
                          {result.jobIntelligence.positiveSignals.map((s, i) => <li key={i}>✓ {s}</li>)}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="mb-2 text-sm font-semibold text-rose-800">Checks &amp; risk flags</p>
                      {result.jobIntelligence.riskFlags.length === 0 ? <p className="text-xs text-emerald-700">No major red flags detected.</p> : (
                        <ul className="space-y-1 text-xs text-slate-700">
                          {result.jobIntelligence.riskFlags.map((s, i) => <li key={i}>⚠ {s}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-sm font-semibold text-slate-800">Recommended action plan</p>
                    <ol className="space-y-2">
                      {result.jobIntelligence.actions.map((a, i) => (
                        <li key={i} className="flex gap-3 rounded-lg border border-slate-200 p-3">
                          <span className={`badge h-fit ${a.priority === "now" ? "bg-rose-100 text-rose-700" : a.priority === "next" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{a.priority}</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{a.title}</p>
                            <p className="text-xs text-slate-600">{a.detail}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <MessageBox title="Recruiter message" text={result.jobIntelligence.recruiterMessage} />
                  <MessageBox title="Low-pressure referral request" text={result.jobIntelligence.referralRequest} />
                </div>
              )}
              {view === "resume" && (
                <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 font-mono text-xs text-slate-800">
                  {result.resumeText}
                </pre>
              )}
              {view === "cover" && (
                <div className="space-y-2">
                  <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 font-sans text-sm text-slate-800">
                    {result.coverLetter}
                  </pre>
                  <button onClick={() => download(result.coverLetter, `${roleTitle.replace(/\s+/g, "_")}_cover_letter.txt`)} className="btn-secondary">
                    Download cover letter
                  </button>
                </div>
              )}
              {view === "interview" && (
                <ol className="space-y-3">
                  {result.interviewQuestions.map((q, i) => (
                    <li key={i} className="rounded-lg border border-slate-200 p-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {i + 1}. {q.question}
                      </p>
                      <p className="mt-1 text-xs text-slate-600">💡 {q.hint}</p>
                    </li>
                  ))}
                </ol>
              )}
              {view === "evidence" && (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-slate-500">
                      <th className="py-1 pr-2">Requirement</th>
                      <th className="py-1 pr-2">Source</th>
                      <th className="py-1 pr-2">Score</th>
                      <th className="py-1">Evidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.matchedEvidence.map((e, i) => (
                      <tr key={i} className="border-b border-slate-100 align-top">
                        <td className="py-1.5 pr-2 font-medium text-slate-800">{e.requirement}</td>
                        <td className="py-1.5 pr-2">
                          <span className={`badge ${e.source === "none" ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>{e.source}</span>
                        </td>
                        <td className="py-1.5 pr-2 text-slate-600">{Math.round(e.score * 100)}%</td>
                        <td className="py-1.5 text-slate-600">{e.evidence[0] ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

          <AgentTrace trace={result.trace} />
        </div>
      </>
    )}

    {showCompanyIntel && (
      <CompanyIntelModal
        companyName={companyName || result?.companyName || "Target Employer"}
        profile={profile}
        onClose={() => setShowCompanyIntel(false)}
      />
    )}
  </div>
);
}

function RiskBadge({ label, value }: { label: string; value: "low" | "medium" | "high" }) {
  const cls = value === "low" ? "bg-emerald-100 text-emerald-700" : value === "medium" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700";
  return <span className={`badge ${cls}`}>{label}: {value}</span>;
}

function MessageBox({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <button type="button" onClick={copy} className="text-xs font-semibold text-indigo-600 hover:underline">{copied ? "Copied" : "Copy"}</button>
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}

function Metric({ label, value, cls }: { label: string; value: string; cls: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-2xl font-bold ${cls}`}>{value}</p>
    </div>
  );
}

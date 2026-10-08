"use client";

import { useState } from "react";
import type { SalaryReport } from "@/lib/agents/types";

export default function SalaryTab() {
  const [role, setRole] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("autoapply:salary-role") ?? "";
    }
    return "";
  });
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState<SalaryReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function run() {
    const roleTitle = role.trim();
    if (!roleTitle) return;
    setBusy(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleTitle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Salary research failed");
      setReport(data.report);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Salary research failed");
    } finally {
      setBusy(false);
    }
  }

  async function copyScript() {
    if (!report) return;
    await navigator.clipboard.writeText(report.negotiationScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900">Salary Coach</h2>
        <p className="mt-1 text-sm text-slate-600">
          Researches live pay bands from current job listings, tells you what number to quote, and writes the
          negotiation message — in plain language, not corporate jargon. Available for the whole library, not just tech.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="min-w-72 flex-1 text-xs font-semibold text-slate-500">
            Role
            <input
              className="input mt-1"
              placeholder="e.g. Clinical Trial Manager, AI/ML Engineer, HR Business Partner"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
          </label>
          <button onClick={run} disabled={busy || !role.trim()} className="btn-primary">
            {busy ? "Researching…" : "Research market"}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      </div>

      {report && (
        <>
          <div className="card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Market range</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{report.role}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {report.dataSource === "live_market" ? `Based on ${report.sampleSize} live postings` : report.caveats[0]}
                </p>
              </div>
              {report.band ? (
                <div className="grid grid-cols-3 gap-3 text-right">
                  <Band label="P25" value={fmt(report.band.p25, report.currency)} />
                  <Band label="Median" value={fmt(report.band.median, report.currency)} prominent />
                  <Band label="P75" value={fmt(report.band.p75, report.currency)} />
                </div>
              ) : (
                <div className="rounded-xl bg-slate-100 px-4 py-3 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Estimated band</p>
                  <p className="text-xl font-black text-slate-900">{report.targetComp ? fmt(report.targetComp, report.currency) : "—"}</p>
                </div>
              )}
            </div>

            {report.talkingPoints.length > 0 && (
              <ul className="prose-muted mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
                {report.talkingPoints.map((p, i) => (
                  <li key={i}>• {p}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="card">
              <p className="eyebrow">What to quote</p>
              {report.targetComp ? (
                <>
                  <p className="mt-2 text-2xl font-black text-slate-900">
                    Around {fmt(report.targetComp, report.currency)}
                    {report.band ? <span className="text-base font-bold text-slate-500"> · {fmt((report.band.p75), report.currency)}</span> : null}
                  </p>
                  <p className="prose-muted mt-2 text-sm">{report.rangeStatement}</p>
                  <div className="mt-4 rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Opening ask (spoken)</p>
                    <p className="prose-muted mt-2 text-sm">{report.openingAsk}</p>
                  </div>
                  {report.walkAwayThreshold && (
                    <p className="mt-3 text-xs text-slate-500">
                      Suggested walk-away floor: <span className="font-semibold text-slate-700">{fmt(report.walkAwayThreshold, report.currency)}</span>. Adjust to your personal non-negotiables.
                    </p>
                  )}
                </>
              ) : (
                <p className="prose-muted mt-2 text-sm">{report.rangeStatement}</p>
              )}
            </div>

            <div className="card flex flex-col">
              <div className="mb-2 flex items-center justify-between">
                <p className="eyebrow mb-0">Negotiation script</p>
                <button onClick={copyScript} className="text-xs font-semibold text-indigo-600 hover:underline">
                  {copied ? "Copied" : "Copy message"}
                </button>
              </div>
              <pre className="max-h-[380px] flex-1 overflow-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-4 font-sans text-sm leading-relaxed text-slate-800">
                {report.negotiationScript}
              </pre>
            </div>
          </div>

          {report.talkingPoints.length > 0 && false}
          <div className="card">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Honesty notes</p>
            <ul className="prose-muted mt-2 list-disc space-y-1 pl-5 text-sm">
              {report.caveats.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

function Band({ label, value, prominent }: { label: string; value: string; prominent?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`font-black ${prominent ? "text-xl text-indigo-700" : "text-base text-slate-800"}`}>{value}</p>
    </div>
  );
}

function fmt(n: number, currency: string): string {
  if (currency === "INR") return `₹${n >= 100000 ? (n / 100000).toFixed(1) + " L" : n.toLocaleString("en-IN")}`;
  const symbol = { USD: "$", GBP: "£", CAD: "C$", AUD: "A$", ZAR: "R" }[currency] ?? currency + " ";
  return `${symbol}${n.toLocaleString("en-US")}`;
}

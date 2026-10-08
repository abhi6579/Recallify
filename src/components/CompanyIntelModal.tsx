"use client";

import { useEffect, useState } from "react";
import type { CompanyIntelligence, Profile } from "@/lib/agents/types";

export default function CompanyIntelModal({
  companyName,
  profile,
  onClose,
}: {
  companyName: string;
  profile: Profile | null;
  onClose: () => void;
}) {
  const [intel, setIntel] = useState<CompanyIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedPitch, setCopiedPitch] = useState(false);

  useEffect(() => {
    fetch("/api/company-intel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, profile }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.brief) setIntel(d.brief);
      })
      .finally(() => setLoading(false));
  }, [companyName, profile]);

  async function copyPitch() {
    if (!intel?.whyUsPitch) return;
    await navigator.clipboard.writeText(intel.whyUsPitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Company Intelligence Brief</p>
            <h3 className="text-xl font-bold text-slate-900">{companyName}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="py-12 text-center text-sm text-slate-500 animate-pulse">
              🔍 Researching corporate filings, engineering stack, and culture signals for {companyName}…
            </div>
          ) : !intel ? (
            <p className="text-sm text-slate-500">Could not assemble company intelligence brief.</p>
          ) : (
            <>
              {/* Key Overview */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Industry</p>
                  <p className="font-semibold text-slate-800 truncate">{intel.industry}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Headquarters</p>
                  <p className="font-semibold text-slate-800 truncate">{intel.headquarters}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Stage</p>
                  <p className="font-semibold text-slate-800 truncate">{intel.sizeStage}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase text-slate-400 font-bold">Hiring Velocity</p>
                  <span className={`badge ${intel.hiringVelocity === "High" ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"}`}>
                    {intel.hiringVelocity}
                  </span>
                </div>
              </div>

              {/* Tech Stack / Core Tools */}
              <div>
                <p className="text-xs font-bold uppercase text-slate-500 mb-1.5">Engineering & Operational Stack</p>
                <div className="flex flex-wrap gap-1.5">
                  {intel.techStack.map((t) => (
                    <span key={t} className="badge bg-indigo-50 text-indigo-700 font-medium">{t}</span>
                  ))}
                </div>
              </div>

              {/* Tailored "Why Us?" Pitch */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-bold uppercase text-indigo-950">✨ Tailored &quot;Why This Company?&quot; Pitch</p>
                  <button onClick={copyPitch} className="text-xs font-bold text-indigo-700 hover:underline">
                    {copiedPitch ? "Copied!" : "Copy Pitch"}
                  </button>
                </div>
                <p className="text-xs leading-relaxed text-slate-800">{intel.whyUsPitch}</p>
              </div>

              {/* Smart Questions to Ask */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase text-slate-700 mb-2">💡 High-Impact Questions to Ask Interviewers</p>
                <ul className="space-y-2 text-xs text-slate-700">
                  {intel.smartQuestions.map((q, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="font-bold text-indigo-600">{i + 1}.</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Culture & Red Flags */}
              <div className="grid gap-3 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                  <p className="font-bold text-emerald-900 mb-1">Culture Signals</p>
                  <ul className="space-y-1 text-slate-700">
                    {intel.cultureSignals.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="font-bold text-slate-800 mb-1">Due Diligence Notes</p>
                  <ul className="space-y-1 text-slate-600">
                    {intel.redFlags.map((r, i) => (
                      <li key={i}>• {r}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 text-right">
          <button onClick={onClose} className="btn-secondary text-xs">Close</button>
        </div>
      </div>
    </div>
  );
}

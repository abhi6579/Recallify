"use client";

import { useState } from "react";
import type { Profile, RecommenderResult } from "@/lib/agents/types";
import { learningPathFor } from "@/lib/agents/extras";
import { ROLE_CATEGORIES } from "@/lib/agents/roleLibrary";
import Image from "next/image";
import { categoriesForFields, fieldByKey } from "@/lib/agents/careerFields";

function matchColor(score: number): string {
  if (score >= 80) return "bg-emerald-100 text-emerald-700";
  if (score >= 60) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
}

export default function RecommenderTab({ profile, onTailor }: { profile: Profile | null; onTailor: () => void }) {
  const [result, setResult] = useState<RecommenderResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sector, setSector] = useState<string>("all");

  const fieldKeys = profile?.careerFields ?? [];
  const fieldCategories = categoriesForFields(fieldKeys);
  const sectorOptions = fieldCategories.length > 0 ? fieldCategories.sort() : ROLE_CATEGORIES;

  async function handleRun() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, category: sector === "all" ? undefined : sector }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get recommendations");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-lg font-semibold text-slate-900">🎯 Role Recommender</h2>
        <p className="mt-1 text-sm text-slate-600">
          Analyzes your profile memory — skills, inferred domains, seniority — and matches it against the full role library.
          Each gap comes with an upskilling roadmap so you can close it, not just see it.
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block text-xs font-semibold text-slate-500">
            Filter by sector
            <select className="input mt-1 min-w-56" value={sector} onChange={(e) => setSector(e.target.value)}>
              <option value="all">All my sectors ({sectorOptions.length})</option>
              {sectorOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <button onClick={handleRun} disabled={loading || !profile} className="btn-primary">
            {loading ? "Analyzing…" : "Find Best Roles"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      </div>

      {result && (
        <div className="card space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
            <span className="badge bg-slate-100 text-slate-700">Seniority: {result.profileSignature.seniority}</span>
            <span className="badge bg-slate-100 text-slate-700">~{result.profileSignature.totalYearsExperience} yrs experience</span>
            {result.profileSignature.domains.map((d) => (
              <span key={d} className="badge bg-indigo-50 text-indigo-700">
                {d}
              </span>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Match</th>
                  <th className="py-2 pr-4">Missing skills</th>
                  <th className="py-2 pr-4">Salary (INR/yr)</th>
                  <th className="py-2 pr-4">USD/hr</th>
                  <th className="py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {result.recommendations.map((r, i) => (
                  <tr key={r.title} className="border-b border-slate-100 align-top">
                    <td className="py-3 pr-4 text-slate-500">{i + 1}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-900">{r.title}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                        <span className="badge bg-slate-100 text-slate-700">{r.category}</span>
                        <span>{r.seniority}</span>
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`badge ${matchColor(r.matchScore)}`}>{r.matchScore}%</span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {r.missingSkills.length === 0 ? (
                        <span className="text-emerald-600">None — ready to apply</span>
                      ) : (
                        <button onClick={() => setExpanded(expanded === r.title ? null : r.title)} className="text-left hover:underline">
                          {r.missingSkills.join(", ")}
                          <span className="ml-1 text-xs text-indigo-600">{expanded === r.title ? "▲ hide roadmap" : "▼ roadmap"}</span>
                        </button>
                      )}
                      {expanded === r.title && (
                        <ul className="mt-2 space-y-2 rounded-lg bg-slate-50 p-3">
                          {r.missingSkills.map((s) => {
                            const lp = learningPathFor(s);
                            return (
                              <li key={s} className="text-xs">
                                <p className="font-semibold text-slate-800">
                                  {s} <span className="font-normal text-slate-500">· {lp.effort}</span>
                                </p>
                                <p className="text-slate-600">📚 {lp.resource}</p>
                                <p className="text-slate-600">🛠 {lp.project}</p>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      ₹{(r.salaryRangeInr[0] / 100000).toFixed(1)}–{(r.salaryRangeInr[1] / 100000).toFixed(1)} LPA
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      ${r.salaryRangeUsdHourly[0]}–{r.salaryRangeUsdHourly[1]}
                    </td>
                    <td className="py-3 pr-4">
                      <button onClick={onTailor} className="whitespace-nowrap text-xs font-semibold text-indigo-600 hover:underline">
                        Find live jobs →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <details className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            <summary className="cursor-pointer font-semibold text-slate-700">Audit trail</summary>
            <ul className="mt-2 list-disc space-y-1 pl-4">
              {result.auditTrail.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          </details>
        </div>
      )}
    </div>
  );
}

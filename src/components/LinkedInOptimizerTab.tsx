"use client";

import { useEffect, useState } from "react";
import type { LinkedInPackage, Profile } from "@/lib/agents/types";

export default function LinkedInOptimizerTab({ profile }: { profile: Profile | null }) {
  const [roleTarget, setRoleTarget] = useState(profile?.skills?.[0] ? `${profile.skills[0]} Specialist` : "AI/ML Engineer");
  const [pkg, setPkg] = useState<LinkedInPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.skills?.[0]) {
      const initialTarget = `${profile.skills[0]} Specialist`;
      setRoleTarget(initialTarget);
      generate(initialTarget);
    }
  }, [profile]);

  async function generate(overrideTarget?: string) {
    const target = (overrideTarget || roleTarget).trim();
    if (!target) return;
    setLoading(true);
    try {
      const res = await fetch("/api/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleTarget: target, profile, force: true }),
      });
      const data = await res.json();
      if (res.ok && data.package) {
        setPkg(data.package);
      }
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">🔗 LinkedIn Profile &amp; Outreach Optimizer</h2>
            <p className="prose-muted mt-1 max-w-2xl text-sm">
              Transform your profile into a high-conversion magnet for recruiters. Generates high-CTR headlines,
              story-driven About narratives, SEO keyword ranking, featured project hooks, and warm outreach templates.
            </p>
          </div>
          {pkg && (
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-right">
              <p className="text-[10px] uppercase font-bold text-indigo-700">Recruiter SEO Score</p>
              <p className="text-2xl font-black text-indigo-900">{pkg.seoScore}/100</p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="min-w-64 flex-1 text-xs font-semibold text-slate-600">
            Target Job Title / Career Focus
            <input
              className="input mt-1"
              value={roleTarget}
              onChange={(e) => setRoleTarget(e.target.value)}
              placeholder="e.g. Lead Data Scientist, Clinical Trial Manager"
            />
          </label>
          <button
            onClick={() => generate()}
            disabled={loading || !roleTarget.trim()}
            className="btn-primary"
          >
            {loading ? "Optimizing Profile…" : "Generate Optimization Package →"}
          </button>
        </div>
      </div>

      {pkg && (
        <div className="space-y-6">
          {/* Headlines */}
          <div className="card space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">1. High-CTR LinkedIn Headlines</h3>
            <p className="text-xs text-slate-500">Choose the variation that matches your career positioning:</p>
            <div className="space-y-2">
              {pkg.headlines.map((hl, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-xs font-medium text-slate-800">{hl}</p>
                  <button
                    onClick={() => copyToClipboard(hl, `hl-${i}`)}
                    className="btn-secondary text-xs px-3 py-1 whitespace-nowrap"
                  >
                    {copiedKey === `hl-${i}` ? "✓ Copied" : "Copy"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* About Section */}
          <div className="card space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">2. Story-Driven &quot;About&quot; Section Narratives</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {pkg.aboutNarratives.map((abt, i) => (
                <div key={i} className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-indigo-900">{abt.title}</p>
                      <button
                        onClick={() => copyToClipboard(abt.content, `abt-${i}`)}
                        className="text-xs font-bold text-indigo-600 hover:underline"
                      >
                        {copiedKey === `abt-${i}` ? "✓ Copied" : "Copy All"}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-slate-700">{abt.content}</pre>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Projects & Outreach */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="card space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">3. Featured Project Posts</h3>
              <p className="text-xs text-slate-500">Ready to post with hashtags and metrics:</p>
              <div className="space-y-2">
                {pkg.featuredProjectHooks.map((hook, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="font-bold text-slate-700">Project Post #{i + 1}</span>
                      <button onClick={() => copyToClipboard(hook, `proj-${i}`)} className="text-indigo-600 font-bold hover:underline">
                        {copiedKey === `proj-${i}` ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans text-slate-600 text-[11px]">{hook}</pre>
                  </div>
                ))}
              </div>
            </div>

            <div className="card space-y-3">
              <h3 className="font-bold text-slate-900 text-sm">4. Direct Outreach Templates</h3>
              <p className="text-xs text-slate-500">High-response messages for networking:</p>
              <div className="space-y-2">
                {pkg.outreachTemplates.map((tpl, i) => (
                  <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="badge bg-indigo-50 text-indigo-800">{tpl.target}</span>
                      <button onClick={() => copyToClipboard(tpl.message, `tpl-${i}`)} className="text-indigo-600 font-bold hover:underline">
                        {copiedKey === `tpl-${i}` ? "✓ Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-slate-700 text-[11px] leading-relaxed mt-1">{tpl.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

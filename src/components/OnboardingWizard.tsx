"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Profile } from "@/lib/agents/types";
import { CAREER_FIELDS, fieldByKey } from "@/lib/agents/careerFields";
import Image from "next/image";
import CareerFieldPicker from "./CareerFieldPicker";
import SkillAutocomplete from "./SkillAutocomplete";

const STEPS = ["Your field", "Your skills", "About you"] as const;

export default function OnboardingWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fields, setFields] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [basics, setBasics] = useState({ name: "", location: "", email: "", relocate: true });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((d) => {
        const p: Profile = d.profile;
        setProfile(p);
        setFields(p.careerFields ?? []);
        setSkills(p.skills ?? []);
        setBasics({ name: p.name ?? "", location: p.location ?? "", email: p.email ?? "", relocate: p.relocate ?? true });
      })
      .catch(() => {});
  }, []);

  // Starter chips come from the chosen fields, so a pharmacy candidate is
  // offered GMP and Pharmacology rather than generic tech skills.
  const starterChips = useMemo(() => {
    const out: string[] = [];
    for (const key of fields) {
      for (const s of fieldByKey(key)?.starterSkills ?? []) {
        if (!out.includes(s) && !skills.some((x) => x.toLowerCase() === s.toLowerCase())) out.push(s);
      }
    }
    return out.slice(0, 14);
  }, [fields, skills]);

  async function finish() {
    if (!profile) return;
    setSaving(true);
    try {
      const nextProfile: Profile = { ...profile, ...basics, careerFields: fields, skills };
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextProfile),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Profile could not be saved");
      window.localStorage.setItem("autoapply:profile-cache", JSON.stringify(data.profile ?? nextProfile));
      router.prefetch("/dashboard");
      router.push("/dashboard");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  const canNext = step === 0 ? fields.length > 0 : step === 1 ? skills.length >= 3 : basics.name.trim().length > 1;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold transition ${
                i < step ? "bg-emerald-500 text-white" : i === step ? "bg-indigo-600 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {i < step ? "✓" : i + 1}
            </span>
            <span className={`hidden text-sm font-semibold sm:block ${i === step ? "text-slate-900" : "text-slate-500"}`}>{label}</span>
            {i < STEPS.length - 1 && <span className={`h-0.5 flex-1 rounded ${i < step ? "bg-emerald-500" : "bg-slate-200"}`} />}
          </li>
        ))}
      </ol>

      <div className="card">
        {step === 0 && (
          <div className="animate-rise">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Which field are you in?</h2>
            <p className="prose-muted mt-2">
              This is the most important question. It decides which careers we match you against — an M.Pharma graduate
              should see pharma, research and teaching roles, not software jobs. Pick up to 3.
            </p>
            <div className="mt-6">
              <CareerFieldPicker selected={fields} onChange={setFields} max={3} />
            </div>
            {fields.length > 0 && (
              <div className="mt-5 rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-sm font-bold text-indigo-900">Typical qualifications in your field</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {fields.flatMap((k) => fieldByKey(k)?.qualifications ?? []).map((q) => (
                    <span key={q} className="badge bg-white text-indigo-700">{q}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {step === 1 && (
          <div className="animate-rise">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">What are you good at?</h2>
            <p className="prose-muted mt-2">
              Start typing and pick from suggestions tailored to your field. Not listed? Just type it out fully and add it.
              Add at least 3 — only skills you can defend with a real example.
            </p>

            <div className="mt-5">
              <SkillAutocomplete selected={skills} fields={fields} onAdd={(s) => setSkills((prev) => [...prev, s])} />
            </div>

            {starterChips.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Common in your field — tap to add</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {starterChips.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSkills((prev) => [...prev, s])}
                      className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 border-t border-slate-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Your skills ({skills.length}){skills.length < 3 && <span className="ml-2 font-semibold text-amber-600">add at least 3</span>}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {skills.length === 0 && <p className="text-sm text-slate-400">Nothing added yet.</p>}
                {skills.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-medium text-indigo-700">
                    {s}
                    <button type="button" onClick={() => setSkills((prev) => prev.filter((x) => x !== s))} className="text-indigo-400 hover:text-rose-600">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-rise">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Last bit — who are you?</h2>
            <p className="prose-muted mt-2">Used on your resume, cover letters and follow-up emails. You can refine everything later.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Full name</span>
                <input className="input" value={basics.name} onChange={(e) => setBasics({ ...basics, name: e.target.value })} placeholder="Your name" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Location</span>
                <input className="input" value={basics.location} onChange={(e) => setBasics({ ...basics, location: e.target.value })} placeholder="City, Country" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Email</span>
                <input type="email" className="input" value={basics.email} onChange={(e) => setBasics({ ...basics, email: e.target.value })} placeholder="you@example.com" />
              </label>
              <label className="mt-6 flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={basics.relocate} onChange={(e) => setBasics({ ...basics, relocate: e.target.checked })} />
                Open to relocation
              </label>
            </div>
            <div className="mt-6 rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-bold text-slate-900">You&apos;re set up</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {fields.map((key) => {
                  const f = CAREER_FIELDS.find((x) => x.key === key);
                  if (!f) return null;
                  return (
                    <span key={key} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-3">
                      <span className="relative h-7 w-7 overflow-hidden rounded-full">
                        <Image src={f.image} alt={f.imageAlt} fill sizes="28px" className="object-cover" />
                      </span>
                      <span className="text-xs font-semibold text-slate-800">{f.label}</span>
                    </span>
                  );
                })}
              </div>
              <p className="mt-3 text-sm text-slate-600">
                {skills.length} skills added. Next, add your experience and projects in the dashboard to unlock stronger matches.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="btn-ghost disabled:opacity-40">
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canNext} className="btn-primary">
              Continue →
            </button>
          ) : (
            <button type="button" onClick={finish} disabled={!canNext || saving} className="btn-primary">
              {saving ? "Saving…" : "Finish & open dashboard"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import CareerFieldPicker from "./CareerFieldPicker";
import SkillAutocomplete from "./SkillAutocomplete";
import ResumeImportModal from "./ResumeImportModal";
import { fieldByKey } from "@/lib/agents/careerFields";
import type {
  EducationItem,
  ExperienceItem,
  Profile,
  ProjectItem,
  PublicationItem,
} from "@/lib/agents/types";

export default function ProfileTab({
  profile,
  onProfileChange,
}: {
  profile: Profile | null;
  onProfileChange: (p: Profile) => void;
}) {
  const [local, setLocal] = useState<Profile | null>(profile);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newCertification, setNewCertification] = useState("");

  useEffect(() => {
    if (profile) setLocal(profile);
  }, [profile]);

  const completeness = useMemo(() => {
    if (!local) return 0;
    const checks = [
      !!local.name,
      !!local.location,
      !!local.email,
      !!local.linkedin,
      local.careerFields.length > 0,
      local.skills.length >= 5,
      local.education.length > 0,
      local.experience.length > 0,
      local.projects.length > 0,
      local.certifications.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [local]);

  const starterChips = local
    ? Array.from(
        new Set(local.careerFields.flatMap((k) => fieldByKey(k)?.starterSkills ?? [])),
      ).filter((s) => !local.skills.some((x) => x.toLowerCase() === s.toLowerCase())).slice(0, 12)
    : [];

  if (!local) return <p className="text-slate-500">Loading profile…</p>;

  async function handleSave() {
    if (!local) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(local),
      });
      const data = await res.json();
      if (res.ok) {
        onProfileChange(data.profile);
        setMessage("Profile memory saved. All agents will use this evidence.");
      } else {
        setMessage(data.error ?? "Failed to save profile.");
      }
    } catch {
      setMessage("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  function addCertification() {
    if (!local) return;
    const value = newCertification.trim();
    if (!value) return;
    setLocal({ ...local, certifications: [...local.certifications, value] });
    setNewCertification("");
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-slate-900">👤 Profile memory</h2>
              <button
                type="button"
                onClick={() => setShowImportModal(true)}
                className="btn-secondary text-xs px-3 py-1 bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
              >
                📄 Import from Resume / LinkedIn
              </button>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              This is the single source of truth for every agent. Resume claims are allowed only when evidence exists here.
            </p>
          </div>
          <div className="min-w-48">
            <div className="mb-1 flex justify-between text-xs font-semibold text-slate-600">
              <span>Profile strength</span>
              <span>{completeness}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${completeness}%` }} />
            </div>
          </div>
        </div>
      </div>

      <Section
        title="Career field"
        description="Decides which careers you are matched against. Pick up to 3 — you will never be shown roles from unrelated fields."
      >
        <CareerFieldPicker
          selected={local.careerFields}
          onChange={(next) => setLocal({ ...local, careerFields: next })}
          max={3}
        />
        {local.careerFields.length === 0 && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
            No field selected — the recommender will search every sector, which produces weaker matches.
          </p>
        )}
      </Section>

      <Section title="Contact & preferences" description="Used on your resume, cover letter, and follow-up messages.">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <input className="input" value={local.name} onChange={(e) => setLocal({ ...local, name: e.target.value })} />
          </Field>
          <Field label="Location">
            <input className="input" value={local.location} onChange={(e) => setLocal({ ...local, location: e.target.value })} />
          </Field>
          <Field label="Phone">
            <input className="input" value={local.phone} onChange={(e) => setLocal({ ...local, phone: e.target.value })} />
          </Field>
          <Field label="Email">
            <input type="email" className="input" value={local.email} onChange={(e) => setLocal({ ...local, email: e.target.value })} />
          </Field>
          <Field label="LinkedIn">
            <input className="input" value={local.linkedin} onChange={(e) => setLocal({ ...local, linkedin: e.target.value })} />
          </Field>
          <Field label="Mobility">
            <label className="mt-2 flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={local.relocate} onChange={(e) => setLocal({ ...local, relocate: e.target.checked })} />
              Open to relocation
            </label>
          </Field>
        </div>
      </Section>

      <Section title="Skills" description="Start typing — suggestions are ranked for your field. Not in the list? Type it fully and add it.">
        <SkillAutocomplete
          selected={local.skills}
          fields={local.careerFields}
          onAdd={(skill) => setLocal({ ...local, skills: [...local.skills, skill] })}
        />

        {starterChips.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Common in your field</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {starterChips.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setLocal({ ...local, skills: [...local.skills, s] })}
                  className="rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-indigo-400 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {local.skills.length === 0 && <p className="text-sm text-slate-400">No skills yet.</p>}
          {local.skills.map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-indigo-700">
              {skill}
              <button
                type="button"
                aria-label={`Remove ${skill}`}
                className="ml-1 text-indigo-400 hover:text-rose-600"
                onClick={() => setLocal({ ...local, skills: local.skills.filter((x) => x !== skill) })}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </Section>

      <Section
        title="Experience"
        description="Use measurable outcomes. Strong evidence includes scale, speed, revenue, accuracy, cost, or percentage improvement."
        action="Add experience"
        onAction={() => setLocal({ ...local, experience: [...local.experience, { title: "", company: "", duration: "", description: "" }] })}
      >
        <div className="space-y-4">
          {local.experience.length === 0 && <Empty text="Add work, internship, freelance, or volunteer experience." />}
          {local.experience.map((item, index) => (
            <EditorCard key={index} title={item.title || `Experience ${index + 1}`} onRemove={() => setLocal({ ...local, experience: local.experience.filter((_, i) => i !== index) })}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Job title"><input className="input" value={item.title} onChange={(e) => updateExperience(index, { title: e.target.value })} /></Field>
                <Field label="Company"><input className="input" value={item.company} onChange={(e) => updateExperience(index, { company: e.target.value })} /></Field>
                <Field label="Dates"><input className="input" placeholder="Jul 2023 – Sep 2024" value={item.duration} onChange={(e) => updateExperience(index, { duration: e.target.value })} /></Field>
              </div>
              <Field label="Achievement / evidence">
                <textarea className="input min-h-20" placeholder="Built X using Y, improving Z by 15%..." value={item.description} onChange={(e) => updateExperience(index, { description: e.target.value })} />
              </Field>
              <EvidenceHint text={item.description} />
            </EditorCard>
          ))}
        </div>
      </Section>

      <Section
        title="Projects"
        description="Projects are evidence. Include the problem, your solution, measurable result, and technologies used."
        action="Add project"
        onAction={() => setLocal({ ...local, projects: [...local.projects, { name: "", description: "", technologies: [] }] })}
      >
        <div className="space-y-4">
          {local.projects.length === 0 && <Empty text="Add a portfolio, academic, hackathon, or open-source project." />}
          {local.projects.map((item, index) => (
            <EditorCard key={index} title={item.name || `Project ${index + 1}`} onRemove={() => setLocal({ ...local, projects: local.projects.filter((_, i) => i !== index) })}>
              <Field label="Project name"><input className="input" value={item.name} onChange={(e) => updateProject(index, { name: e.target.value })} /></Field>
              <Field label="What you built / outcome">
                <textarea className="input min-h-20" value={item.description} onChange={(e) => updateProject(index, { description: e.target.value })} />
              </Field>
              <Field label="Technologies (comma-separated)">
                <input className="input" value={item.technologies.join(", ")} onChange={(e) => updateProject(index, { technologies: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} />
              </Field>
              <EvidenceHint text={item.description} />
            </EditorCard>
          ))}
        </div>
      </Section>

      <Section
        title="Education"
        description="Degrees, diplomas, bootcamps, and relevant formal training."
        action="Add education"
        onAction={() => setLocal({ ...local, education: [...local.education, { degree: "", field: "", institution: "", year: "" }] })}
      >
        <div className="space-y-4">
          {local.education.map((item, index) => (
            <EditorCard key={index} title={item.degree || `Education ${index + 1}`} onRemove={() => setLocal({ ...local, education: local.education.filter((_, i) => i !== index) })}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Degree"><input className="input" value={item.degree} onChange={(e) => updateEducation(index, { degree: e.target.value })} /></Field>
                <Field label="Field"><input className="input" value={item.field} onChange={(e) => updateEducation(index, { field: e.target.value })} /></Field>
                <Field label="Institution"><input className="input" value={item.institution} onChange={(e) => updateEducation(index, { institution: e.target.value })} /></Field>
                <Field label="Year"><input className="input" value={item.year} onChange={(e) => updateEducation(index, { year: e.target.value })} /></Field>
              </div>
            </EditorCard>
          ))}
        </div>
      </Section>

      <Section title="Certifications" description="Industry credentials and verified training.">
        <div className="space-y-2">
          {local.certifications.map((cert, index) => (
            <div key={`${cert}-${index}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="flex-1 text-sm text-slate-700">{cert}</span>
              <button type="button" className="text-xs font-semibold text-rose-600" onClick={() => setLocal({ ...local, certifications: local.certifications.filter((_, i) => i !== index) })}>Remove</button>
            </div>
          ))}
        </div>
        <div className="mt-3 flex max-w-2xl gap-2">
          <input className="input" placeholder="Certification name and issuer" value={newCertification} onChange={(e) => setNewCertification(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCertification(); } }} />
          <button type="button" onClick={addCertification} className="btn-secondary">Add</button>
        </div>
      </Section>

      <Section
        title="Publications"
        description="Papers, articles, patents, talks, or technical writing."
        action="Add publication"
        onAction={() => setLocal({ ...local, publications: [...local.publications, { title: "", doi: "", status: "" }] })}
      >
        <div className="space-y-4">
          {local.publications.length === 0 && <Empty text="No publications added. This section is optional." />}
          {local.publications.map((item, index) => (
            <EditorCard key={index} title={item.title || `Publication ${index + 1}`} onRemove={() => setLocal({ ...local, publications: local.publications.filter((_, i) => i !== index) })}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title"><input className="input" value={item.title} onChange={(e) => updatePublication(index, { title: e.target.value })} /></Field>
                <Field label="Status"><input className="input" placeholder="Published / Under review" value={item.status ?? ""} onChange={(e) => updatePublication(index, { status: e.target.value })} /></Field>
                <Field label="DOI or URL"><input className="input" value={item.doi ?? ""} onChange={(e) => updatePublication(index, { doi: e.target.value })} /></Field>
              </div>
            </EditorCard>
          ))}
        </div>
      </Section>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
        <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? "Saving…" : "Save profile memory"}</button>
        {message && <span className="text-sm text-slate-600">{message}</span>}
        <span className="ml-auto text-xs text-slate-500">Nothing is exposed as JSON or code.</span>
      </div>

      {showImportModal && (
        <ResumeImportModal
          currentProfile={local}
          onImport={(imported) => {
            setLocal(imported);
            onProfileChange(imported);
          }}
          onClose={() => setShowImportModal(false)}
        />
      )}
    </div>
  );

  function updateExperience(index: number, patch: Partial<ExperienceItem>) {
    if (!local) return;
    setLocal({ ...local, experience: local.experience.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  }
  function updateProject(index: number, patch: Partial<ProjectItem>) {
    if (!local) return;
    setLocal({ ...local, projects: local.projects.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  }
  function updateEducation(index: number, patch: Partial<EducationItem>) {
    if (!local) return;
    setLocal({ ...local, education: local.education.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  }
  function updatePublication(index: number, patch: Partial<PublicationItem>) {
    if (!local) return;
    setLocal({ ...local, publications: local.publications.map((item, i) => (i === index ? { ...item, ...patch } : item)) });
  }
}

function Section({ title, description, action, onAction, children }: { title: string; description: string; action?: string; onAction?: () => void; children: React.ReactNode }) {
  return (
    <section className="card">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">{description}</p>
        </div>
        {action && <button type="button" onClick={onAction} className="btn-secondary">+ {action}</button>}
      </div>
      {children}
    </section>
  );
}

function EditorCard({ title, onRemove, children }: { title: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <button type="button" onClick={onRemove} className="text-xs font-semibold text-rose-600 hover:underline">Remove</button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function EvidenceHint({ text }: { text: string }) {
  const hasMetric = /\b\d+(?:\.\d+)?%?|\b\d+[kKmMbB]\b/.test(text);
  return (
    <p className={`text-xs ${hasMetric ? "text-emerald-600" : "text-amber-700"}`}>
      {hasMetric ? "✓ Includes measurable evidence" : "Tip: add a number or measurable outcome to make this stronger."}
    </p>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">{text}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      {children}
    </label>
  );
}

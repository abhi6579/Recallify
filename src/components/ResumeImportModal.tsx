"use client";

import { useState } from "react";
import type { ParsedResume, Profile } from "@/lib/agents/types";

export default function ResumeImportModal({
  currentProfile,
  onImport,
  onClose,
}: {
  currentProfile: Profile | null;
  onImport: (updated: Profile) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState<ParsedResume | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleParse() {
    if (text.trim().length < 30) {
      setError("Please paste resume text with at least 30 characters.");
      return;
    }
    setParsing(true);
    setError(null);
    try {
      const res = await fetch("/api/resume/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to parse resume");
      setParsed(data.parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Parsing error");
    } finally {
      setParsing(false);
    }
  }

  function applyImport(mode: "merge" | "replace") {
    if (!parsed) return;
    const base = currentProfile || {
      name: "",
      location: "",
      relocate: true,
      phone: "",
      email: "",
      linkedin: "",
      careerFields: [],
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
      publications: [],
    };

    let updated: Profile;

    if (mode === "replace") {
      updated = {
        ...base,
        name: parsed.name || base.name,
        location: parsed.location || base.location,
        email: parsed.email || base.email,
        phone: parsed.phone || base.phone,
        linkedin: parsed.linkedin || base.linkedin,
        careerFields: parsed.careerFields.length ? parsed.careerFields : base.careerFields,
        skills: parsed.skills.length ? parsed.skills : base.skills,
        experience: parsed.experience.length ? parsed.experience : base.experience,
        education: parsed.education.length ? parsed.education : base.education,
        projects: parsed.projects.length ? parsed.projects : base.projects,
        certifications: parsed.certifications.length ? parsed.certifications : base.certifications,
        publications: parsed.publications.length ? parsed.publications : base.publications,
      };
    } else {
      // Merge unique skills
      const mergedSkills = Array.from(new Set([...base.skills, ...parsed.skills]));
      const mergedFields = Array.from(new Set([...base.careerFields, ...parsed.careerFields]));
      const mergedCerts = Array.from(new Set([...base.certifications, ...parsed.certifications]));

      updated = {
        ...base,
        name: base.name || parsed.name,
        location: base.location || parsed.location,
        email: base.email || parsed.email,
        phone: base.phone || parsed.phone,
        linkedin: base.linkedin || parsed.linkedin,
        careerFields: mergedFields,
        skills: mergedSkills,
        experience: [...parsed.experience, ...base.experience].slice(0, 8),
        education: [...parsed.education, ...base.education].slice(0, 4),
        projects: [...parsed.projects, ...base.projects].slice(0, 6),
        certifications: mergedCerts,
        publications: [...base.publications, ...parsed.publications],
      };
    }

    onImport(updated);
    onClose();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === "string") {
        setText(content);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h3 className="font-bold text-slate-900">📄 Import Resume / LinkedIn Text</h3>
            <p className="text-xs text-slate-500">Auto-extracts contact, skills, work history, and projects into Profile Memory</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!parsed ? (
            <>
              <div className="flex items-center gap-3">
                <label className="btn-secondary cursor-pointer text-xs">
                  📁 Upload Text/Markdown File
                  <input type="file" accept=".txt,.md,.rtf,.json" onChange={handleFileUpload} className="hidden" />
                </label>
                <span className="text-xs text-slate-400">or paste your resume text below</span>
              </div>

              <textarea
                className="input min-h-[220px] font-mono text-xs"
                placeholder="Paste the full text of your resume or LinkedIn 'About' & 'Experience' section here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />

              {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-emerald-900">✓ Parsed Successfully</p>
                  <span className="badge bg-emerald-200 text-emerald-800">Confidence: {parsed.confidenceScore}%</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-700">
                  <p><strong>Name:</strong> {parsed.name || "—"}</p>
                  <p><strong>Email:</strong> {parsed.email || "—"}</p>
                  <p><strong>Phone:</strong> {parsed.phone || "—"}</p>
                  <p><strong>Location:</strong> {parsed.location || "—"}</p>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold uppercase text-slate-500 mb-1">Extracted Skills ({parsed.skills.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.skills.map((s) => (
                    <span key={s} className="badge bg-indigo-50 text-indigo-700">{s}</span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-bold text-slate-800 mb-1">Experience ({parsed.experience.length})</p>
                  <ul className="space-y-1 text-slate-600">
                    {parsed.experience.slice(0, 3).map((e, idx) => (
                      <li key={idx} className="truncate">• {e.title} ({e.company})</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="font-bold text-slate-800 mb-1">Projects & Education</p>
                  <p className="text-slate-600">{parsed.projects.length} project(s), {parsed.education.length} degree(s)</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
          {!parsed ? (
            <button type="button" onClick={handleParse} disabled={parsing || !text.trim()} className="btn-primary">
              {parsing ? "Parsing Resume…" : "Extract Profile Data →"}
            </button>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => setParsed(null)} className="btn-secondary text-xs">Re-paste</button>
              <button type="button" onClick={() => applyImport("merge")} className="btn-secondary text-xs">Merge with Existing</button>
              <button type="button" onClick={() => applyImport("replace")} className="btn-primary text-xs">Replace Profile Memory</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

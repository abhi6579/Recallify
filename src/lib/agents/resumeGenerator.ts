import type { EvidenceMatch, Profile } from "./types";
import { normalizeSkill } from "./skillsData";

export type GenerateResumeOptions = {
  /** Extra grounded keywords (backed by evidence) to surface more prominently
   * on a revision pass in order to raise the ATS keyword-match score. */
  emphasizeKeywords?: string[];
};

function line(label: string, value: string): string {
  return value ? `${label}: ${value}` : "";
}

export function buildResumeText(
  profile: Profile,
  jdRequirements: string[],
  matchedEvidence: EvidenceMatch[],
  options: GenerateResumeOptions = {},
): string {
  const jdKeys = new Set(jdRequirements.map((r) => normalizeSkill(r)));
  const emphasizeKeys = new Set((options.emphasizeKeywords ?? []).map((k) => normalizeSkill(k)));

  // --- Skills: reorder so JD-matched (grounded) skills lead ---
  const profileSkills = profile.skills ?? [];
  const matchedSkills = profileSkills.filter((s) => jdKeys.has(normalizeSkill(s)));
  const otherSkills = profileSkills.filter((s) => !jdKeys.has(normalizeSkill(s)));
  const orderedSkills = [...matchedSkills, ...otherSkills];

  // --- Additional grounded keywords surfaced from projects/certifications ---
  const extraGroundedKeywords = Array.from(
    new Set(
      matchedEvidence
        .filter((m) => m.score > 0 && (jdKeys.has(normalizeSkill(m.requirement)) || emphasizeKeys.has(normalizeSkill(m.requirement))))
        .filter((m) => !profileSkills.some((s) => normalizeSkill(s) === normalizeSkill(m.requirement)))
        .map((m) => m.requirement),
    ),
  );

  // --- Projects: rank by relevance to JD (evidence score with source=projects) ---
  const projectRelevance = new Map<string, number>();
  for (const ev of matchedEvidence) {
    if (ev.source !== "projects") continue;
    for (const proj of profile.projects ?? []) {
      if (ev.evidence.some((e) => e.startsWith(proj.name))) {
        projectRelevance.set(proj.name, Math.max(projectRelevance.get(proj.name) ?? 0, ev.score));
      }
    }
  }
  const rankedProjects = [...(profile.projects ?? [])].sort(
    (a, b) => (projectRelevance.get(b.name) ?? 0) - (projectRelevance.get(a.name) ?? 0),
  );

  const topDomainSkills = matchedSkills.slice(0, 4).join(", ") || orderedSkills.slice(0, 4).join(", ");
  const yearsLine = (profile.experience ?? []).length > 0 ? "hands-on industry experience" : "strong project experience";

  const summary = [
    `${profile.name} is a candidate with ${yearsLine} in ${topDomainSkills || "software and AI/ML"}.`,
    extraGroundedKeywords.length > 0
      ? `Demonstrated, evidence-backed exposure to ${extraGroundedKeywords.slice(0, 5).join(", ")} through applied project work.`
      : "",
    profile.relocate ? "Open to relocation for the right opportunity." : "",
  ]
    .filter(Boolean)
    .join(" ");

  const sections: string[] = [];

  sections.push(profile.name.toUpperCase());
  sections.push(
    [line("Location", profile.location), line("Phone", profile.phone), line("Email", profile.email), line("LinkedIn", profile.linkedin)]
      .filter(Boolean)
      .join("  |  "),
  );
  sections.push("");
  sections.push("SUMMARY");
  sections.push(summary);
  sections.push("");

  sections.push("CORE SKILLS");
  sections.push(orderedSkills.join(", "));
  if (extraGroundedKeywords.length > 0) {
    sections.push(`Additional relevant tools (from project work): ${extraGroundedKeywords.join(", ")}`);
  }
  sections.push("");

  if ((profile.experience ?? []).length > 0) {
    sections.push("EXPERIENCE");
    for (const exp of profile.experience) {
      sections.push(`${exp.title} — ${exp.company} (${exp.duration})`);
      sections.push(`  • ${exp.description}`);
    }
    sections.push("");
  }

  if (rankedProjects.length > 0) {
    sections.push("PROJECTS");
    for (const proj of rankedProjects) {
      const relevanceTag = (projectRelevance.get(proj.name) ?? 0) > 0 ? " (highly relevant to this role)" : "";
      sections.push(`${proj.name}${relevanceTag}`);
      sections.push(`  • ${proj.description}`);
      sections.push(`  • Tech: ${proj.technologies.join(", ")}`);
    }
    sections.push("");
  }

  sections.push("EDUCATION");
  for (const edu of profile.education ?? []) {
    sections.push(`${edu.degree} in ${edu.field} — ${edu.institution} (${edu.year})`);
  }
  sections.push("");

  if ((profile.certifications ?? []).length > 0) {
    sections.push("CERTIFICATIONS");
    for (const cert of profile.certifications) sections.push(`  • ${cert}`);
    sections.push("");
  }

  if ((profile.publications ?? []).length > 0) {
    sections.push("PUBLICATIONS");
    for (const pub of profile.publications) {
      sections.push(`  • ${pub.title}${pub.status ? ` (${pub.status})` : ""}${pub.doi ? ` — DOI: ${pub.doi}` : ""}`);
    }
  }

  return sections.join("\n");
}

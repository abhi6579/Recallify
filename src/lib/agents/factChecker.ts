import type { Profile } from "./types";
import { SKILL_VOCABULARY, buildSkillRegex, normalizeSkill } from "./skillsData";

/**
 * Agent 2 / tool: fact_checker — an LLM-as-judge stand-in that verifies every
 * skill-like claim appearing in the generated resume text is actually
 * traceable back to the candidate's profile (skills, experience, projects,
 * publications, or certifications). Flags anything that looks fabricated.
 */
export function checkFacts(
  resumeText: string,
  profile: Profile,
): { factualIssues: string[]; factualScore: number } {
  const lowerResume = resumeText.toLowerCase();

  const groundTruthBlob = [
    ...(profile.skills ?? []),
    ...(profile.experience ?? []).map((e) => `${e.title} ${e.description}`),
    ...(profile.projects ?? []).map((p) => `${p.name} ${p.description} ${p.technologies.join(" ")}`),
    ...(profile.publications ?? []).map((p) => p.title),
    ...(profile.certifications ?? []),
    ...(profile.education ?? []).map((e) => `${e.degree} ${e.field} ${e.institution}`),
  ]
    .join(" ")
    .toLowerCase();

  const groundedSkillSet = new Set(
    (profile.skills ?? []).map((s) => normalizeSkill(s)),
  );

  const mentionedSkills = SKILL_VOCABULARY.filter((skill) => buildSkillRegex(skill).test(lowerResume));

  const issues: string[] = [];
  for (const skill of mentionedSkills) {
    const key = normalizeSkill(skill);
    const inGroundTruth = groundedSkillSet.has(key) || groundTruthBlob.includes(skill.toLowerCase());
    if (!inGroundTruth) {
      issues.push(`Unsupported claim: "${skill}" appears in the resume but is not backed by profile data.`);
    }
  }

  const factualScore = mentionedSkills.length === 0
    ? 1
    : Math.round(((mentionedSkills.length - issues.length) / mentionedSkills.length) * 100) / 100;

  return { factualIssues: issues, factualScore };
}

import { SKILL_VOCABULARY, buildSkillRegex, normalizeSkill } from "./skillsData";

const STOPWORDS = new Set([
  "the", "and", "for", "with", "you", "your", "our", "are", "will", "have",
  "this", "that", "who", "what", "from", "into", "such", "role", "team",
  "work", "years", "year", "strong", "ability", "skills", "experience",
  "knowledge", "proficiency", "familiarity", "including", "etc",
]);

function titleCase(text: string): string {
  return text
    .split(" ")
    .map((w) => (w.length <= 3 ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * Agent 2 / tool: jd_parser
 * Extracts a normalized requirements list from a raw job description using a
 * curated skill vocabulary plus bullet/line heuristics — no external LLM call
 * required, so this works reliably offline.
 */
export function parseJobDescription(jobDescription: string): string[] {
  const lower = jobDescription.toLowerCase();
  const foundSkills: string[] = [];

  for (const skill of SKILL_VOCABULARY) {
    if (buildSkillRegex(skill).test(lower)) {
      foundSkills.push(titleCase(skill));
    }
  }

  // Pull explicit bullet/requirement-style lines for extra context in the
  // generated resume + change report (not used for hard ATS scoring).
  const lines = jobDescription
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const bulletLines = lines
    .filter((l) => /^[-•*\u2022]/.test(l) || /\b(experience|proficiency|familiarity|knowledge of|ability to)\b/i.test(l))
    .map((l) => l.replace(/^[-•*\u2022]\s*/, "").trim())
    .filter((l) => l.length >= 8 && l.length <= 160);

  const requirements = Array.from(new Set([...foundSkills, ...bulletLines.slice(0, 12)]));
  return requirements;
}

export function requirementToSkillKey(requirement: string): string {
  return normalizeSkill(requirement);
}

export { STOPWORDS };

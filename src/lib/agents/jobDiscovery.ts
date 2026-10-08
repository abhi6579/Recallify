import type { JobListing, Profile, ScoredJob } from "./types";
import { normalizeSkill, buildSkillRegex, SKILL_VOCABULARY } from "./skillsData";
import { categoriesForFields, fieldByKey } from "./careerFields";
import { ROLE_LIBRARY } from "./roleLibrary";

/**
 * Agent 5: Job Discovery.
 *
 * Ranks live listings against the candidate's actual evidence so the user can
 * spend their effort on a short list instead of mass-applying. Scoring is
 * deterministic and explainable: skill overlap, title relevance, freshness and
 * salary transparency.
 */

const SALARY_PATTERN = /(?:[$₹€£]\s?\d|\d[\d,.]*\s*(?:k\b|lpa|lakhs?)|salary|compensation|pay range)/i;

function daysSince(iso: string | null): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return Math.max(0, Math.floor((Date.now() - t) / 86400000));
}

/**
 * Compiled once at module load. Building ~400 regexes per job made scoring
 * miss core skills (the vocabulary is sorted longest-first, so an early cap
 * consumed the budget on rare phrases before reaching "python" or "sql").
 */
const COMPILED_SKILLS: { skill: string; re: RegExp }[] = SKILL_VOCABULARY
  .filter((s) => s.length >= 3)
  .map((skill) => ({ skill, re: buildSkillRegex(skill) }));

/** Skills the job text actually asks for, drawn from the shared vocabulary. */
function extractJobSkills(job: JobListing): string[] {
  // Requirements live near the top; capping the text keeps scoring fast
  // without losing the section that matters.
  const haystack = `${job.title}\n${job.tags.join("\n")}\n${job.description.slice(0, 4000)}`.toLowerCase();
  const found: string[] = [];
  for (const { skill, re } of COMPILED_SKILLS) {
    if (re.test(haystack)) found.push(skill);
  }
  return found;
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Role titles reachable from the candidate's chosen career fields. */
function relevantTitleWords(profile: Profile): Set<string> {
  const cats = new Set(categoriesForFields(profile.careerFields ?? []));
  const words = new Set<string>();
  for (const role of ROLE_LIBRARY) {
    if (cats.size > 0 && !cats.has(role.category)) continue;
    for (const word of role.title.toLowerCase().split(/[^a-z+#.]+/)) {
      if (word.length >= 4) words.add(word);
    }
  }
  return words;
}

export function scoreJobs(jobs: JobListing[], profile: Profile): ScoredJob[] {
  const profileSkills = new Set((profile.skills ?? []).map((s) => normalizeSkill(s)));
  const titleWords = relevantTitleWords(profile);
  const fieldCategories = new Set(categoriesForFields(profile.careerFields ?? []));
  const fieldStarterSkills = new Set(
    (profile.careerFields ?? [])
      .flatMap((k) => fieldByKey(k)?.starterSkills ?? [])
      .map((s) => normalizeSkill(s)),
  );

  return jobs.map((job) => {
    const jobSkills = extractJobSkills(job);
    const matched = jobSkills.filter((s) => profileSkills.has(normalizeSkill(s)));
    const missing = jobSkills.filter((s) => !profileSkills.has(normalizeSkill(s)));

    // 1) Skill overlap (max 55)
    const overlap = jobSkills.length > 0 ? matched.length / jobSkills.length : 0;
    let score = overlap * 55;

    // 2) Title relevance to the candidate's field (max 25)
    const jobTitleWords = job.title.toLowerCase().split(/[^a-z+#.]+/).filter((w) => w.length >= 4);
    const titleHits = jobTitleWords.filter((w) => titleWords.has(w)).length;
    score += Math.min(titleHits / Math.max(jobTitleWords.length, 1), 1) * 25;

    // 3) Field-domain signal — does the posting even mention this profession?
    const domainHit = jobSkills.some((s) => fieldStarterSkills.has(normalizeSkill(s)));
    if (domainHit) score += 8;
    if (fieldCategories.size > 0 && titleHits === 0 && !domainHit) score -= 18;

    // 4) Freshness (max 8) — stale posts are likelier to be filled or ghosts
    const freshnessDays = daysSince(job.postedAt);
    if (freshnessDays !== null) {
      if (freshnessDays <= 3) score += 8;
      else if (freshnessDays <= 10) score += 6;
      else if (freshnessDays <= 30) score += 3;
      else if (freshnessDays > 60) score -= 6;
    }

    // 5) Salary transparency (max 4)
    const salaryTransparent = Boolean(job.salaryText) || SALARY_PATTERN.test(job.description.slice(0, 2500));
    if (salaryTransparent) score += 4;

    const fitScore = Math.max(0, Math.min(100, Math.round(score)));
    const verdict: ScoredJob["verdict"] =
      fitScore >= 70 ? "strong_fit" : fitScore >= 50 ? "worth_applying" : fitScore >= 30 ? "stretch" : "low_fit";

    return {
      ...job,
      fitScore,
      matchedSkills: Array.from(new Set(matched.map(titleCase))).slice(0, 10),
      missingSkills: Array.from(new Set(missing.map(titleCase))).slice(0, 8),
      freshnessDays,
      salaryTransparent,
      verdict,
    };
  });
}

/** Default search terms derived from the profile when the user has not typed one. */
export function suggestedQuery(profile: Profile): string {
  const cats = new Set(categoriesForFields(profile.careerFields ?? []));
  const role = ROLE_LIBRARY.find((r) => cats.has(r.category));
  if (role) return role.title;
  return profile.skills?.[0] ?? "";
}

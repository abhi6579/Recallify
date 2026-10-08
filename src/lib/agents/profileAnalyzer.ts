import type { Profile, ProfileSignature } from "./types";
import { normalizeSkill, normalizeSkillList, ROLE_TEMPLATES } from "./skillsData";

const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
};

/** Parses strings like "July 2023 – Sept 2024" or "2021 - Present" into months. */
function parseDurationToMonths(duration: string): number {
  const now = new Date();
  const parts = duration.split(/[-–—]/).map((p) => p.trim());
  if (parts.length !== 2) return 6; // fallback: assume half a year
  const parseOne = (text: string): Date | null => {
    if (/present|current|now/i.test(text)) return now;
    const m = text.match(/([A-Za-z]{3,})?\s*(\d{4})/);
    if (!m) return null;
    const year = parseInt(m[2], 10);
    const monthKey = (m[1] ?? "jan").slice(0, 3).toLowerCase();
    const month = MONTHS[monthKey] ?? 0;
    return new Date(year, month, 1);
  };
  const start = parseOne(parts[0]);
  const end = parseOne(parts[1]);
  if (!start || !end) return 6;
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(0, months);
}

// Build a skill -> domains lookup from the role template library so we can
// infer likely domains for a candidate purely from their stated skills.
function buildSkillDomainIndex(): Map<string, Map<string, number>> {
  const index = new Map<string, Map<string, number>>();
  for (const role of ROLE_TEMPLATES) {
    for (const rawSkill of role.requiredSkills) {
      const skill = normalizeSkill(rawSkill);
      if (!index.has(skill)) index.set(skill, new Map());
      const domainCounts = index.get(skill)!;
      for (const domain of role.domains) {
        domainCounts.set(domain, (domainCounts.get(domain) ?? 0) + 1);
      }
    }
  }
  return index;
}

const SKILL_DOMAIN_INDEX = buildSkillDomainIndex();

export function analyzeProfile(profile: Profile): ProfileSignature {
  const normalizedSkills = normalizeSkillList(profile.skills ?? []);

  // Infer domains from skills
  const domainScores = new Map<string, number>();
  for (const skill of normalizedSkills) {
    const domains = SKILL_DOMAIN_INDEX.get(skill);
    if (!domains) continue;
    for (const [domain, count] of domains) {
      domainScores.set(domain, (domainScores.get(domain) ?? 0) + count);
    }
  }
  const domains = Array.from(domainScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([domain]) => domain);

  // Total experience in years (sum of parsed experience durations)
  const totalMonths = (profile.experience ?? []).reduce(
    (sum, exp) => sum + parseDurationToMonths(exp.duration ?? ""),
    0,
  );
  const totalYearsExperience = Math.round((totalMonths / 12) * 10) / 10;

  let seniority: ProfileSignature["seniority"] = "entry";
  if (totalYearsExperience >= 5) seniority = "senior";
  else if (totalYearsExperience >= 1.5) seniority = "mid";

  // Keyword frequency built from all textual profile fields — used by
  // downstream evidence matching / ATS scoring.
  const keywordFrequency: Record<string, number> = {};
  const textBlobs: string[] = [
    ...normalizedSkills,
    ...(profile.experience ?? []).map((e) => `${e.title} ${e.description}`),
    ...(profile.projects ?? []).map((p) => `${p.name} ${p.description} ${p.technologies.join(" ")}`),
    ...(profile.publications ?? []).map((p) => p.title),
    ...(profile.certifications ?? []),
  ];
  for (const blob of textBlobs) {
    const tokens = blob.toLowerCase().match(/[a-z0-9+.#]+/g) ?? [];
    for (const token of tokens) {
      if (token.length < 2) continue;
      keywordFrequency[token] = (keywordFrequency[token] ?? 0) + 1;
    }
  }

  return {
    skills: profile.skills ?? [],
    normalizedSkills,
    domains,
    seniority,
    totalYearsExperience,
    keywordFrequency,
  };
}

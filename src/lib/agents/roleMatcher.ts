import type { MatchedRole, ProfileSignature, RoleTemplate } from "./types";
import { normalizeSkill } from "./skillsData";

function titleCase(skill: string): string {
  return skill
    .split(" ")
    .map((w) => (w.length <= 3 && w === w.toLowerCase() ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

export function matchRoles(
  signature: ProfileSignature,
  roleTemplates: RoleTemplate[],
): MatchedRole[] {
  const profileSkillSet = new Set(signature.normalizedSkills);
  const profileDomainSet = new Set(signature.domains);

  return roleTemplates.map((role) => {
    const normalizedRequired = role.requiredSkills.map((s) => normalizeSkill(s));
    const matched = normalizedRequired.filter((s) => profileSkillSet.has(s));
    const missing = role.requiredSkills.filter((s) => !profileSkillSet.has(normalizeSkill(s)));

    const skillOverlap = normalizedRequired.length > 0 ? matched.length / normalizedRequired.length : 0;

    const domainMatches = role.domains.filter((d) => profileDomainSet.has(d)).length;
    const domainOverlap = role.domains.length > 0 ? domainMatches / role.domains.length : 0;

    // Small seniority alignment bonus/penalty
    const seniorityOrder = { entry: 0, mid: 1, senior: 2 } as const;
    const seniorityGap = Math.abs(seniorityOrder[signature.seniority] - seniorityOrder[role.seniority]);
    const seniorityFactor = seniorityGap === 0 ? 1 : seniorityGap === 1 ? 0.9 : 0.75;

    const rawScore = (skillOverlap * 0.75 + domainOverlap * 0.25) * seniorityFactor;
    const matchScore = Math.round(Math.min(1, rawScore) * 100);

    return {
      role,
      matchScore,
      missingSkills: missing.map(titleCase),
      matchedSkills: matched.map(titleCase),
    };
  });
}

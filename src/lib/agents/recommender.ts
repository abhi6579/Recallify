import type { Profile, Recommendation, RecommenderResult, RoleTemplate } from "./types";
import { analyzeProfile } from "./profileAnalyzer";
import { matchRoles } from "./roleMatcher";
import { estimateSalary } from "./salaryEstimator";

/**
 * Agent 1: Role Recommender
 * Graph: analyze_profile -> match_roles -> estimate_salary -> rank_and_output
 */
export function runRecommender(profile: Profile, roleTemplates: RoleTemplate[]): RecommenderResult {
  const auditTrail: string[] = [];

  auditTrail.push(`analyze_profile: extracted ${profile.skills?.length ?? 0} skills from profile`);
  const profileSignature = analyzeProfile(profile);
  auditTrail.push(
    `analyze_profile: seniority=${profileSignature.seniority}, years=${profileSignature.totalYearsExperience}, domains=[${profileSignature.domains.join(", ")}]`,
  );

  auditTrail.push(`match_roles: scoring against ${roleTemplates.length} role templates`);
  const matchedRoles = matchRoles(profileSignature, roleTemplates);

  auditTrail.push("estimate_salary: computing salary bands adjusted by match strength");
  const withSalary = matchedRoles.map((m) => ({ matched: m, salary: estimateSalary(m) }));

  auditTrail.push("rank_and_output: sorting by match score, selecting top 10");
  const ranked = withSalary
    .sort((a, b) => b.matched.matchScore - a.matched.matchScore)
    .slice(0, 10);

  const recommendations: Recommendation[] = ranked.map(({ matched, salary }) => ({
    title: matched.role.title,
    category: matched.role.category,
    matchScore: matched.matchScore,
    missingSkills: matched.missingSkills,
    matchedSkills: matched.matchedSkills,
    domains: matched.role.domains,
    seniority: matched.role.seniority,
    salaryRangeInr: salary.salaryRangeInr,
    salaryRangeUsdHourly: salary.salaryRangeUsdHourly,
  }));

  auditTrail.push(`rank_and_output: produced ${recommendations.length} recommendations`);

  return { profileSignature, recommendations, auditTrail };
}

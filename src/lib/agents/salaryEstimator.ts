import type { MatchedRole, SalaryEstimate } from "./types";

function adjustRange(range: [number, number], matchScore: number): [number, number] {
  const [min, max] = range;
  if (max <= 0) return range;
  const span = max - min;
  // Strong matches skew toward the top of the band; weak matches skew toward
  // the bottom, reflecting realistic offer expectations.
  const factor = matchScore / 100;
  const adjustedMin = Math.round(min + span * (0.25 * factor));
  const adjustedMax = Math.round(max - span * (0.15 * (1 - factor)));
  return [adjustedMin, Math.max(adjustedMin, adjustedMax)];
}

export function estimateSalary(matched: MatchedRole): SalaryEstimate {
  const { role, matchScore } = matched;
  return {
    title: role.title,
    salaryRangeInr: adjustRange(role.salaryRangeInr, matchScore),
    salaryRangeUsdHourly: adjustRange(role.salaryRangeUsdHourly, matchScore),
  };
}

/**
 * Agent 2 / tool: ats_evaluator — approximates an Applicant Tracking System
 * keyword match score by checking what fraction of parsed JD requirements
 * literally appear in the generated resume text.
 */
export function evaluateAts(
  resumeText: string,
  jdRequirements: string[],
): { atsScore: number; missingKeywords: string[] } {
  if (jdRequirements.length === 0) {
    return { atsScore: 1, missingKeywords: [] };
  }
  const lowerResume = resumeText.toLowerCase();
  const missing: string[] = [];
  let hits = 0;

  for (const req of jdRequirements) {
    const needle = req.toLowerCase();
    if (lowerResume.includes(needle)) {
      hits += 1;
    } else {
      missing.push(req);
    }
  }

  const atsScore = Math.round((hits / jdRequirements.length) * 100) / 100;
  return { atsScore, missingKeywords: missing };
}

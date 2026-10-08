import type { EvidenceMatch, Profile } from "./types";
import { normalizeSkill } from "./skillsData";
import { STOPWORDS } from "./jdParser";

function tokenize(text: string): Set<string> {
  const tokens = (text.toLowerCase().match(/[a-z0-9+.#]+/g) ?? []).filter(
    (t) => t.length >= 3 && !STOPWORDS.has(t),
  );
  return new Set(tokens);
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  if (a.size === 0) return 0;
  let hits = 0;
  for (const t of a) if (b.has(t)) hits += 1;
  return hits / a.size;
}

/**
 * Agent 2 / tool: evidence_matcher — a lightweight RAG-style retriever over
 * the candidate's profile. For each JD requirement, finds the strongest
 * supporting evidence across skills, experience, projects, publications and
 * certifications so the resume generator only ever writes grounded content.
 */
export function matchEvidence(requirements: string[], profile: Profile): EvidenceMatch[] {
  const normalizedSkillSet = new Set((profile.skills ?? []).map((s) => normalizeSkill(s)));

  const experienceDocs = (profile.experience ?? []).map((e) => ({
    text: `${e.title} at ${e.company}: ${e.description}`,
    tokens: tokenize(`${e.title} ${e.description}`),
  }));
  const projectDocs = (profile.projects ?? []).map((p) => ({
    text: `${p.name}: ${p.description} (${p.technologies.join(", ")})`,
    tokens: tokenize(`${p.name} ${p.description} ${p.technologies.join(" ")}`),
  }));
  const publicationDocs = (profile.publications ?? []).map((p) => ({
    text: p.title,
    tokens: tokenize(p.title),
  }));
  const certificationDocs = (profile.certifications ?? []).map((c) => ({
    text: c,
    tokens: tokenize(c),
  }));

  return requirements.map((requirement) => {
    const reqSkillKey = normalizeSkill(requirement);

    // 1) Direct skill match is the strongest, cheapest signal.
    if (normalizedSkillSet.has(reqSkillKey)) {
      return {
        requirement,
        score: 1,
        evidence: [`Listed skill: ${requirement}`],
        source: "skills" as const,
      };
    }

    const reqTokens = tokenize(requirement);
    const candidates: { text: string; score: number; source: EvidenceMatch["source"] }[] = [];

    for (const doc of experienceDocs) {
      candidates.push({ text: doc.text, score: overlapScore(reqTokens, doc.tokens), source: "experience" });
    }
    for (const doc of projectDocs) {
      candidates.push({ text: doc.text, score: overlapScore(reqTokens, doc.tokens), source: "projects" });
    }
    for (const doc of publicationDocs) {
      candidates.push({ text: doc.text, score: overlapScore(reqTokens, doc.tokens), source: "publications" });
    }
    for (const doc of certificationDocs) {
      candidates.push({ text: doc.text, score: overlapScore(reqTokens, doc.tokens), source: "certifications" });
    }

    candidates.sort((a, b) => b.score - a.score);
    const best = candidates[0];

    if (!best || best.score === 0) {
      return { requirement, score: 0, evidence: [], source: "none" as const };
    }

    const top = candidates.filter((c) => c.score >= best.score * 0.8 && c.score > 0).slice(0, 2);
    return {
      requirement,
      score: Math.round(best.score * 100) / 100,
      evidence: top.map((t) => t.text),
      source: best.source,
    };
  });
}

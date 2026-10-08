/**
 * Extracts obvious role/company metadata from a pasted job description.
 * This prevents stale sample fields (for example "AI/ML Engineer") from being
 * used after the user pastes an "Assistant Professor – Pharmacology" posting.
 */

function clean(value: string): string {
  return value
    .replace(/^[-–—•*\s]+/, "")
    .replace(/\s+/g, " ")
    .replace(/[|]+$/g, "")
    .trim();
}

function isUsefulTitle(value: string): boolean {
  if (value.length < 3 || value.length > 100) return false;
  if (/^(job description|about us|about the role|responsibilities|requirements|qualifications|preferred skills)$/i.test(value)) return false;
  return /[a-z]/i.test(value);
}

export function inferJobMetadata(jobDescription: string): {
  /** From an explicit `Position:` / `Job title:` label — high confidence. */
  roleTitle: string | null;
  /** From the opening heading — only a hint; a real listing title beats it. */
  headingTitle: string | null;
  companyName: string | null;
} {
  const lines = jobDescription
    .split(/\r?\n/)
    .map(clean)
    .filter(Boolean);

  let roleTitle: string | null = null;
  let companyName: string | null = null;

  for (const line of lines.slice(0, 15)) {
    const position = line.match(/^(?:position|job title|role|opening)\s*:\s*(.+)$/i);
    if (position && isUsefulTitle(position[1])) {
      roleTitle = clean(position[1]);
      break;
    }
  }

  // Headings like "Assistant Professor – Pharmacology" are common when the
  // posting has no explicit Position: line. This is a weaker signal: an
  // aggregator description may open with "Life at BMS", so it must never
  // override a real listing title supplied by the caller.
  let headingTitle: string | null = null;
  const first = lines[0] ?? "";
  if (isUsefulTitle(first) && !/[.!?]$/.test(first) && first.split(/\s+/).length <= 12) {
    headingTitle = first;
  }

  for (const line of lines.slice(0, 20)) {
    const company = line.match(/^(?:company|organisation|organization|employer)\s*:\s*(.+)$/i);
    if (company?.[1]) {
      companyName = clean(company[1]);
      break;
    }
    const hiring = line.match(/^(.{2,80}?)\s+(?:is|are)\s+hiring\b/i);
    if (hiring?.[1]) {
      companyName = clean(hiring[1]);
      break;
    }
  }

  return { roleTitle, headingTitle, companyName };
}

import { OpenRedaction } from "openredaction";
import type { PiiSanitizationReport } from "@/lib/agents/types";

const detector = new OpenRedaction({
  includeNames: false,
  includeAddresses: false,
  includePhones: true,
  includeEmails: true,
  redactionMode: "placeholder",
  deterministic: true,
  enableLearning: false,
  enableNER: false,
  maxInputSize: 120_000,
});

type RedactionCounter = Record<string, number>;

function mark(counts: RedactionCounter, type: string, amount = 1) {
  counts[type] = (counts[type] ?? 0) + amount;
}

/**
 * Defense-in-depth for high-risk entities whose contextual validators may
 * suppress isolated examples. OpenRedaction remains the primary scanner;
 * these narrow fallbacks cover only the four entities promised in the UI.
 */
function shieldHighRisk(text: string, counts: RedactionCounter): string {
  let output = text;

  const replace = (pattern: RegExp, type: string) => {
    output = output.replace(pattern, () => {
      mark(counts, type);
      return `[${type}]`;
    });
  };

  replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "EMAIL");
  replace(/\b\d{3}-\d{2}-\d{4}\b/g, "SSN");
  replace(/\b(?:\d[ -]*?){13,19}\b/g, "CREDIT_CARD");
  replace(/(?<!\w)(?:\+?\d{1,3}[ .-]?)?(?:\(?\d{2,5}\)?[ .-]?)?\d{3,5}[ .-]?\d{3,5}(?!\w)/g, "PHONE");

  return output;
}

function shieldKnownValues(text: string, values: string[], counts: RedactionCounter): string {
  let output = text;
  for (const value of values) {
    const clean = value.trim();
    if (clean.length < 3) continue;
    const escaped = clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(escaped, "gi");
    let matches = 0;
    output = output.replace(pattern, () => {
      matches += 1;
      return "[PERSONAL_DETAIL]";
    });
    if (matches) mark(counts, "PERSONAL_DETAIL", matches);
  }
  return output;
}

/**
 * Sanitizes text before an external model sees it. Raw content and the
 * reversible redaction map exist only inside this function and are never
 * logged, returned, or persisted.
 */
export async function sanitizeForModel(
  input: string,
  knownValues: string[] = [],
): Promise<{ sanitized: string; report: PiiSanitizationReport }> {
  const started = performance.now();
  const counts: RedactionCounter = {};
  const bounded = input.slice(0, 120_000);

  let sanitized = bounded;
  try {
    const result = await detector.detect(bounded);
    sanitized = result.redacted;
    for (const detection of result.detections) mark(counts, detection.type);
  } catch {
    // The high-risk shield still runs if the library rejects malformed input.
  }

  sanitized = shieldHighRisk(sanitized, counts);
  sanitized = shieldKnownValues(sanitized, knownValues, counts);

  return {
    sanitized,
    report: {
      totalDetected: Object.values(counts).reduce((sum, count) => sum + count, 0),
      byType: counts,
      processingMs: Math.max(0, Math.round((performance.now() - started) * 10) / 10),
      rawStored: false,
    },
  };
}

import { getLlmConfig } from "@/lib/llm";
import { getUserFromToken, parseSessionTokenFromRequest } from "@/lib/auth";
import { analyzeWritingStyle } from "@/lib/agents/styleMirror";
import type { PiiSanitizationReport } from "@/lib/agents/types";
import { sanitizeForModel } from "@/lib/privacy";
import { deleteStyleProfile, getStyleProfile, saveStyleProfile } from "@/lib/styleStore";

export const dynamic = "force-dynamic";

async function currentUser(request: Request) {
  const token = parseSessionTokenFromRequest(request);
  return token ? getUserFromToken(token) : null;
}

export async function GET(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ profile: null, authenticated: false });

  try {
    const stored = await getStyleProfile(user.id);
    return Response.json({ ...stored, authenticated: true });
  } catch {
    return Response.json(
      { error: "The encrypted style profile could not be opened. Check STYLE_ENCRYPTION_KEY." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const samples = Array.isArray(body?.samples)
    ? body.samples.filter((sample: unknown): sample is string => typeof sample === "string")
    : [];

  const valid = samples
    .map((sample: string) => sample.trim())
    .filter((sample: string) => sample.length >= 60)
    .slice(0, 5);
  const totalCharacters = valid.reduce((sum: number, sample: string) => sum + sample.length, 0);

  if (valid.length < 2) {
    return Response.json(
      { error: "Add at least two writing samples with 60 or more characters each." },
      { status: 400 },
    );
  }
  if (totalCharacters > 30_000) {
    return Response.json({ error: "Keep total sample text under 30,000 characters." }, { status: 413 });
  }

  const user = await currentUser(request);
  const knownValues = user ? [user.name, user.email] : [];
  const cleanSamples: string[] = [];
  const aggregate: PiiSanitizationReport = {
    totalDetected: 0,
    byType: {},
    processingMs: 0,
    rawStored: false,
  };

  for (const sample of valid) {
    const { sanitized, report } = await sanitizeForModel(sample, knownValues);
    cleanSamples.push(sanitized);
    aggregate.totalDetected += report.totalDetected;
    aggregate.processingMs += report.processingMs;
    for (const [type, count] of Object.entries(report.byType)) {
      aggregate.byType[type] = (aggregate.byType[type] ?? 0) + count;
    }
  }
  aggregate.processingMs = Math.round(aggregate.processingMs * 10) / 10;

  const profile = analyzeWritingStyle(cleanSamples);
  const provider = getLlmConfig()?.provider ?? "deterministic";
  let persisted = false;
  let updatedAt = profile.analyzedAt;
  let storageWarning: string | null = null;

  if (user) {
    try {
      const stored = await saveStyleProfile({
        userId: user.id,
        profile,
        piiReport: aggregate,
        provider,
      });
      persisted = true;
      updatedAt = stored.updatedAt;
    } catch {
      storageWarning = "The fingerprint was created but could not be encrypted at rest. It remains available only for this browser session.";
    }
  }

  // `valid`, `cleanSamples`, and redaction maps fall out of scope here. None
  // are written to logs or storage.
  return Response.json({
    profile,
    piiReport: aggregate,
    persisted,
    authenticated: Boolean(user),
    provider,
    updatedAt,
    storageWarning,
    privacy: {
      rawSamplesStored: false,
      externalModelReceivedRawSamples: false,
      storedArtifact: persisted ? "AES-256-GCM encrypted style fingerprint" : "none (ephemeral guest run)",
    },
  });
}

export async function DELETE(request: Request) {
  const user = await currentUser(request);
  if (!user) return Response.json({ error: "Log in to delete a stored style profile." }, { status: 401 });
  await deleteStyleProfile(user.id);
  return Response.json({ ok: true });
}

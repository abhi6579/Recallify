import { getUserFromToken, parseSessionTokenFromRequest } from "@/lib/auth";
import { getOrCreateProfile } from "@/db/queries";
import { rewriteInStyle } from "@/lib/agents/styleMirror";
import type { StyleProfile, StyleRewriteKind } from "@/lib/agents/types";
import { getStyleProfile } from "@/lib/styleStore";

export const dynamic = "force-dynamic";

const KINDS = new Set<StyleRewriteKind>([
  "summary",
  "cover_letter",
  "recruiter_message",
  "follow_up",
  "freeform",
]);

function numericClaims(text: string): string[] {
  return text.match(/\b\d+(?:[.,]\d+)?%?|[$₹€£]\s?\d[\d,.]*\b/g) ?? [];
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const kind = KINDS.has(body?.kind) ? (body.kind as StyleRewriteKind) : "freeform";

  if (text.length < 20) {
    return Response.json({ error: "Add at least 20 characters to rewrite." }, { status: 400 });
  }
  if (text.length > 20_000) {
    return Response.json({ error: "Keep each rewrite under 20,000 characters." }, { status: 413 });
  }

  const token = parseSessionTokenFromRequest(request);
  const user = token ? await getUserFromToken(token) : null;
  let style = body?.style as StyleProfile | undefined;

  if (!style && user) {
    const stored = await getStyleProfile(user.id).catch(() => null);
    style = stored?.profile;
  }
  if (!style) {
    return Response.json(
      { error: "Create a Style Mirror profile first, or include an ephemeral style profile." },
      { status: 400 },
    );
  }

  const profile = user ? await getOrCreateProfile(user.id) : null;
  const knownPii = profile
    ? [profile.name, profile.email, profile.phone, profile.location, profile.linkedin]
    : [];

  const rewritten = await rewriteInStyle({ text, kind, style, knownPii });
  const originalClaims = numericClaims(text);
  const missingClaims = originalClaims.filter((claim) => !rewritten.text.includes(claim));

  if (rewritten.modelUsed && missingClaims.length > 0) {
    const fallback = await rewriteInStyle({
      text,
      kind,
      style,
      knownPii: [],
      forceDeterministic: true,
    });
    return Response.json({
      text: fallback.text,
      provider: "deterministic",
      modelUsed: false,
      modelOutputRejected: true,
      reason: "The model changed or removed numeric claims, so the safer deterministic rewrite was used.",
    });
  }

  return Response.json({
    ...rewritten,
    modelOutputRejected: false,
    privacy: {
      rawStored: false,
      promptSanitizedBeforeModel: rewritten.modelUsed,
    },
  });
}

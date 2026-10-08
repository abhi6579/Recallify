import { eq } from "drizzle-orm";
import { db } from "@/db";
import { styleProfiles } from "@/db/schema";
import type { PiiSanitizationReport, StyleProfile } from "@/lib/agents/types";
import { decryptStyleProfile, encryptStyleProfile } from "@/lib/styleCrypto";

export async function getStyleProfile(userId: number): Promise<{
  profile: StyleProfile;
  piiSummary: Record<string, number>;
  provider: string;
  updatedAt: string;
} | null> {
  const rows = await db.select().from(styleProfiles).where(eq(styleProfiles.userId, userId)).limit(1);
  const row = rows[0];
  if (!row) return null;

  return {
    profile: decryptStyleProfile({
      ciphertext: row.ciphertext,
      iv: row.iv,
      authTag: row.authTag,
    }),
    piiSummary: row.piiSummary,
    provider: row.modelProvider,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function saveStyleProfile(options: {
  userId: number;
  profile: StyleProfile;
  piiReport: PiiSanitizationReport;
  provider: string;
}) {
  const encrypted = encryptStyleProfile(options.profile);
  const values = {
    ...encrypted,
    sampleCount: options.profile.sampleCount,
    piiSummary: options.piiReport.byType,
    modelProvider: options.provider,
    version: 1,
    updatedAt: new Date(),
  };

  const saved = await db
    .insert(styleProfiles)
    .values({ userId: options.userId, ...values })
    .onConflictDoUpdate({
      target: styleProfiles.userId,
      set: values,
    })
    .returning({ id: styleProfiles.id, updatedAt: styleProfiles.updatedAt });

  return {
    id: saved[0].id,
    updatedAt: saved[0].updatedAt.toISOString(),
  };
}

export async function deleteStyleProfile(userId: number) {
  await db.delete(styleProfiles).where(eq(styleProfiles.userId, userId));
}

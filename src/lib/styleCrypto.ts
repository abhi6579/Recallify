import crypto from "crypto";
import type { StyleProfile } from "@/lib/agents/types";

type EncryptedStyle = { ciphertext: string; iv: string; authTag: string };

function encryptionKey(): Buffer {
  const configured = process.env.STYLE_ENCRYPTION_KEY;
  if (!configured) throw new Error("STYLE_ENCRYPTION_KEY is not configured.");

  const base64 = Buffer.from(configured, "base64");
  if (base64.length === 32) return base64;

  // Accept a long deployment secret while still deriving an exact 256-bit key.
  if (configured.length >= 32) return crypto.createHash("sha256").update(configured).digest();
  throw new Error("STYLE_ENCRYPTION_KEY must be 32 random bytes encoded as base64.");
}

export function encryptStyleProfile(profile: StyleProfile): EncryptedStyle {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const plaintext = Buffer.from(JSON.stringify(profile), "utf8");
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
}

export function decryptStyleProfile(encrypted: EncryptedStyle): StyleProfile {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.authTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.ciphertext, "base64")),
    decipher.final(),
  ]);
  return JSON.parse(plaintext.toString("utf8")) as StyleProfile;
}

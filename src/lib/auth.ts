import crypto from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { profiles, users, userSessions } from "@/db/schema";
import type { AuthUser } from "@/lib/agents/types";

const SESSION_TTL_DAYS = 30;
const PASSWORD_ITERATIONS = 120_000;
const LEGACY_PASSWORD_ITERATIONS = 10_000;

function derivePassword(password: string, salt: string, iterations: number): string {
  return crypto.pbkdf2Sync(password, salt, iterations, 64, "sha512").toString("hex");
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const nextSalt = salt || crypto.randomBytes(16).toString("hex");
  return {
    hash: derivePassword(password, nextSalt, PASSWORD_ITERATIONS),
    salt: nextSalt,
  };
}

function safeEqualHex(left: string, right: string): boolean {
  try {
    const a = Buffer.from(left, "hex");
    const b = Buffer.from(right, "hex");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Supports accounts created before the stronger PBKDF2 work factor. */
export function verifyPassword(password: string, hash: string, salt: string): {
  valid: boolean;
  legacy: boolean;
} {
  const current = derivePassword(password, salt, PASSWORD_ITERATIONS);
  if (safeEqualHex(current, hash)) return { valid: true, legacy: false };

  const legacy = derivePassword(password, salt, LEGACY_PASSWORD_ITERATIONS);
  return { valid: safeEqualHex(legacy, hash), legacy: safeEqualHex(legacy, hash) };
}

function serializeUser(user: typeof users.$inferSelect): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role === "admin" ? "admin" : "user",
    active: user.active,
    targetRole: user.targetRole,
    careerField: user.careerField,
    avatarUrl: user.avatarUrl,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

async function createSession(userId: number): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  await db.insert(userSessions).values({ token, userId, expiresAt });
  return token;
}

/**
 * Creates or repairs the creator account from environment configuration.
 * Public signup never accepts a role, so this is the only bootstrap path to
 * administrator privileges.
 */
export async function ensureAdminAccount(): Promise<AuthUser | null> {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "AutoApply Creator";

  if (!email || !password || password.length < 12) return null;

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) {
    const current = existing[0];
    // Environment credentials bootstrap the creator once. Afterwards the
    // database hash is authoritative, allowing secure in-app password changes.
    const updated = await db
      .update(users)
      .set({ name, role: "admin", active: true, updatedAt: new Date() })
      .where(eq(users.id, current.id))
      .returning();
    return serializeUser(updated[0]);
  }

  const credentials = hashPassword(password);
  const inserted = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: credentials.hash,
      salt: credentials.salt,
      role: "admin",
      active: true,
      targetRole: "Platform Administrator",
      careerField: "management-business",
    })
    .returning();
  const admin = inserted[0];

  await db.insert(profiles).values({
    userId: admin.id,
    name: admin.name,
    email: admin.email,
    location: "",
    relocate: false,
    phone: "",
    linkedin: "",
    careerFields: ["management-business"],
    education: [],
    experience: [],
    projects: [],
    skills: ["Product Management", "Business Strategy", "Platform Operations"],
    publications: [],
    certifications: [],
  });

  return serializeUser(admin);
}

export async function signUpUser(input: {
  name: string;
  email: string;
  password: string;
  targetRole?: string;
  careerField?: string;
}): Promise<{ user: AuthUser; token: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
    throw new Error("This email address is reserved for the creator account.");
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing[0]) throw new Error("An account with this email address already exists.");

  const credentials = hashPassword(input.password);
  const inserted = await db
    .insert(users)
    .values({
      name,
      email,
      passwordHash: credentials.hash,
      salt: credentials.salt,
      role: "user",
      active: true,
      targetRole: input.targetRole || "",
      careerField: input.careerField || "engineering-tech",
      avatarUrl: "",
    })
    .returning();
  const user = inserted[0];

  await db.insert(profiles).values({
    userId: user.id,
    name: user.name,
    email: user.email,
    location: "",
    relocate: true,
    phone: "",
    linkedin: "",
    careerFields: user.careerField ? [user.careerField] : ["engineering-tech"],
    education: [],
    experience: [],
    projects: [],
    skills: [],
    publications: [],
    certifications: [],
  });

  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));
  const token = await createSession(user.id);
  return { user: { ...serializeUser(user), lastLoginAt: new Date().toISOString() }, token };
}

export async function signInUser(input: {
  email: string;
  password: string;
}): Promise<{ user: AuthUser; token: string }> {
  const email = input.email.trim().toLowerCase();

  // Bootstrap is idempotent and only acts on the configured creator email.
  if (email === process.env.ADMIN_EMAIL?.trim().toLowerCase()) {
    await ensureAdminAccount();
  }

  const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!found[0]) throw new Error("Invalid email or password.");

  const user = found[0];
  if (!user.active) throw new Error("This account has been suspended. Contact the administrator.");

  const verified = verifyPassword(input.password, user.passwordHash, user.salt);
  if (!verified.valid) throw new Error("Invalid email or password.");

  const update: Partial<typeof users.$inferInsert> = { lastLoginAt: new Date() };
  if (verified.legacy) {
    const upgraded = hashPassword(input.password);
    update.passwordHash = upgraded.hash;
    update.salt = upgraded.salt;
    update.updatedAt = new Date();
  }
  const updated = await db.update(users).set(update).where(eq(users.id, user.id)).returning();
  const token = await createSession(user.id);
  return { user: serializeUser(updated[0]), token };
}

export async function signOutSession(token: string): Promise<void> {
  if (token) await db.delete(userSessions).where(eq(userSessions.token, token));
}

export async function getUserFromToken(token: string): Promise<AuthUser | null> {
  if (!token) return null;
  const rows = await db
    .select({ user: users })
    .from(userSessions)
    .innerJoin(users, eq(userSessions.userId, users.id))
    .where(
      and(
        eq(userSessions.token, token),
        gt(userSessions.expiresAt, new Date()),
        eq(users.active, true),
      ),
    )
    .limit(1);
  return rows[0] ? serializeUser(rows[0].user) : null;
}

export async function requireAdmin(request: Request): Promise<AuthUser | null> {
  const token = parseSessionTokenFromRequest(request);
  const user = token ? await getUserFromToken(token) : null;
  return user?.role === "admin" ? user : null;
}

export async function changePassword(userId: number, currentPassword: string, newPassword: string) {
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const user = rows[0];
  if (!user || !verifyPassword(currentPassword, user.passwordHash, user.salt).valid) {
    throw new Error("Current password is incorrect.");
  }
  if (newPassword.length < 12) {
    throw new Error("New admin password must contain at least 12 characters.");
  }

  const next = hashPassword(newPassword);
  await db
    .update(users)
    .set({ passwordHash: next.hash, salt: next.salt, updatedAt: new Date() })
    .where(eq(users.id, userId));

  // End every other session. The current caller can log in again immediately.
  await db.delete(userSessions).where(eq(userSessions.userId, userId));
}

export function parseSessionTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.get("Authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7).trim();

  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/(?:^|;\s*)autoapply_session=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function sessionCookie(token: string, request: Request, maxAge = SESSION_TTL_DAYS * 86400): string {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const secure = forwardedProto === "https" || new URL(request.url).protocol === "https:";
  return [
    `autoapply_session=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : "",
    `Max-Age=${maxAge}`,
  ]
    .filter(Boolean)
    .join("; ");
}

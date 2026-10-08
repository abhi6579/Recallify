import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  applications,
  customerFeedback,
  jobAlerts,
  liveJobsCache,
  mockInterviews,
  profiles,
  resumeRuns,
  savedJobs,
  styleProfiles,
  userSessions,
  users,
} from "@/db/schema";
import { isRealEmailConfigured } from "@/lib/agents/emailService";

async function tableCount(table: typeof users | typeof profiles | typeof applications | typeof resumeRuns | typeof mockInterviews | typeof jobAlerts | typeof savedJobs | typeof liveJobsCache | typeof customerFeedback | typeof userSessions | typeof styleProfiles): Promise<number> {
  const rows = await db.select({ count: sql<number>`count(*)::int` }).from(table);
  return Number(rows[0]?.count ?? 0);
}

export async function getAdminOverview() {
  const [
    userCount,
    profileCount,
    applicationCount,
    resumeCount,
    interviewCount,
    alertCount,
    savedJobCount,
    cachedJobCount,
    feedbackCount,
    sessionCount,
    styleProfileCount,
    userRows,
    feedbackRows,
  ] = await Promise.all([
    tableCount(users),
    tableCount(profiles),
    tableCount(applications),
    tableCount(resumeRuns),
    tableCount(mockInterviews),
    tableCount(jobAlerts),
    tableCount(savedJobs),
    tableCount(liveJobsCache),
    tableCount(customerFeedback),
    tableCount(userSessions),
    tableCount(styleProfiles),
    db.select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      targetRole: users.targetRole,
      careerField: users.careerField,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
    }).from(users).orderBy(desc(users.createdAt)).limit(100),
    db.select({
      id: customerFeedback.id,
      userName: customerFeedback.userName,
      userRole: customerFeedback.userRole,
      rating: customerFeedback.rating,
      favoriteFeature: customerFeedback.favoriteFeature,
      whatLacking: customerFeedback.whatLacking,
      createdAt: customerFeedback.createdAt,
    }).from(customerFeedback).orderBy(desc(customerFeedback.createdAt)).limit(10),
  ]);

  const activeUsers = userRows.filter((user) => user.active).length;
  const admins = userRows.filter((user) => user.role === "admin").length;
  const ratings = feedbackRows.map((item) => item.rating);
  const averageRating = ratings.length
    ? Math.round((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length) * 10) / 10
    : 0;

  return {
    counts: {
      users: userCount,
      activeUsers,
      admins,
      profiles: profileCount,
      applications: applicationCount,
      resumeRuns: resumeCount,
      mockInterviews: interviewCount,
      jobAlerts: alertCount,
      savedJobs: savedJobCount,
      cachedJobs: cachedJobCount,
      feedback: feedbackCount,
      activeSessions: sessionCount,
      styleProfiles: styleProfileCount,
    },
    users: userRows.map((user) => ({
      ...user,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
    })),
    feedback: feedbackRows.map((item) => ({
      ...item,
      createdAt: item.createdAt.toISOString(),
    })),
    integrations: {
      email: isRealEmailConfigured(),
      llm: {
        enabled: Boolean(process.env.GROQ_API_KEY || process.env.TOGETHER_API_KEY),
        provider: process.env.GROQ_API_KEY
          ? "Groq · open-weight"
          : process.env.TOGETHER_API_KEY
            ? "Together.ai · open-weight"
            : "Deterministic fallback",
      },
      adzuna: Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY),
    },
  };
}

export async function setUserActive(userId: number, active: boolean) {
  const target = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target[0]) return null;
  if (target[0].role === "admin" && !active) {
    throw new Error("Administrator accounts cannot be suspended from this screen.");
  }

  const updated = await db
    .update(users)
    .set({ active, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning();

  if (!active) {
    await db.delete(userSessions).where(eq(userSessions.userId, userId));
  }

  const user = updated[0];
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    active: user.active,
  };
}

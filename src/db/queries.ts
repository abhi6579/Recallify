import { db } from "@/db";
import {
  applications,
  coachingPlans,
  companyBriefs,
  customerFeedback,
  followUpLogs,
  jobAlerts,
  linkedInOptimizations,
  mockInterviews,
  newsCache,
  profiles,
  resumeRuns,
  roles,
  savedArticles,
  savedJobs,
  users,
  workspaces,
} from "@/db/schema";
import { eq, desc, isNull } from "drizzle-orm";
import { DEFAULT_PROFILE } from "@/lib/agents/defaultProfile";
import { ROLE_TEMPLATES } from "@/lib/agents/skillsData";
import { decideFollowUp } from "@/lib/agents/followupAgent";
import { renderFollowUpMessage } from "@/lib/agents/followupTemplate";
import { dispatchEmail } from "@/lib/agents/emailService";
import type {
  CoachingPlanData,
  CompanyIntelligence,
  CustomerFeedbackItem,
  JobAlertItem,
  LinkedInPackage,
  MockFeedback,
  MockInterviewReport,
  MockQuestion,
  NewsArticle,
  Profile,
  RoleTemplate,
  SavedArticle,
  SavedJobRecord,
  ScoredJob,
  Workspace,
} from "@/lib/agents/types";
import type { ResumeAgentResult } from "@/lib/agents/types";

// ---------------- Profile ----------------

export async function getOrCreateProfile(userId?: number | null): Promise<Profile> {
  if (userId) {
    const userRows = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    if (userRows.length > 0) {
      const p = userRows[0];
      return {
        id: p.id,
        name: p.name,
        location: p.location,
        relocate: p.relocate,
        phone: p.phone,
        email: p.email,
        linkedin: p.linkedin,
        careerFields: p.careerFields ?? [],
        education: p.education,
        experience: p.experience,
        projects: p.projects,
        skills: p.skills,
        publications: p.publications,
        certifications: p.certifications,
      };
    }

    const account = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!account[0]) throw new Error("Authenticated account no longer exists.");
    const created = await db
      .insert(profiles)
      .values({
        userId,
        name: account[0].name,
        email: account[0].email,
        location: "",
        relocate: true,
        phone: "",
        linkedin: "",
        careerFields: account[0].careerField ? [account[0].careerField] : [],
        education: [],
        experience: [],
        projects: [],
        skills: [],
        publications: [],
        certifications: [],
      })
      .returning();
    const p = created[0];
    return {
      id: p.id,
      name: p.name,
      location: p.location,
      relocate: p.relocate,
      phone: p.phone,
      email: p.email,
      linkedin: p.linkedin,
      careerFields: p.careerFields,
      education: p.education,
      experience: p.experience,
      projects: p.projects,
      skills: p.skills,
      publications: p.publications,
      certifications: p.certifications,
    };
  }

  const rows = await db.select().from(profiles).where(isNull(profiles.userId)).orderBy(profiles.id).limit(1);
  if (rows.length > 0) {
    const p = rows[0];
    return {
      id: p.id,
      name: p.name,
      location: p.location,
      relocate: p.relocate,
      phone: p.phone,
      email: p.email,
      linkedin: p.linkedin,
      careerFields: p.careerFields ?? [],
      education: p.education,
      experience: p.experience,
      projects: p.projects,
      skills: p.skills,
      publications: p.publications,
      certifications: p.certifications,
    };
  }
  const inserted = await db
    .insert(profiles)
    .values({ ...DEFAULT_PROFILE, userId: userId || null })
    .returning();
  const p = inserted[0];
  return { ...DEFAULT_PROFILE, id: p.id };
}

export async function saveProfile(profile: Profile, userId?: number | null): Promise<Profile> {
  if (userId) {
    const userProfile = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.userId, userId)).limit(1);
    if (userProfile.length > 0) {
      const id = userProfile[0].id;
      await db
        .update(profiles)
        .set({
          name: profile.name,
          location: profile.location,
          relocate: profile.relocate,
          phone: profile.phone,
          email: profile.email,
          linkedin: profile.linkedin,
          careerFields: profile.careerFields ?? [],
          education: profile.education,
          experience: profile.experience,
          projects: profile.projects,
          skills: profile.skills,
          publications: profile.publications,
          certifications: profile.certifications,
          updatedAt: new Date(),
        })
        .where(eq(profiles.id, id));
      return { ...profile, id };
    } else {
      const inserted = await db.insert(profiles).values({ ...profile, userId }).returning();
      return { ...profile, id: inserted[0].id };
    }
  }

  const existing = await db.select({ id: profiles.id }).from(profiles).orderBy(profiles.id).limit(1);
  if (existing.length === 0) {
    const inserted = await db.insert(profiles).values({ ...profile }).returning();
    return { ...profile, id: inserted[0].id };
  }
  const id = existing[0].id;
  await db
    .update(profiles)
    .set({
      name: profile.name,
      location: profile.location,
      relocate: profile.relocate,
      phone: profile.phone,
      email: profile.email,
      linkedin: profile.linkedin,
      careerFields: profile.careerFields ?? [],
      education: profile.education,
      experience: profile.experience,
      projects: profile.projects,
      skills: profile.skills,
      publications: profile.publications,
      certifications: profile.certifications,
      updatedAt: new Date(),
    })
    .where(eq(profiles.id, id));
  return { ...profile, id };
}

// ---------------- Roles ----------------

export async function getRoleTemplates(): Promise<RoleTemplate[]> {
  const rows = await db.select().from(roles);

  // Re-seed whenever the bundled library changes (e.g. new sectors added) so
  // the recommender always reflects the full catalogue of roles.
  if (rows.length !== ROLE_TEMPLATES.length) {
    await db.delete(roles);
    await db.insert(roles).values(
      ROLE_TEMPLATES.map((r) => ({
        title: r.title,
        category: r.category,
        requiredSkills: r.requiredSkills,
        domains: r.domains,
        seniority: r.seniority,
        salaryMinInr: r.salaryRangeInr[0],
        salaryMaxInr: r.salaryRangeInr[1],
        salaryMinUsdHourly: r.salaryRangeUsdHourly[0],
        salaryMaxUsdHourly: r.salaryRangeUsdHourly[1],
      })),
    );
    return ROLE_TEMPLATES;
  }

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    category: r.category,
    requiredSkills: r.requiredSkills,
    domains: r.domains,
    seniority: r.seniority as RoleTemplate["seniority"],
    salaryRangeInr: [r.salaryMinInr, r.salaryMaxInr],
    salaryRangeUsdHourly: [r.salaryMinUsdHourly, r.salaryMaxUsdHourly],
  }));
}

// ---------------- Industry updates ----------------

const NEWS_TTL_MS = 20 * 60 * 1000;

export async function getCachedNews(topic: string) {
  const rows = await db.select().from(newsCache).where(eq(newsCache.topic, topic)).limit(1);
  const row = rows[0];
  if (!row) return null;
  if (Date.now() - row.fetchedAt.getTime() > NEWS_TTL_MS) return null;
  return row.payload as unknown as NewsArticle[];
}

export async function setCachedNews(topic: string, articles: NewsArticle[]) {
  const existing = await db.select({ id: newsCache.id }).from(newsCache).where(eq(newsCache.topic, topic)).limit(1);
  const payload = articles as unknown as Record<string, unknown>[];
  if (existing.length > 0) {
    await db.update(newsCache).set({ payload, fetchedAt: new Date() }).where(eq(newsCache.id, existing[0].id));
  } else {
    await db.insert(newsCache).values({ topic, payload });
  }
}

export async function listSavedArticles(): Promise<SavedArticle[]> {
  const rows = await db.select().from(savedArticles).orderBy(desc(savedArticles.savedAt));
  return rows.map((r) => ({
    savedId: r.id,
    id: r.articleId,
    title: r.title,
    url: r.url,
    source: r.source,
    topic: r.topic,
    summary: r.summary,
    publishedAt: r.publishedAt,
    note: r.note,
    savedAt: r.savedAt.toISOString(),
  }));
}

export async function saveArticle(article: NewsArticle & { note?: string }) {
  const existing = await db.select({ id: savedArticles.id }).from(savedArticles).where(eq(savedArticles.articleId, article.id)).limit(1);
  if (existing.length > 0) {
    const updated = await db.update(savedArticles).set({ note: article.note ?? "" }).where(eq(savedArticles.id, existing[0].id)).returning();
    return updated[0];
  }
  const inserted = await db
    .insert(savedArticles)
    .values({
      articleId: article.id,
      title: article.title,
      url: article.url,
      source: article.source,
      topic: article.topic,
      summary: article.summary,
      publishedAt: article.publishedAt,
      note: article.note ?? "",
    })
    .returning();
  return inserted[0];
}

export async function deleteSavedArticle(id: number) {
  await db.delete(savedArticles).where(eq(savedArticles.id, id));
}

// ---------------- Saved jobs (Job Discovery) ----------------

export async function listSavedJobs(): Promise<SavedJobRecord[]> {
  const rows = await db.select().from(savedJobs).orderBy(desc(savedJobs.savedAt));
  return rows.map((r) => ({
    savedId: r.id,
    id: r.jobId,
    title: r.title,
    company: r.company,
    location: r.location,
    remote: r.remote,
    salaryText: r.salaryText,
    employmentType: r.employmentType,
    postedAt: r.postedAt,
    applyUrl: r.applyUrl,
    source: r.source,
    description: r.description,
    tags: r.tags,
    fitScore: r.fitScore,
    matchedSkills: r.matchedSkills,
    missingSkills: r.missingSkills,
    freshnessDays: null,
    salaryTransparent: Boolean(r.salaryText),
    verdict: r.fitScore >= 70 ? "strong_fit" : r.fitScore >= 50 ? "worth_applying" : r.fitScore >= 30 ? "stretch" : "low_fit",
    note: r.note,
    savedAt: r.savedAt.toISOString(),
  }));
}

export async function saveJob(job: ScoredJob & { note?: string }) {
  const existing = await db.select({ id: savedJobs.id }).from(savedJobs).where(eq(savedJobs.jobId, job.id)).limit(1);
  if (existing.length > 0) return existing[0];
  const inserted = await db
    .insert(savedJobs)
    .values({
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      remote: job.remote,
      salaryText: job.salaryText,
      employmentType: job.employmentType,
      postedAt: job.postedAt,
      applyUrl: job.applyUrl,
      source: job.source,
      description: job.description.slice(0, 9000),
      tags: job.tags,
      fitScore: job.fitScore,
      matchedSkills: job.matchedSkills,
      missingSkills: job.missingSkills,
      note: job.note ?? "",
    })
    .returning();
  return inserted[0];
}

export async function deleteSavedJob(id: number) {
  await db.delete(savedJobs).where(eq(savedJobs.id, id));
}

// ---------------- Applications ----------------

export async function listApplications() {
  return db.select().from(applications).orderBy(desc(applications.createdAt));
}

export async function getApplication(id: number) {
  const rows = await db.select().from(applications).where(eq(applications.id, id)).limit(1);
  return rows[0] ?? null;
}

export type CreateApplicationInput = {
  company: string;
  role: string;
  contactEmail: string;
  appliedDate: string;
  followUpDelayDays: number;
  followUpMessage: string;
  maxFollowUps: number;
  notes?: string;
  resumeRunId?: number | null;
};

export async function createApplication(input: CreateApplicationInput) {
  const inserted = await db
    .insert(applications)
    .values({
      company: input.company,
      role: input.role,
      contactEmail: input.contactEmail,
      appliedDate: input.appliedDate,
      followUpDelayDays: input.followUpDelayDays,
      followUpMessage: input.followUpMessage,
      maxFollowUps: input.maxFollowUps,
      notes: input.notes ?? "",
      status: "pending",
      stage: "applied",
      resumeRunId: input.resumeRunId ?? null,
      followUpCount: 0,
    })
    .returning();
  return inserted[0];
}

export type UpdateApplicationInput = Partial<{
  company: string;
  role: string;
  contactEmail: string;
  appliedDate: string;
  followUpDelayDays: number;
  followUpMessage: string;
  maxFollowUps: number;
  notes: string;
  status: "pending" | "sent" | "responded" | "no_response";
  stage: "applied" | "screening" | "interview" | "offer" | "rejected";
  responseDate: Date | null;
  followUpCount: number;
}>;

export async function updateApplication(id: number, patch: UpdateApplicationInput) {
  const updated = await db.update(applications).set(patch).where(eq(applications.id, id)).returning();
  return updated[0] ?? null;
}

export async function deleteApplication(id: number) {
  await db.delete(applications).where(eq(applications.id, id));
}

export async function listFollowUpLogs(applicationId: number) {
  return db
    .select()
    .from(followUpLogs)
    .where(eq(followUpLogs.applicationId, applicationId))
    .orderBy(desc(followUpLogs.sentAt));
}

// ---------------- Follow-up scheduler run ----------------

export async function runFollowUpCheck(profile: Profile) {
  const apps = await listApplications();
  const now = new Date();
  const summary = {
    checked: apps.length,
    emailsSent: 0,
    markedNoResponse: 0,
    details: [] as string[],
  };

  for (const app of apps) {
    const decision = decideFollowUp(
      {
        status: app.status,
        appliedDate: app.appliedDate,
        followUpDelayDays: app.followUpDelayDays,
        followUpCount: app.followUpCount,
        maxFollowUps: app.maxFollowUps,
        lastFollowUp: app.lastFollowUp ? app.lastFollowUp.toISOString() : null,
      },
      now,
    );

    if (decision === "send") {
      const template = app.followUpMessage?.trim() ? app.followUpMessage : undefined;
      const { DEFAULT_FOLLOWUP_TEMPLATE } = await import("@/lib/agents/followupTemplate");
      const message = renderFollowUpMessage(template ?? DEFAULT_FOLLOWUP_TEMPLATE, {
        company: app.company,
        role: app.role,
        appliedDate: app.appliedDate,
        profile,
      });
      await db.insert(followUpLogs).values({ applicationId: app.id, message, channel: "email" });
      await updateApplication(app.id, {
        status: "sent",
        followUpCount: app.followUpCount + 1,
      });
      await db.update(applications).set({ lastFollowUp: now }).where(eq(applications.id, app.id));
      summary.emailsSent += 1;
      summary.details.push(`Sent follow-up #${app.followUpCount + 1} to ${app.company} for ${app.role}`);
    } else if (decision === "mark_no_response") {
      await updateApplication(app.id, { status: "no_response" });
      summary.markedNoResponse += 1;
      summary.details.push(`Marked ${app.company} (${app.role}) as no_response after ${app.maxFollowUps} follow-ups`);
    }
  }

  return summary;
}

// ---------------- Resume runs ----------------

export async function saveResumeRun(result: ResumeAgentResult) {
  const inserted = await db
    .insert(resumeRuns)
    .values({
      companyName: result.companyName,
      roleTitle: result.roleTitle,
      jobDescription: result.jobDescription,
      jdRequirements: result.jdRequirements,
      matchedEvidence: result.matchedEvidence,
      resumeText: result.resumeText,
      atsScore: result.atsScore,
      atsMissingKeywords: result.atsMissingKeywords,
      factualIssues: result.factualIssues,
      factualScore: result.factualScore,
      revisionCount: result.revisionCount,
      changeReport: result.changeReport,
      auditTrail: result.auditTrail,
      finalStatus: result.finalStatus,
      coverLetter: result.coverLetter,
      interviewQuestions: result.interviewQuestions,
      matchRangeLow: result.matchRange[0],
      matchRangeHigh: result.matchRange[1],
      llmEnhanced: result.llmEnhanced,
      jobContext: result.jobContext,
      jobIntelligence: result.jobIntelligence,
    })
    .returning();
  return inserted[0];
}

// ---------------- Analytics ----------------

export async function getAnalytics() {
  const apps = await listApplications();
  const runs = await listResumeRuns();

  const byStage: Record<string, number> = { applied: 0, screening: 0, interview: 0, offer: 0, rejected: 0 };
  const byStatus: Record<string, number> = { pending: 0, sent: 0, responded: 0, no_response: 0 };
  let totalFollowUps = 0;
  let responseDays: number[] = [];

  for (const a of apps) {
    byStage[a.stage] = (byStage[a.stage] ?? 0) + 1;
    byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    totalFollowUps += a.followUpCount;
    if (a.responseDate) {
      const days = Math.max(0, Math.round((a.responseDate.getTime() - new Date(a.appliedDate).getTime()) / 86400000));
      responseDays.push(days);
    }
  }
  responseDays = responseDays.filter((d) => Number.isFinite(d));

  const avgAts = runs.length ? runs.reduce((s, r) => s + r.atsScore, 0) / runs.length : 0;
  const approvedRuns = runs.filter((r) => r.finalStatus === "approved").length;
  const overdue = apps.filter((a) => {
    if (a.status !== "pending") return false;
    const days = Math.floor((Date.now() - new Date(a.appliedDate).getTime()) / 86400000);
    return days >= a.followUpDelayDays;
  }).length;

  return {
    totalApplications: apps.length,
    byStage,
    byStatus,
    responseRate: apps.length ? Math.round((byStatus.responded / apps.length) * 100) : 0,
    avgResponseDays: responseDays.length ? Math.round(responseDays.reduce((a, b) => a + b, 0) / responseDays.length) : null,
    totalFollowUps,
    overdueFollowUps: overdue,
    totalResumeRuns: runs.length,
    avgAtsScore: Math.round(avgAts * 100),
    approvedRuns,
    recentRuns: runs.slice(0, 5).map((r) => ({
      id: r.id,
      companyName: r.companyName,
      roleTitle: r.roleTitle,
      atsScore: r.atsScore,
      finalStatus: r.finalStatus,
      createdAt: r.createdAt,
    })),
  };
}

export async function listResumeRuns() {
  return db.select().from(resumeRuns).orderBy(desc(resumeRuns.createdAt));
}

export async function getResumeRun(id: number) {
  const rows = await db.select().from(resumeRuns).where(eq(resumeRuns.id, id)).limit(1);
  return rows[0] ?? null;
}

// ---------------- Workspaces / Multi-User Accounts ----------------

export async function listWorkspaces(): Promise<Workspace[]> {
  const rows = await db.select().from(workspaces).orderBy(desc(workspaces.isDefault), desc(workspaces.updatedAt));
  if (rows.length === 0) {
    const created = await db
      .insert(workspaces)
      .values({
        slug: "default",
        name: "Abhinav Mishra",
        email: "abhinav.mishra@example.com",
        targetRole: "AI/ML Engineer",
        careerField: "engineering-tech",
        isDefault: true,
      })
      .returning();
    return created.map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      email: r.email,
      targetRole: r.targetRole,
      careerField: r.careerField,
      avatarUrl: r.avatarUrl,
      isDefault: r.isDefault,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  }
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: r.name,
    email: r.email,
    targetRole: r.targetRole,
    careerField: r.careerField,
    avatarUrl: r.avatarUrl,
    isDefault: r.isDefault,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function createWorkspace(input: {
  name: string;
  email?: string;
  targetRole?: string;
  careerField?: string;
}): Promise<Workspace> {
  const slug = `${input.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;
  const inserted = await db
    .insert(workspaces)
    .values({
      slug,
      name: input.name,
      email: input.email || "",
      targetRole: input.targetRole || "",
      careerField: input.careerField || "engineering-tech",
      isDefault: false,
    })
    .returning();
  const r = inserted[0];
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    email: r.email,
    targetRole: r.targetRole,
    careerField: r.careerField,
    avatarUrl: r.avatarUrl,
    isDefault: r.isDefault,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function deleteWorkspace(id: number) {
  await db.delete(workspaces).where(eq(workspaces.id, id));
}

// ---------------- Mock Interviews ----------------

export async function listMockInterviews(): Promise<MockInterviewReport[]> {
  const rows = await db.select().from(mockInterviews).orderBy(desc(mockInterviews.createdAt));
  return rows.map((r) => ({
    id: r.id,
    roleTitle: r.roleTitle,
    companyName: r.companyName,
    jobDescription: r.jobDescription,
    overallScore: r.overallScore,
    readinessGrade: r.readinessGrade as MockInterviewReport["readinessGrade"],
    hiringDecision: r.hiringDecision as MockInterviewReport["hiringDecision"],
    summaryReport: r.summaryReport,
    questions: r.questions as MockQuestion[],
    status: r.status as MockInterviewReport["status"],
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getMockInterview(id: number): Promise<MockInterviewReport | null> {
  const rows = await db.select().from(mockInterviews).where(eq(mockInterviews.id, id)).limit(1);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.id,
    roleTitle: r.roleTitle,
    companyName: r.companyName,
    jobDescription: r.jobDescription,
    overallScore: r.overallScore,
    readinessGrade: r.readinessGrade as MockInterviewReport["readinessGrade"],
    hiringDecision: r.hiringDecision as MockInterviewReport["hiringDecision"],
    summaryReport: r.summaryReport,
    questions: r.questions as MockQuestion[],
    status: r.status as MockInterviewReport["status"],
    createdAt: r.createdAt.toISOString(),
  };
}

export async function saveMockInterview(report: MockInterviewReport): Promise<MockInterviewReport> {
  if (report.id) {
    const updated = await db
      .update(mockInterviews)
      .set({
        overallScore: report.overallScore,
        readinessGrade: report.readinessGrade,
        hiringDecision: report.hiringDecision,
        summaryReport: report.summaryReport,
        questions: report.questions,
        status: report.status,
      })
      .where(eq(mockInterviews.id, report.id))
      .returning();
    const r = updated[0];
    return { ...report, id: r.id };
  }

  const inserted = await db
    .insert(mockInterviews)
    .values({
      roleTitle: report.roleTitle,
      companyName: report.companyName,
      jobDescription: report.jobDescription || "",
      overallScore: report.overallScore,
      readinessGrade: report.readinessGrade,
      hiringDecision: report.hiringDecision,
      summaryReport: report.summaryReport,
      questions: report.questions,
      status: report.status,
    })
    .returning();
  const r = inserted[0];
  return { ...report, id: r.id, createdAt: r.createdAt.toISOString() };
}

// ---------------- Company Intelligence ----------------

export async function getCompanyBrief(name: string): Promise<CompanyIntelligence | null> {
  const rows = await db
    .select()
    .from(companyBriefs)
    .where(eq(companyBriefs.companyName, name.trim()))
    .limit(1);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.id,
    companyName: r.companyName,
    industry: r.industry,
    website: r.website,
    headquarters: r.headquarters,
    sizeStage: r.sizeStage,
    techStack: r.techStack,
    businessModel: r.businessModel,
    recentDevelopments: r.recentDevelopments,
    cultureSignals: r.cultureSignals,
    hiringVelocity: r.hiringVelocity as CompanyIntelligence["hiringVelocity"],
    redFlags: r.redFlags,
    whyUsPitch: r.whyUsPitch,
    smartQuestions: r.smartQuestions,
  };
}

export async function saveCompanyBrief(intel: CompanyIntelligence): Promise<CompanyIntelligence> {
  const inserted = await db
    .insert(companyBriefs)
    .values({
      companyName: intel.companyName,
      industry: intel.industry,
      website: intel.website,
      headquarters: intel.headquarters,
      sizeStage: intel.sizeStage,
      techStack: intel.techStack,
      businessModel: intel.businessModel,
      recentDevelopments: intel.recentDevelopments,
      cultureSignals: intel.cultureSignals,
      hiringVelocity: intel.hiringVelocity,
      redFlags: intel.redFlags,
      whyUsPitch: intel.whyUsPitch,
      smartQuestions: intel.smartQuestions,
    })
    .onConflictDoUpdate({
      target: companyBriefs.companyName,
      set: {
        industry: intel.industry,
        techStack: intel.techStack,
        recentDevelopments: intel.recentDevelopments,
        whyUsPitch: intel.whyUsPitch,
        smartQuestions: intel.smartQuestions,
      },
    })
    .returning();
  return { ...intel, id: inserted[0].id };
}

// ---------------- LinkedIn Optimizations ----------------

export async function getLinkedInOptimization(role: string): Promise<LinkedInPackage | null> {
  const rows = await db
    .select()
    .from(linkedInOptimizations)
    .where(eq(linkedInOptimizations.roleTarget, role.trim()))
    .limit(1);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.id,
    roleTarget: r.roleTarget,
    seoScore: r.seoScore,
    headlines: r.headlines,
    aboutNarratives: r.aboutNarratives,
    coreCompetencies: r.coreCompetencies,
    featuredProjectHooks: r.featuredProjectHooks,
    outreachTemplates: r.outreachTemplates,
  };
}

export async function saveLinkedInOptimization(pkg: LinkedInPackage): Promise<LinkedInPackage> {
  const inserted = await db
    .insert(linkedInOptimizations)
    .values({
      roleTarget: pkg.roleTarget,
      seoScore: pkg.seoScore,
      headlines: pkg.headlines,
      aboutNarratives: pkg.aboutNarratives,
      coreCompetencies: pkg.coreCompetencies,
      featuredProjectHooks: pkg.featuredProjectHooks,
      outreachTemplates: pkg.outreachTemplates,
    })
    .returning();
  return { ...pkg, id: inserted[0].id };
}

// ---------------- Coaching Plans & Active Goals ----------------

export async function getOrCreateCoachingPlan(): Promise<CoachingPlanData> {
  const rows = await db.select().from(coachingPlans).orderBy(desc(coachingPlans.id)).limit(1);
  if (rows[0]) {
    const r = rows[0];
    return {
      id: r.id,
      weekNumber: r.weekNumber,
      weeklyGoalApps: r.weeklyGoalApps,
      weeklyGoalInterviews: r.weeklyGoalInterviews,
      weeklyGoalFollowups: r.weeklyGoalFollowups,
      completedApps: r.completedApps,
      completedInterviews: r.completedInterviews,
      completedFollowups: r.completedFollowups,
      currentStreakDays: r.currentStreakDays,
      focusRole: r.focusRole,
      focusSkillToLearn: r.focusSkillToLearn,
      mondayPlanSummary: r.mondayPlanSummary,
      fridayReviewNotes: r.fridayReviewNotes,
      actionChecklist: r.actionChecklist,
      updatedAt: r.updatedAt.toISOString(),
    };
  }

  const initialTasks = [
    { id: "1", title: "Apply to 3 high-fit roles with tailored resumes", category: "application" as const, dueDate: "Wed", completed: false },
    { id: "2", title: "Complete 1 Mock Interview session on STAR answers", category: "interview" as const, dueDate: "Thu", completed: false },
    { id: "3", title: "Send follow-up on overdue applications", category: "networking" as const, dueDate: "Fri", completed: false },
    { id: "4", title: "Study top missing skill & add proof to profile", category: "upskilling" as const, dueDate: "Sat", completed: false },
  ];

  const created = await db
    .insert(coachingPlans)
    .values({
      weekNumber: 1,
      weeklyGoalApps: 8,
      weeklyGoalInterviews: 2,
      weeklyGoalFollowups: 3,
      completedApps: 2,
      completedInterviews: 1,
      completedFollowups: 1,
      currentStreakDays: 3,
      focusRole: "Primary Target Role",
      focusSkillToLearn: "System Reliability & Metrics",
      mondayPlanSummary: "Prioritize 5 high-relevance applications with tailored ATS resumes and rehearse 1 Mock Interview loop.",
      fridayReviewNotes: "Funnel check: Focus on quantified impact in bullets to raise response rate.",
      actionChecklist: initialTasks,
    })
    .returning();
  const r = created[0];
  return {
    id: r.id,
    weekNumber: r.weekNumber,
    weeklyGoalApps: r.weeklyGoalApps,
    weeklyGoalInterviews: r.weeklyGoalInterviews,
    weeklyGoalFollowups: r.weeklyGoalFollowups,
    completedApps: r.completedApps,
    completedInterviews: r.completedInterviews,
    completedFollowups: r.completedFollowups,
    currentStreakDays: r.currentStreakDays,
    focusRole: r.focusRole,
    focusSkillToLearn: r.focusSkillToLearn,
    mondayPlanSummary: r.mondayPlanSummary,
    fridayReviewNotes: r.fridayReviewNotes,
    actionChecklist: r.actionChecklist,
    updatedAt: r.updatedAt.toISOString(),
  };
}

export async function updateCoachingPlan(patch: Partial<CoachingPlanData>): Promise<CoachingPlanData> {
  const current = await getOrCreateCoachingPlan();
  const updated = await db
    .update(coachingPlans)
    .set({
      weeklyGoalApps: patch.weeklyGoalApps ?? current.weeklyGoalApps,
      weeklyGoalInterviews: patch.weeklyGoalInterviews ?? current.weeklyGoalInterviews,
      weeklyGoalFollowups: patch.weeklyGoalFollowups ?? current.weeklyGoalFollowups,
      completedApps: patch.completedApps ?? current.completedApps,
      completedInterviews: patch.completedInterviews ?? current.completedInterviews,
      completedFollowups: patch.completedFollowups ?? current.completedFollowups,
      currentStreakDays: patch.currentStreakDays ?? current.currentStreakDays,
      focusRole: patch.focusRole ?? current.focusRole,
      focusSkillToLearn: patch.focusSkillToLearn ?? current.focusSkillToLearn,
      mondayPlanSummary: patch.mondayPlanSummary ?? current.mondayPlanSummary,
      fridayReviewNotes: patch.fridayReviewNotes ?? current.fridayReviewNotes,
      actionChecklist: patch.actionChecklist ?? current.actionChecklist,
      updatedAt: new Date(),
    })
    .where(eq(coachingPlans.id, current.id!))
    .returning();
  const r = updated[0];
  return {
    id: r.id,
    weekNumber: r.weekNumber,
    weeklyGoalApps: r.weeklyGoalApps,
    weeklyGoalInterviews: r.weeklyGoalInterviews,
    weeklyGoalFollowups: r.weeklyGoalFollowups,
    completedApps: r.completedApps,
    completedInterviews: r.completedInterviews,
    completedFollowups: r.completedFollowups,
    currentStreakDays: r.currentStreakDays,
    focusRole: r.focusRole,
    focusSkillToLearn: r.focusSkillToLearn,
    mondayPlanSummary: r.mondayPlanSummary,
    fridayReviewNotes: r.fridayReviewNotes,
    actionChecklist: r.actionChecklist,
    updatedAt: r.updatedAt.toISOString(),
  };
}

// ---------------- Job Alerts ----------------

export async function listJobAlerts(): Promise<JobAlertItem[]> {
  const rows = await db.select().from(jobAlerts).orderBy(desc(jobAlerts.createdAt));
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    query: r.query,
    careerField: r.careerField,
    remoteOnly: r.remoteOnly,
    minFitScore: r.minFitScore,
    frequency: r.frequency as JobAlertItem["frequency"],
    active: r.active,
    lastMatchedCount: r.lastMatchedCount,
    lastCheckedAt: r.lastCheckedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function createJobAlert(input: {
  title: string;
  query: string;
  careerField?: string;
  remoteOnly?: boolean;
  minFitScore?: number;
  frequency?: "daily" | "weekly" | "instant";
}): Promise<JobAlertItem> {
  const inserted = await db
    .insert(jobAlerts)
    .values({
      title: input.title,
      query: input.query,
      careerField: input.careerField || "",
      remoteOnly: input.remoteOnly ?? false,
      minFitScore: input.minFitScore ?? 60,
      frequency: input.frequency || "daily",
      active: true,
    })
    .returning();
  const r = inserted[0];
  return {
    id: r.id,
    title: r.title,
    query: r.query,
    careerField: r.careerField,
    remoteOnly: r.remoteOnly,
    minFitScore: r.minFitScore,
    frequency: r.frequency as JobAlertItem["frequency"],
    active: r.active,
    lastMatchedCount: r.lastMatchedCount,
    lastCheckedAt: r.lastCheckedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  };
}

export async function deleteJobAlert(id: number) {
  await db.delete(jobAlerts).where(eq(jobAlerts.id, id));
}

export async function toggleJobAlert(id: number, active: boolean) {
  await db.update(jobAlerts).set({ active }).where(eq(jobAlerts.id, id));
}

// ---------------- Customer Feedback & Insights ----------------

export async function listCustomerFeedback(): Promise<CustomerFeedbackItem[]> {
  const rows = await db.select().from(customerFeedback).orderBy(desc(customerFeedback.createdAt));
  if (rows.length === 0) {
    const initialSeeds = [
      {
        userName: "Dr. Sunita Patel",
        userRole: "Principal QC Scientist (M.Pharm)",
        careerField: "Pharmacy & Life Sciences",
        rating: 5,
        whatUnderstood: "AutoApply is not just a resume tool; it's an end-to-end digital job consultant. I loved that it refused to show me tech jobs and immediately found Clinical Trial Manager & Regulatory roles matching my HPLC & GMP skills.",
        whatLacking: "Would love automated PDF export directly from the Mock Interview report, plus more direct hospital portals in India.",
        favoriteFeature: "Role Recommender & Resume Agent",
      },
      {
        userName: "Ananya Iyer",
        userRole: "AI / ML Engineer",
        careerField: "Engineering & Technology",
        rating: 5,
        whatUnderstood: "The fact-checker and ATS revision loop are genius. It caught unsupported skills in my draft and revised it automatically without hallucinating.",
        whatLacking: "Add more live company intelligence alerts when a high-fit job is posted on Greenhouse.",
        favoriteFeature: "Mock Interview Simulator & ATS Loop",
      },
      {
        userName: "Rohit Verma",
        userRole: "Management Consultant (MBA)",
        careerField: "Management & Business",
        rating: 5,
        whatUnderstood: "Salary Coach gave me real USD and INR market bands from actual postings, plus the exact script to quote in negotiations.",
        whatLacking: "Add a 1-click export of the full Weekly Coaching action plan to Google Calendar.",
        favoriteFeature: "Salary Coach & Weekly Coaching Plan",
      },
    ];

    const inserted = await db.insert(customerFeedback).values(initialSeeds).returning();
    return inserted.map((r) => ({
      id: r.id,
      userName: r.userName,
      userRole: r.userRole,
      careerField: r.careerField,
      rating: r.rating,
      whatUnderstood: r.whatUnderstood,
      whatLacking: r.whatLacking,
      favoriteFeature: r.favoriteFeature,
      helpfulScore: r.helpfulScore,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  return rows.map((r) => ({
    id: r.id,
    userName: r.userName,
    userRole: r.userRole,
    careerField: r.careerField,
    rating: r.rating,
    whatUnderstood: r.whatUnderstood,
    whatLacking: r.whatLacking,
    favoriteFeature: r.favoriteFeature,
    helpfulScore: r.helpfulScore,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function submitCustomerFeedback(input: {
  userName: string;
  userRole?: string;
  careerField?: string;
  rating: number;
  whatUnderstood: string;
  whatLacking?: string;
  favoriteFeature?: string;
}): Promise<CustomerFeedbackItem> {
  const inserted = await db
    .insert(customerFeedback)
    .values({
      userName: input.userName.trim() || "Anonymous Job Seeker",
      userRole: input.userRole?.trim() || "Job Seeker",
      careerField: input.careerField?.trim() || "General",
      rating: Math.max(1, Math.min(5, Number(input.rating) || 5)),
      whatUnderstood: input.whatUnderstood.trim(),
      whatLacking: input.whatLacking?.trim() || "None reported",
      favoriteFeature: input.favoriteFeature?.trim() || "Resume Agent",
      helpfulScore: 1,
    })
    .returning();

  const r = inserted[0];
  return {
    id: r.id,
    userName: r.userName,
    userRole: r.userRole,
    careerField: r.careerField,
    rating: r.rating,
    whatUnderstood: r.whatUnderstood,
    whatLacking: r.whatLacking,
    favoriteFeature: r.favoriteFeature,
    helpfulScore: r.helpfulScore,
    createdAt: r.createdAt.toISOString(),
  };
}


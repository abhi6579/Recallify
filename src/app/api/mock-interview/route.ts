import { getMockInterview, getOrCreateProfile, listMockInterviews, saveMockInterview } from "@/db/queries";
import { compileInterviewReport, evaluateMockAnswer, generateMockQuestions } from "@/lib/agents/mockInterview";
import type { MockQuestion, Profile } from "@/lib/agents/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const reports = await listMockInterviews();
  return Response.json({ reports });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const roleTitle: string = body?.roleTitle?.trim() || "Target Role";
  const companyName: string = body?.companyName?.trim() || "";
  const jobDescription: string = body?.jobDescription || "";
  const profile: Profile = body?.profile ?? (await getOrCreateProfile());

  const questions = generateMockQuestions(roleTitle, profile, companyName, jobDescription);
  const initialReport = compileInterviewReport(roleTitle, companyName, questions);
  initialReport.jobDescription = jobDescription;

  const saved = await saveMockInterview(initialReport);
  return Response.json({ session: saved }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const sessionId: number = Number(body?.sessionId);
  const questionId: number = Number(body?.questionId);
  const answerText: string = typeof body?.answerText === "string" ? body.answerText.trim() : "";
  const profile: Profile = body?.profile ?? (await getOrCreateProfile());

  if (!sessionId || !questionId) {
    return Response.json({ error: "sessionId and questionId are required" }, { status: 400 });
  }

  const existing = await getMockInterview(sessionId);
  if (!existing) return Response.json({ error: "Session not found" }, { status: 404 });

  const questionIndex = existing.questions.findIndex((q) => q.id === questionId);
  if (questionIndex === -1) return Response.json({ error: "Question not found" }, { status: 404 });

  const question = existing.questions[questionIndex];
  const feedback = await evaluateMockAnswer(question, answerText, profile);

  const updatedQuestions: MockQuestion[] = [...existing.questions];
  updatedQuestions[questionIndex] = {
    ...question,
    answer: answerText,
    feedback,
  };

  const recompiled = compileInterviewReport(existing.roleTitle, existing.companyName, updatedQuestions);
  recompiled.id = existing.id;
  recompiled.jobDescription = existing.jobDescription;

  const updated = await saveMockInterview(recompiled);
  return Response.json({ session: updated, feedback });
}

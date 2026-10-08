import { getAnalytics, getOrCreateProfile, getRoleTemplates } from "@/db/queries";
import { alexHandle } from "@/lib/agents/alex";
import type { Profile } from "@/lib/agents/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID().slice(0, 8);
  try {
    const body = await request.json().catch(() => ({}));
    const message: string = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) return Response.json({ error: "message is required", requestId }, { status: 400 });

    const profile: Profile = body?.profile ?? (await getOrCreateProfile());
    const roles = await getRoleTemplates();
    const analytics = await getAnalytics();

    const reply = await alexHandle(message, {
      profile,
      roles,
      analytics: {
        totalApplications: analytics.totalApplications,
        byStatus: analytics.byStatus,
        byStage: analytics.byStage,
        avgAtsScore: analytics.totalResumeRuns ? analytics.avgAtsScore / 100 : null,
        totalResumeRuns: analytics.totalResumeRuns,
      },
    });

    return Response.json({ ...reply, requestId });
  } catch (error) {
    console.error(`[alex:${requestId}]`, error);
    return Response.json(
      { error: "Alex hit a snag. Please retry.", requestId },
      { status: 500 },
    );
  }
}

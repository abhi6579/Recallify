import { createApplication, listApplications } from "@/db/queries";
import { DEFAULT_FOLLOWUP_TEMPLATE } from "@/lib/agents/followupTemplate";

export const dynamic = "force-dynamic";

export async function GET() {
  const apps = await listApplications();
  return Response.json({ applications: apps });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { company, role, contactEmail, appliedDate } = body ?? {};

  if (!company || !role || !appliedDate) {
    return Response.json(
      { error: "company, role, and appliedDate are required" },
      { status: 400 },
    );
  }

  const created = await createApplication({
    company,
    role,
    contactEmail: contactEmail ?? "",
    appliedDate,
    followUpDelayDays: Number(body.followUpDelayDays ?? 7),
    followUpMessage: body.followUpMessage ?? DEFAULT_FOLLOWUP_TEMPLATE,
    maxFollowUps: Number(body.maxFollowUps ?? 3),
    notes: body.notes ?? "",
    resumeRunId: body.resumeRunId ? Number(body.resumeRunId) : null,
  });

  return Response.json({ application: created }, { status: 201 });
}

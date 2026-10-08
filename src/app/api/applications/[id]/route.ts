import { deleteApplication, getApplication, listFollowUpLogs, updateApplication } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  const app = await getApplication(numericId);
  if (!app) return Response.json({ error: "Not found" }, { status: 404 });
  const logs = await listFollowUpLogs(numericId);
  return Response.json({ application: app, logs });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  const body = await request.json();

  const patch: Record<string, unknown> = {};
  for (const key of [
    "company",
    "role",
    "contactEmail",
    "appliedDate",
    "followUpDelayDays",
    "followUpMessage",
    "maxFollowUps",
    "notes",
    "status",
    "stage",
    "resumeRunId",
    "followUpCount",
  ]) {
    if (body[key] !== undefined) patch[key] = body[key];
  }

  if (body.markResponded) {
    patch.status = "responded";
    patch.responseDate = new Date();
  }

  const updated = await updateApplication(numericId, patch);
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ application: updated });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteApplication(Number(id));
  return Response.json({ ok: true });
}

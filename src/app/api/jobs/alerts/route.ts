import { createJobAlert, deleteJobAlert, listJobAlerts, toggleJobAlert } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const alerts = await listJobAlerts();
  return Response.json({ alerts });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  if (!body?.title || !body?.query) {
    return Response.json({ error: "title and query are required" }, { status: 400 });
  }

  const alert = await createJobAlert({
    title: body.title.trim(),
    query: body.query.trim(),
    careerField: body.careerField || "",
    remoteOnly: Boolean(body.remoteOnly),
    minFitScore: Number(body.minFitScore || 60),
    frequency: body.frequency || "daily",
  });

  return Response.json({ alert }, { status: 201 });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const id = Number(body?.id);
  const active = Boolean(body?.active);

  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  await toggleJobAlert(id, active);
  return Response.json({ ok: true });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  if (!id) return Response.json({ error: "id is required" }, { status: 400 });
  await deleteJobAlert(id);
  return Response.json({ ok: true });
}

import { getResumeRun } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) {
    return Response.json({ error: "Invalid id" }, { status: 400 });
  }
  const run = await getResumeRun(numericId);
  if (!run) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ run });
}

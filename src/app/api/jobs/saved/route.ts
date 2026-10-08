import { listSavedJobs, saveJob } from "@/db/queries";
import type { ScoredJob } from "@/lib/agents/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const saved = await listSavedJobs();
  return Response.json({ saved });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body?.id || !body?.title || !body?.applyUrl) {
    return Response.json({ error: "id, title and applyUrl are required" }, { status: 400 });
  }
  const saved = await saveJob(body as ScoredJob & { note?: string });
  return Response.json({ saved }, { status: 201 });
}

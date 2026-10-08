import { listResumeRuns } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const runs = await listResumeRuns();
  return Response.json({ runs });
}

import { getOrCreateCoachingPlan, updateCoachingPlan } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const plan = await getOrCreateCoachingPlan();
  return Response.json({ plan });
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => ({}));
  const updated = await updateCoachingPlan(body);
  return Response.json({ plan: updated });
}

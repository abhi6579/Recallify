import { getRoleTemplates } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const roles = await getRoleTemplates();
  return Response.json({ roles });
}

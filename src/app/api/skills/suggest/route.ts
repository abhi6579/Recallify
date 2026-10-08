import { suggestSkills } from "@/lib/agents/skillCatalog";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const fields = (searchParams.get("fields") ?? "").split(",").map((f) => f.trim()).filter(Boolean);
  const exclude = (searchParams.get("exclude") ?? "").split(",").map((f) => f.trim()).filter(Boolean);
  const limit = Math.min(Number(searchParams.get("limit") ?? 10) || 10, 25);

  const suggestions = suggestSkills({ query, fields, exclude, limit });
  return Response.json({ suggestions });
}

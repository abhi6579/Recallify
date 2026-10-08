import { deleteSavedArticle } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numericId = Number(id);
  if (Number.isNaN(numericId)) return Response.json({ error: "Invalid id" }, { status: 400 });
  await deleteSavedArticle(numericId);
  return Response.json({ ok: true });
}

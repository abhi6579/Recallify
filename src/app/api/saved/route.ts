import { listSavedArticles, saveArticle } from "@/db/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  const saved = await listSavedArticles();
  return Response.json({ saved });
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!body?.id || !body?.title || !body?.url) {
    return Response.json({ error: "id, title and url are required" }, { status: 400 });
  }
  const saved = await saveArticle({
    id: String(body.id),
    title: String(body.title),
    url: String(body.url),
    source: body.source ?? "",
    topic: body.topic ?? "",
    summary: body.summary ?? "",
    publishedAt: body.publishedAt ?? null,
    note: body.note ?? "",
  });
  return Response.json({ saved }, { status: 201 });
}

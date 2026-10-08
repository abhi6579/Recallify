import { getCachedNews, setCachedNews } from "@/db/queries";
import { fetchTopicNews, TOPICS } from "@/lib/news";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic") ?? TOPICS[0].key;
  const refresh = searchParams.get("refresh") === "1";

  if (!refresh) {
    const cached = await getCachedNews(topic);
    if (cached && cached.length > 0) {
      return Response.json({ topic, articles: cached, cached: true });
    }
  }

  const { articles, live } = await fetchTopicNews(topic);
  if (live && articles.length > 0) await setCachedNews(topic, articles);

  return Response.json({ topic, articles, cached: false, live });
}

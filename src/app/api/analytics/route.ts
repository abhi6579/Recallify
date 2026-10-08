import { getAnalytics } from "@/db/queries";
import { isLlmAvailable, getLlmConfig } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function GET() {
  const analytics = await getAnalytics();
  const llm = getLlmConfig();
  return Response.json({
    ...analytics,
    llm: { available: isLlmAvailable(), provider: llm?.provider ?? null, model: llm?.model ?? null },
  });
}

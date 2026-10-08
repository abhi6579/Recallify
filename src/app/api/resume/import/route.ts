import { parseResumeText } from "@/lib/agents/resumeParser";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const rawText: string = typeof body?.rawText === "string" ? body.rawText.trim() : "";

  if (rawText.length < 30) {
    return Response.json(
      { error: "Please provide resume content with at least 30 characters." },
      { status: 400 }
    );
  }

  const parsed = parseResumeText(rawText);
  return Response.json({ parsed });
}

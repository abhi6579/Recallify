import { getOrCreateProfile } from "@/db/queries";
import { dispatchEmail, isRealEmailConfigured } from "@/lib/agents/emailService";
import type { Profile } from "@/lib/agents/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = isRealEmailConfigured();
  return Response.json({ config });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const to: string = body?.to?.trim() || "";
  const subject: string = body?.subject?.trim() || "";
  const message: string = body?.message?.trim() || "";
  const testMode: boolean = body?.testMode === true;
  const profile: Profile = body?.profile ?? (await getOrCreateProfile());

  if (!to || !subject || !message) {
    return Response.json(
      { error: "to, subject, and message are required" },
      { status: 400 }
    );
  }

  const result = await dispatchEmail({
    to,
    subject,
    body: message,
    senderProfile: profile,
    testMode,
  });

  return Response.json({ result });
}

import { sessionCookie, signInUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return Response.json({ error: "Email and password are required." }, { status: 400 });
    }

    const { user, token } = await signInUser({
      email: String(email).trim(),
      password: String(password),
    });

    const headers = new Headers();
    headers.append("Set-Cookie", sessionCookie(token, request));

    return Response.json({ user }, { status: 200, headers });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Invalid email or password." },
      { status: 401 }
    );
  }
}

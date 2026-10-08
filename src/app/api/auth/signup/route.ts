import { sessionCookie, signUpUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { name, email, password, targetRole, careerField } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return Response.json({ error: "Please provide your full name." }, { status: 400 });
    }
    if (!email || typeof email !== "string" || !/@/.test(email)) {
      return Response.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return Response.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    const { user, token } = await signUpUser({
      name: name.trim(),
      email: email.trim(),
      password,
      targetRole: targetRole?.trim(),
      careerField: careerField?.trim(),
    });

    const headers = new Headers();
    headers.append("Set-Cookie", sessionCookie(token, request));

    return Response.json({ user }, { status: 201, headers });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Signup failed. Please try again." },
      { status: 400 }
    );
  }
}

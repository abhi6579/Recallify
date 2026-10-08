import { getOrCreateProfile, saveProfile } from "@/db/queries";

export const dynamic = "force-dynamic";

/**
 * Gap challenge (human-in-the-loop). The user contests a flagged gap by
 * asserting they have the skill and supplying evidence. We store both the
 * skill and the evidence in the persistent profile memory so future runs
 * (and the fact checker) treat it as grounded.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const skill: string = (body?.skill ?? "").trim();
  const evidence: string = (body?.evidence ?? "").trim();
  if (!skill) return Response.json({ error: "skill is required" }, { status: 400 });
  if (evidence.length < 10) {
    return Response.json({ error: "Please provide at least a sentence of concrete evidence." }, { status: 400 });
  }

  const profile = await getOrCreateProfile();
  const already = profile.skills.some((s) => s.toLowerCase() === skill.toLowerCase());
  const skills = already ? profile.skills : [...profile.skills, skill];

  const projects = [
    ...profile.projects,
    {
      name: `${skill} — self-reported evidence`,
      description: evidence,
      technologies: [skill],
    },
  ];

  const saved = await saveProfile({ ...profile, skills, projects });
  return Response.json({ profile: saved, added: !already });
}

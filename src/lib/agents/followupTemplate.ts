import type { Profile } from "./types";

export const DEFAULT_FOLLOWUP_TEMPLATE = `Subject: Following up on my application for {role} — {name}

Dear {company} Hiring Team,

I hope this email finds you well. I'm following up on my application
for the {role} position, submitted on {applied_date}.

I remain very interested in this opportunity and believe my background
in {key_skill} aligns well with your requirements. I'm available to
start immediately and happy to provide any additional information.

Looking forward to hearing from you.

Sincerely,
{name}
{phone}
{email}
{linkedin}`;

export function renderFollowUpMessage(
  template: string,
  vars: {
    company: string;
    role: string;
    appliedDate: string;
    profile: Profile;
  },
): string {
  const keySkill = vars.profile.skills?.[0] ?? "the required technologies";
  return template
    .replaceAll("{role}", vars.role)
    .replaceAll("{company}", vars.company)
    .replaceAll("{applied_date}", vars.appliedDate)
    .replaceAll("{key_skill}", keySkill)
    .replaceAll("{name}", vars.profile.name ?? "")
    .replaceAll("{phone}", vars.profile.phone ?? "")
    .replaceAll("{email}", vars.profile.email ?? "")
    .replaceAll("{linkedin}", vars.profile.linkedin ?? "");
}

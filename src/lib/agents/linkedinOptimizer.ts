import type { LinkedInPackage, Profile } from "./types";

/**
 * Agent 11: LinkedIn Profile Optimizer.
 * Crafts high-CTR LinkedIn headlines, story-driven About narratives,
 * recruiter algorithm SEO keywords, featured project hooks, and warm outreach templates.
 */

export function optimizeLinkedInProfile(
  roleTarget: string,
  profile: Profile
): LinkedInPackage {
  const target = roleTarget.trim() || profile.skills[0] || "Specialist";
  const name = profile.name || "Candidate";
  const skills = profile.skills || [];
  const top3 = skills.slice(0, 3).join(" | ");
  const project = profile.projects?.[0];
  const experience = profile.experience?.[0];

  // 1. High-CTR Headline Options
  const headlines = [
    `${target} | Building High-Impact Solutions with ${top3} | Open to Opportunities`,
    `${target} • Specializing in ${skills[0] || "Core Tech"} & ${skills[1] || "Execution"} • ${experience ? `Ex-${experience.company}` : "Demonstrated Project Delivery"}`,
    `Helping teams scale through ${skills.slice(0, 2).join(" & ")} | ${target} | ${profile.education[0]?.degree || "Continuous Learner"}`,
  ];

  // 2. Story-driven About Narratives
  const aboutNarratives = [
    {
      title: "Impact-Driven (First-Person Story)",
      content: `I'm a ${target} passionate about turning complex challenges into robust, measurable systems.\n\nThroughout my work, I've specialized in ${skills.slice(0, 5).join(", ")}. ${project ? `Recently, I developed ${project.name}—${project.description.toLowerCase()}.` : ""} ${experience ? `In my role at ${experience.company}, I ${experience.description.toLowerCase()}.` : ""}\n\nWhat drives me is building with precision, learning relentlessly, and collaborating with mission-focused teams.\n\nCore Competencies: ${skills.join(" • ")}\n\nLet's connect: ${profile.email || "Send me a direct message on LinkedIn"}.`,
    },
    {
      title: "Executive & Strategic (Third-Person / Authority)",
      content: `${name} is an accomplished ${target} with hands-on expertise spanning ${skills.slice(0, 4).join(", ")}.\n\nWith a focus on architectural rigor and quantifiable outcomes, ${name.split(" ")[0]} has driven key milestones in ${experience ? experience.company : "production environments"}, delivering reliability improvements and cross-functional momentum.\n\nKey Strengths: ${skills.slice(0, 8).join(" | ")}. Open to collaborative conversations regarding high-impact ${target} initiatives.`,
    },
  ];

  // 3. Featured Project Hooks (ready to paste in LinkedIn Featured section)
  const featuredProjectHooks = (profile.projects || []).map((p) => {
    return `🚀 Built ${p.name}: ${p.description}\n\n🛠️ Stack: ${p.technologies.join(", ")}\n📈 Focus: Reliability, Architecture, Measured Impact\n#${target.replace(/[^a-zA-Z]/g, "")} #${p.technologies[0]?.replace(/[^a-zA-Z]/g, "") || "Technology"}`;
  });

  if (featuredProjectHooks.length === 0) {
    featuredProjectHooks.push(`🚀 Portfolio & Technical Case Studies: Demonstrating production ${top3}.\n#CareerGrowth #${target.replace(/[^a-zA-Z]/g, "")}`);
  }

  // 4. Outreach Message Templates (Recruiter, Hiring Manager, Alumni)
  const outreachTemplates = [
    {
      target: "Recruiter / Talent Partner",
      message: `Hi [Name], I noticed you're leading talent searches for ${target} roles. With hands-on experience across ${top3}, I'm actively exploring high-impact openings. I'd love to connect and share my portfolio if you have active searches in this space!`,
    },
    {
      target: "Hiring Manager / Team Lead",
      message: `Hi [Name], I've been following your team's work on [Specific Initiative]. As a ${target} with background in ${skills.slice(0, 2).join(" and ")}, I admire your engineering rigor. Would love to connect and learn more about how your team approaches [Key Challenge].`,
    },
    {
      target: "Alumni / Warm Connection",
      message: `Hi [Name], fellow alum here! I saw you're currently at [Company] as a [Role]. I'm currently exploring ${target} opportunities and would appreciate any quick perspective on the team's culture and priorities. Hope all is well with you!`,
    },
  ];

  const seoScore = Math.min(98, 75 + Math.min(skills.length * 2, 20) + (profile.projects.length ? 5 : 0));

  return {
    roleTarget: target,
    seoScore,
    headlines,
    aboutNarratives,
    coreCompetencies: skills,
    featuredProjectHooks,
    outreachTemplates,
  };
}

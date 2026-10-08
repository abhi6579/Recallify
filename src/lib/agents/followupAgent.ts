export type FollowUpDecisionInput = {
  status: string;
  appliedDate: string; // ISO date
  followUpDelayDays: number;
  followUpCount: number;
  maxFollowUps: number;
  lastFollowUp: string | null;
};

export type FollowUpDecision = "none" | "send" | "mark_no_response";

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Agent 3 / tool: scheduler decision logic. Pure function so it is easy to
 * unit test independently of the database/email side effects.
 */
export function decideFollowUp(input: FollowUpDecisionInput, now: Date = new Date()): FollowUpDecision {
  if (input.status === "responded" || input.status === "no_response") return "none";

  const applied = new Date(input.appliedDate);
  const daysSinceApplied = daysBetween(applied, now);

  if (input.status === "pending") {
    if (daysSinceApplied >= input.followUpDelayDays) return "send";
    return "none";
  }

  if (input.status === "sent") {
    if (input.followUpCount >= input.maxFollowUps) return "mark_no_response";
    // Space subsequent reminders by the same delay window, measured from the
    // last follow-up that was actually sent.
    const reference = input.lastFollowUp ? new Date(input.lastFollowUp) : applied;
    const daysSinceLast = daysBetween(reference, now);
    if (daysSinceLast >= input.followUpDelayDays) return "send";
    return "none";
  }

  return "none";
}

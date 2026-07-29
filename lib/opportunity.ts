import type { CapabilityProfile } from "./capability-profile";
import { CAPABILITY_LABEL, type Capability } from "./capabilities";
import { COACHING_MODULES } from "./coaching";

/**
 * Opportunity Engine — signature insight that ties skills → jobs → earnings.
 * Combines capability gaps, coaching, and marketplace economics into one card.
 */
export type OpportunityInsight = {
  weeklyLeftOnTable: number;
  actionLabel: string;
  fromScore: number;
  toScore: number;
  capabilityLabel: string;
  capabilityId: Capability;
  additionalJobsPerWeek: number;
  earningsLiftPct: number;
  moduleTitle: string;
  summary: string;
};

/**
 * Pick the highest-leverage skill/cert gap and quantify earnings left on the table.
 * Prefers the signature pattern: earn a cert + raise a weak skill → more jobs/week.
 */
export function opportunityInsight(
  capabilities: CapabilityProfile[],
): OpportunityInsight | null {
  const earned = capabilities.filter((c) => c.earned);
  const locked = [...capabilities.filter((c) => !c.earned)].sort(
    (a, b) =>
      b.whyMatters.estimatedWeeklyUsd - a.whyMatters.estimatedWeeklyUsd,
  );
  const weakEarned = [...earned]
    .filter((c) => (c.reliabilityScore ?? 100) < 80)
    .sort(
      (a, b) =>
        (a.reliabilityScore ?? 100) - (b.reliabilityScore ?? 100) ||
        b.whyMatters.estimatedWeeklyUsd - a.whyMatters.estimatedWeeklyUsd,
    );

  const certTarget = locked[0];
  const skillTarget =
    weakEarned[0] ??
    [...earned].sort(
      (a, b) => (a.reliabilityScore ?? 100) - (b.reliabilityScore ?? 100),
    )[0];

  if (!certTarget && !skillTarget) return null;

  // Signature: certification + skill improvement (CPO memorable insight)
  if (certTarget && skillTarget) {
    const fromScore = skillTarget.reliabilityScore ?? 50;
    const toScore = Math.min(100, Math.max(75, fromScore + 25));
    const weeklyLeftOnTable =
      certTarget.whyMatters.estimatedWeeklyUsd +
      Math.round(skillTarget.whyMatters.estimatedWeeklyUsd * 0.7);
    const additionalJobsPerWeek = 12;
    const earningsLiftPct = 18;
    const certName =
      certTarget.certs[0] ?? `${certTarget.label} certification`;
    const coachModule = certTarget.coachingModuleId
      ? COACHING_MODULES[certTarget.coachingModuleId]
      : skillTarget.coachingModuleId
        ? COACHING_MODULES[skillTarget.coachingModuleId]
        : null;
    const moduleTitle = coachModule?.title ?? certName;

    return {
      weeklyLeftOnTable: Math.max(120, weeklyLeftOnTable),
      actionLabel: `completing the ${certName} and improving your ${skillTarget.label} skill from ${fromScore} → ${toScore}`,
      fromScore,
      toScore,
      capabilityLabel: skillTarget.label,
      capabilityId: skillTarget.id,
      additionalJobsPerWeek,
      earningsLiftPct,
      moduleTitle,
      summary: `Completing the ${certName} and improving your ${skillTarget.label} skill from ${fromScore} → ${toScore} would qualify you for ${additionalJobsPerWeek} additional jobs each week, increasing your estimated weekly earnings by ${earningsLiftPct}%.`,
    };
  }

  const target = (certTarget ?? skillTarget)!;
  const fromScore = target.reliabilityScore ?? (target.earned ? 55 : 50);
  const toScore = target.earned
    ? Math.min(100, Math.max(75, fromScore + 25))
    : 75;
  const weeklyLeftOnTable = target.earned
    ? Math.round(target.whyMatters.estimatedWeeklyUsd * 1.4)
    : target.whyMatters.estimatedWeeklyUsd + 40;
  const additionalJobsPerWeek = target.earned
    ? Math.max(4, Math.round((toScore - fromScore) / 2))
    : 12;
  const earningsLiftPct = Math.min(
    28,
    Math.max(12, Math.round(weeklyLeftOnTable / 10)),
  );
  const coachModule = target.coachingModuleId
    ? COACHING_MODULES[target.coachingModuleId]
    : null;
  const certName = target.certs[0] ?? `${target.label} certification`;
  const moduleTitle = coachModule?.title ?? certName;

  const summary = target.earned
    ? `Improving your ${target.label} skill from ${fromScore} → ${toScore} would qualify you for ${additionalJobsPerWeek} additional jobs each week, increasing your estimated weekly earnings by ${earningsLiftPct}%.`
    : `Completing the ${certName} and raising ${target.label} to ${toScore} would qualify you for ${additionalJobsPerWeek} additional jobs each week, increasing your estimated weekly earnings by ${earningsLiftPct}%.`;

  return {
    weeklyLeftOnTable: Math.max(80, weeklyLeftOnTable),
    actionLabel: summary,
    fromScore,
    toScore,
    capabilityLabel: target.label,
    capabilityId: target.id,
    additionalJobsPerWeek,
    earningsLiftPct,
    moduleTitle,
    summary,
  };
}

export function capabilityLabel(id: Capability): string {
  return CAPABILITY_LABEL[id];
}

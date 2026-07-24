import {
  nextTierName,
  pointsToNextTier,
  score,
  tier,
  type Signals,
  type Tier,
} from "./engine";

/**
 * Illustrative weekly earnings lift by tier unlock.
 * Labeled illustrative everywhere in UI — calibrate with Flex Mixpanel later.
 */
export const TIER_ECONOMICS: Record<
  Tier,
  { weeklyUsd: number; unlockLabel: string; headline: string }
> = {
  Recruit: {
    weeklyUsd: 0,
    unlockLabel: "Building your record",
    headline: "Prove out with 3 completed jobs",
  },
  Shadow: {
    weeklyUsd: 40,
    unlockLabel: "Standard matching",
    headline: "Shadow unlocks standard matching ≈ +$40/week",
  },
  Pro: {
    weeklyUsd: 140,
    unlockLabel: "Priority matching · weekly payout",
    headline: "Pro unlocks priority matching ≈ +$140/week",
  },
  Elite: {
    weeklyUsd: 220,
    unlockLabel: "Top-crew badge · surge access",
    headline: "Elite unlocks surge + VIP first pick ≈ +$220/week",
  },
};

export type StreakState = {
  count: number;
  atRiskHours: number;
  protectCopy: string;
};

/** On-time streak as a protectable object — derived, not hardcoded. */
export function onTimeStreak(s: Signals): StreakState {
  const base = Math.max(
    0,
    Math.round(s.onTimeRate * Math.min(Math.max(s.jobsCompleted, 1), 14)) -
      s.lateCancellations -
      s.noShows * 3,
  );
  const atRisk =
    s.lateCancellations > 0 || s.noShows > 0 || s.onTimeRate < 0.85;
  const atRiskHours = atRisk ? (s.noShows > 0 ? 2 : 6) : 18;
  return {
    count: base,
    atRiskHours,
    protectCopy:
      base <= 0
        ? "Start an on-time streak on your next move"
        : atRisk
          ? `Don't break it — streak at risk in ${atRiskHours}h`
          : `On-time streak · ${base} — keep it alive`,
  };
}

export type TierMoney = {
  next: Tier | null;
  weeklyUsd: number;
  headline: string;
  demotion: string | null;
};

export function tierMoney(s: Signals): TierMoney {
  const scoreValue = score(s);
  const current = tier(scoreValue, s.jobsCompleted);
  const next = nextTierName(current);
  const demotion =
    current === "Pro"
      ? "Stay above 62 to keep Pro — priority matching is on the line"
      : current === "Elite"
        ? "Stay above 90 to keep Elite — surge access is on the line"
        : null;

  if (!next) {
    return {
      next: null,
      weeklyUsd: TIER_ECONOMICS.Elite.weeklyUsd,
      headline: TIER_ECONOMICS.Elite.headline,
      demotion,
    };
  }

  return {
    next,
    weeklyUsd: TIER_ECONOMICS[next].weeklyUsd,
    headline: TIER_ECONOMICS[next].headline,
    demotion,
  };
}

export type SinceYouLeftLine = {
  id: string;
  text: string;
  tone: "neutral" | "money" | "risk" | "learn";
};

/** Dry-session surface — value on every open, even with no jobs. */
export function sinceYouLeft(s: Signals): SinceYouLeftLine[] {
  const scoreValue = score(s);
  const current = tier(scoreValue, s.jobsCompleted);
  const next = nextTierName(current);
  const pts = pointsToNextTier(scoreValue, s.jobsCompleted);
  const streak = onTimeStreak(s);
  const money = tierMoney(s);
  const lines: SinceYouLeftLine[] = [];

  if (current === "Recruit") {
    const need = Math.max(0, 3 - s.jobsCompleted);
    lines.push({
      id: "activation",
      text:
        need > 0
          ? `${need} more job${need === 1 ? "" : "s"} to Shadow — true activation starts here`
          : "You're one clean finish from Shadow",
      tone: "money",
    });
  } else if (next && pts >= 1 && pts <= 5) {
    lines.push({
      id: "score",
      text: `Your score is ${scoreValue} — ${pts} pt${pts === 1 ? "" : "s"} from ${next} (≈ +$${money.weeklyUsd}/wk)`,
      tone: "money",
    });
  } else {
    lines.push({
      id: "score",
      text: `Reliability ${scoreValue} · ${current} — still climbing`,
      tone: "neutral",
    });
  }

  const training = s.trainingBonus ?? 0;
  if (training < 6) {
    lines.push({
      id: "course",
      text: `A 5-min course could add +${Math.min(2, 6 - training)} reliability before your next offer`,
      tone: "learn",
    });
  }

  if (s.acceptanceRate < 0.6) {
    lines.push({
      id: "weekend",
      text: "3 weekend jobs fit your usual windows — accepting lifts earnings ~18%",
      tone: "money",
    });
  }

  if (streak.count > 0) {
    lines.push({
      id: "streak",
      text: streak.protectCopy,
      tone: streak.atRiskHours <= 6 ? "risk" : "neutral",
    });
  }

  return lines.slice(0, 4);
}

export function tierRank(t: Tier): number {
  return ["Recruit", "Shadow", "Pro", "Elite"].indexOf(t);
}

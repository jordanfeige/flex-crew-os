import {
  nextTierName,
  pointsToNextTier,
  score,
  tier,
  type Signals,
  type Tier,
} from "./engine";

/**
 * Illustrative weekly earnings lift by career tier unlock.
 * Labeled illustrative everywhere in UI — calibrate with Flex Mixpanel later.
 */
export const TIER_ECONOMICS: Record<
  Tier,
  {
    weeklyUsd: number;
    unlockLabel: string;
    headline: string;
    unlocks: string[];
  }
> = {
  Recruit: {
    weeklyUsd: 0,
    unlockLabel: "Building your record",
    headline: "Prove out with 3 completed jobs",
    unlocks: ["Building your record"],
  },
  Certified: {
    weeklyUsd: 40,
    unlockLabel: "Standard matching",
    headline: "Certified unlocks standard matching ≈ +$40/week",
    unlocks: ["Standard matching", "Access to open marketplace jobs"],
  },
  Professional: {
    weeklyUsd: 140,
    unlockLabel: "Priority access to premium jobs",
    headline: "Professional unlocks priority matching ≈ +$140/week",
    unlocks: [
      "Priority access to premium jobs",
      "Weekly payout",
      "Higher match priority",
    ],
  },
  Elite: {
    weeklyUsd: 220,
    unlockLabel: "Top-crew badge · surge access",
    headline: "Elite unlocks surge + VIP first pick ≈ +$220/week",
    unlocks: [
      "Top-crew badge",
      "Surge access",
      "VIP first pick on premium jobs",
    ],
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
    current === "Professional"
      ? "Stay above 62 to keep Professional — priority matching is on the line"
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
          ? `${need} more job${need === 1 ? "" : "s"} to Certified — true activation starts here`
          : "You're one clean finish from Certified",
      tone: "money",
    });
  } else if (next && pts >= 1 && pts <= 5) {
    lines.push({
      id: "score",
      text: `You're ${pts} pt${pts === 1 ? "" : "s"} from ${next} — unlocks ≈ +$${money.weeklyUsd}/wk`,
      tone: "money",
    });
  } else {
    lines.push({
      id: "score",
      text: `Professional Score ${scoreValue} · ${current} — still climbing`,
      tone: "neutral",
    });
  }

  const training = s.trainingBonus ?? 0;
  if (training < 6) {
    lines.push({
      id: "course",
      text: `A 5-min course could lift your Professional Score +${Math.min(2, 6 - training)} before your next offer`,
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
  return ["Recruit", "Certified", "Professional", "Elite"].indexOf(t);
}

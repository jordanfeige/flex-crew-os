import type { Capability, Service } from "./capabilities";
import {
  capabilityReliabilityBreakdown,
  type CapabilityReliabilityBreakdown,
  type Review,
} from "./reviews";

export type { CapabilityReliabilityBreakdown, Review };

export type Signals = {
  onTimeRate: number; // 0..1
  avgRating: number; // 0..5
  acceptanceRate: number; // 0..1
  jobsCompleted: number; // integer
  lateCancellations: number; // integer
  noShows: number; // integer
  trainingBonus?: number; // 0..6
};

export type Tier = "Recruit" | "Shadow" | "Pro" | "Elite";

export type BreakdownRow = {
  label: string;
  weightPct: number;
  points: number;
  reason: string;
};

export type ChurnRisk = {
  risk: boolean;
  reason: string;
};

/** Cheapest single action toward the nearest tier — probability shift included. */
export type EstimatedImpact = {
  action: string;
  from: number;
  to: number;
  delta: number;
  probFrom: number;
  probTo: number;
  nextTier: Tier | null;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function score(s: Signals): number {
  const raw =
    s.onTimeRate * 35 +
    (s.avgRating / 5) * 25 +
    s.acceptanceRate * 20 +
    (Math.min(s.jobsCompleted, 10) / 10) * 20 -
    s.lateCancellations * 6 -
    s.noShows * 10 +
    (s.trainingBonus ?? 0);
  return clamp(Math.round(raw), 0, 100);
}

export function tier(scoreValue: number, jobsCompleted: number): Tier {
  if (jobsCompleted < 3) return "Recruit";
  if (scoreValue < 62) return "Shadow";
  if (scoreValue < 90) return "Pro";
  return "Elite";
}

/** Nearest score gate: 62 (→ Pro) then 90 (→ Elite). */
export function nextThreshold(scoreValue: number): number {
  if (scoreValue < 62) return 62;
  if (scoreValue < 90) return 90;
  return 100;
}

export function nextTierName(current: Tier): Tier | null {
  if (current === "Recruit") return "Shadow";
  if (current === "Shadow") return "Pro";
  if (current === "Pro") return "Elite";
  return null;
}

/** Map a score threshold to the tier you clear by reaching it. */
export function tierClearedByThreshold(threshold: number): Tier {
  if (threshold <= 62) return "Pro";
  if (threshold <= 90) return "Elite";
  return "Elite";
}

export function pointsToNextTier(scoreValue: number, jobsCompleted: number): number {
  const t = tier(scoreValue, jobsCompleted);
  if (t === "Recruit") return Math.max(0, 62 - scoreValue);
  if (t === "Elite") return 0;
  return Math.max(0, nextThreshold(scoreValue) - scoreValue);
}

export function breakdown(s: Signals): BreakdownRow[] {
  const rows: BreakdownRow[] = [
    {
      label: "On-time rate",
      weightPct: 35,
      points: +(s.onTimeRate * 35).toFixed(1),
      reason: `${Math.round(s.onTimeRate * 100)}% of jobs started on time`,
    },
    {
      label: "Avg rating",
      weightPct: 25,
      points: +((s.avgRating / 5) * 25).toFixed(1),
      reason: `${s.avgRating.toFixed(2)} / 5.0 customer rating`,
    },
    {
      label: "Acceptance rate",
      weightPct: 20,
      points: +(s.acceptanceRate * 20).toFixed(1),
      reason: `${Math.round(s.acceptanceRate * 100)}% of offers accepted`,
    },
    {
      label: "Jobs completed",
      weightPct: 20,
      points: +((Math.min(s.jobsCompleted, 10) / 10) * 20).toFixed(1),
      reason:
        s.jobsCompleted >= 10
          ? `${s.jobsCompleted} jobs (capped at 10 for this factor)`
          : `${s.jobsCompleted} of 10 jobs toward full credit`,
    },
  ];

  if (s.lateCancellations > 0) {
    rows.push({
      label: "Late cancellations",
      weightPct: 0,
      points: +(-(s.lateCancellations * 6)).toFixed(1),
      reason: `${s.lateCancellations} recent late cancellation${s.lateCancellations === 1 ? "" : "s"} (−6 each)`,
    });
  }

  if (s.noShows > 0) {
    rows.push({
      label: "No-shows",
      weightPct: 0,
      points: +(-(s.noShows * 10)).toFixed(1),
      reason: `${s.noShows} recent no-show${s.noShows === 1 ? "" : "s"} (−10 each)`,
    });
  }

  const training = s.trainingBonus ?? 0;
  if (training > 0) {
    rows.push({
      label: "Training bonus",
      weightPct: 0,
      points: +training.toFixed(1),
      reason: `Micro-learning completed (+${training} pts, cap +6)`,
    });
  }

  return rows;
}

export function churnRisk(s: Signals, _scoreValue: number): ChurnRisk {
  void _scoreValue;
  const triggers: string[] = [];
  if (s.acceptanceRate < 0.5) {
    triggers.push(`acceptance ${Math.round(s.acceptanceRate * 100)}% (<50%)`);
  }
  if (s.lateCancellations >= 2) {
    triggers.push(`${s.lateCancellations} late cancellations`);
  }
  if (s.noShows >= 1) {
    triggers.push(`${s.noShows} no-show${s.noShows === 1 ? "" : "s"}`);
  }
  if (triggers.length === 0) {
    return { risk: false, reason: "No churn flags" };
  }
  return { risk: true, reason: triggers.join(" · ") };
}

type Lever = {
  key: "onTime" | "acceptance" | "rating";
  headroom: number;
  apply: (s: Signals) => Signals;
  action: string;
};

/**
 * Highest-headroom lever toward the nearest threshold:
 * (1−onTime)×35, (1−acceptance)×20, (1−rating/5)×25.
 */
function pickBestLever(s: Signals): Lever {
  const levers: Lever[] = [
    {
      key: "onTime",
      headroom: (1 - s.onTimeRate) * 35,
      apply: (x) => ({ ...x, onTimeRate: Math.min(1, x.onTimeRate + 0.05) }),
      action: "Complete one more on-time move",
    },
    {
      key: "acceptance",
      headroom: (1 - s.acceptanceRate) * 20,
      apply: (x) => ({
        ...x,
        acceptanceRate: Math.min(1, x.acceptanceRate + 0.05),
      }),
      action: "Accept your next job",
    },
    {
      key: "rating",
      headroom: (1 - s.avgRating / 5) * 25,
      apply: (x) => ({ ...x, avgRating: Math.min(5, x.avgRating + 0.1) }),
      action: "Earn a stronger rating on your next job",
    },
  ];

  return levers.reduce((best, lever) => {
    if (lever.headroom > best.headroom) return lever;
    if (lever.headroom < best.headroom) return best;
    const bestGain = score(best.apply(s)) - score(s);
    const leverGain = score(lever.apply(s)) - score(s);
    return leverGain > bestGain ? lever : best;
  });
}

/** Apply the cheapest single action toward the nearest tier. */
export function applyAction(s: Signals): Signals {
  if (s.jobsCompleted < 3) {
    return { ...s, jobsCompleted: s.jobsCompleted + 1 };
  }
  return pickBestLever(s).apply(s);
}

/**
 * % chance of clearing the NEXT tier gate.
 * Uses the worker's current score to lock the threshold (62 then 90),
 * so projected probs stay comparable until the worker actually crosses.
 */
export function tierProb(sc: number, currentScore: number): number {
  return clamp(Math.round(50 + (sc - nextThreshold(currentScore)) * 4), 3, 96);
}

/**
 * Next-best-action always targets the nearest threshold (62 → Pro, 90 → Elite),
 * never a far tier. Lever = highest headroom among on-time / acceptance / rating.
 */
export function nextBestAction(s: Signals): string {
  if (s.jobsCompleted < 3) {
    const need = 3 - s.jobsCompleted;
    return `Complete ${need} more job${need === 1 ? "" : "s"} to reach Shadow`;
  }

  const current = score(s);
  if (current >= 90) return "You're Elite — keep your streak to stay there.";

  const threshold = nextThreshold(current);
  const target = tierClearedByThreshold(threshold);
  const best = pickBestLever(s);
  const projected = score(best.apply(s));
  const delta = Math.max(1, projected - current);
  return `${best.action} to reach ${target} (+${delta})`;
}

export function estimatedImpact(s: Signals): EstimatedImpact {
  const from = score(s);
  const t = tier(from, s.jobsCompleted);

  if (s.jobsCompleted < 3) {
    const need = 3 - s.jobsCompleted;
    const projected = score({ ...s, jobsCompleted: s.jobsCompleted + need });
    return {
      action: `Complete ${need} more job${need === 1 ? "" : "s"}`,
      from,
      to: projected,
      delta: projected - from,
      probFrom: tierProb(from, from),
      probTo: tierProb(projected, from),
      nextTier: "Shadow",
    };
  }

  if (t === "Elite") {
    return {
      action: "Maintain Elite standards",
      from,
      to: from,
      delta: 0,
      probFrom: 96,
      probTo: 96,
      nextTier: null,
    };
  }

  const best = pickBestLever(s);
  const projected = score(best.apply(s));
  const threshold = nextThreshold(from);
  const next = tierClearedByThreshold(threshold);

  return {
    action: best.action,
    from,
    to: projected,
    delta: projected - from,
    probFrom: tierProb(from, from),
    probTo: tierProb(projected, from),
    nextTier: next,
  };
}

export function coachNudge(s: Signals): string {
  if (s.jobsCompleted < 3) {
    const need = 3 - s.jobsCompleted;
    return need === 1
      ? "One more completed job unlocks Shadow — you're proving out"
      : `${need} more completed jobs unlock Shadow — true activation is job 3–4`;
  }

  const scoreValue = score(s);
  const risk = churnRisk(s, scoreValue);
  if (risk.risk) {
    return "We've got shifts that fit your usual windows — picking one up this week rebuilds your streak.";
  }
  if (s.acceptanceRate < 0.6) {
    return `Your acceptance rate is ${Math.round(s.acceptanceRate * 100)}% — accepting weekend jobs could add ~18% earnings`;
  }
  const t = tier(scoreValue, s.jobsCompleted);
  const next = nextTierName(t);
  const pts = pointsToNextTier(scoreValue, s.jobsCompleted);
  if (next && pts >= 1 && pts <= 5) {
    return `You're ${pts} pt${pts === 1 ? "" : "s"} from ${next} — one strong job gets you there`;
  }
  return "Keep your on-time streak — it's your biggest score driver.";
}

export function dailyGoal(s: Signals): string {
  if (s.jobsCompleted < 3) return "Complete one move today to keep proving out.";
  if (s.noShows >= 1 || s.lateCancellations >= 2) {
    return "Accept and finish one clean job today.";
  }
  if (s.acceptanceRate < 0.6) return "Accept one weekend offer today.";
  return "Complete one on-time move today.";
}

export type ScorePayload = {
  score: number;
  tier: Tier;
  breakdown: BreakdownRow[];
  nextBestAction: string;
  churnRisk: ChurnRisk;
  coachNudge: string;
  dailyGoal: string;
  pointsToNextTier: number;
  nextThreshold: number;
  estimatedImpact: EstimatedImpact;
};

export function evaluate(s: Signals): ScorePayload {
  const scoreValue = score(s);
  return {
    score: scoreValue,
    tier: tier(scoreValue, s.jobsCompleted),
    breakdown: breakdown(s),
    nextBestAction: nextBestAction(s),
    churnRisk: churnRisk(s, scoreValue),
    coachNudge: coachNudge(s),
    dailyGoal: dailyGoal(s),
    pointsToNextTier: pointsToNextTier(scoreValue, s.jobsCompleted),
    nextThreshold: nextThreshold(scoreValue),
    estimatedImpact: estimatedImpact(s),
  };
}

// ── Capability reliability (reviews feed the engine) ───────────────────────

/**
 * Overall + per-service reliability from capability-tagged reviews.
 * Missing capabilities drag the related service score down.
 */
export function evaluateCapabilityReliability(
  workerId: string,
  workerCapabilities: Capability[],
  reviews: Review[],
): CapabilityReliabilityBreakdown {
  return capabilityReliabilityBreakdown(reviews, workerId, workerCapabilities);
}

export type FullEvaluatePayload = ScorePayload & {
  capabilityReliability: CapabilityReliabilityBreakdown;
};

/** Signals score + review-backed capability reliability — one evaluate path. */
export function evaluateFull(
  s: Signals,
  opts: {
    workerId: string;
    capabilities: Capability[];
    reviews: Review[];
  },
): FullEvaluatePayload {
  return {
    ...evaluate(s),
    capabilityReliability: evaluateCapabilityReliability(
      opts.workerId,
      opts.capabilities,
      opts.reviews,
    ),
  };
}

export function serviceScoreLabel(service: Service): string {
  const labels: Record<Service, string> = {
    moving: "Moving",
    cleaning: "Cleaning",
    delivery: "Delivery",
    install: "Install",
  };
  return labels[service];
}

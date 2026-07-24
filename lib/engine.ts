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

export type EstimatedImpact = {
  action: string;
  deltaPoints: number;
  projectedScore: number;
  probabilityOfNextTier: number;
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
  simulate: (s: Signals) => Signals;
  label: string;
  shortLabel: string;
};

/** Highest headroom×weight among on-time, acceptance, rating — toward nearest tier. */
function pickBestLever(s: Signals): Lever {
  const levers: Lever[] = [
    {
      key: "onTime",
      headroom: (1 - s.onTimeRate) * 35,
      simulate: (x) => ({ ...x, onTimeRate: Math.min(1, x.onTimeRate + 0.05) }),
      label: "Deliver one more on-time move",
      shortLabel: "One on-time move",
    },
    {
      key: "acceptance",
      headroom: (1 - s.acceptanceRate) * 20,
      simulate: (x) => ({
        ...x,
        acceptanceRate: Math.min(1, x.acceptanceRate + 0.05),
      }),
      label: "Accept 1 more job",
      shortLabel: "Accept 1 more job",
    },
    {
      key: "rating",
      headroom: (1 - s.avgRating / 5) * 25,
      simulate: (x) => ({ ...x, avgRating: Math.min(5, x.avgRating + 0.1) }),
      label: "Earn a stronger rating on your next job",
      shortLabel: "Earn a 5-star finish",
    },
  ];

  return levers.reduce((best, lever) => {
    if (lever.headroom > best.headroom) return lever;
    if (lever.headroom < best.headroom) return best;
    // Tie-break: biggest immediate score gain toward next threshold
    const bestGain = score(best.simulate(s)) - score(s);
    const leverGain = score(lever.simulate(s)) - score(s);
    return leverGain > bestGain ? lever : best;
  });
}

export function nextBestAction(s: Signals): string {
  if (s.jobsCompleted < 3) {
    const need = 3 - s.jobsCompleted;
    return `Complete ${need} more job${need === 1 ? "" : "s"} to reach Shadow`;
  }

  const current = score(s);
  const t = tier(current, s.jobsCompleted);
  const target = nextTierName(t);
  if (!target) return "You're Elite — keep your streak to stay there.";

  const best = pickBestLever(s);
  const projected = score(best.simulate(s));
  const delta = Math.max(1, projected - current);
  return `${best.label} to reach ${target} (+${delta})`;
}

export function estimatedImpact(s: Signals): EstimatedImpact {
  const current = score(s);
  const t = tier(current, s.jobsCompleted);
  const target = nextTierName(t);
  // Nearest tier threshold for THIS worker's current tier ladder
  const threshold =
    t === "Recruit" ? 62 : t === "Shadow" ? 62 : t === "Pro" ? 90 : 100;

  if (s.jobsCompleted < 3) {
    const need = 3 - s.jobsCompleted;
    const simulated = score({ ...s, jobsCompleted: s.jobsCompleted + need });
    const delta = simulated - current;
    const probabilityOfNextTier = clamp(
      Math.round(60 + (simulated - threshold) * 6),
      5,
      97,
    );
    return {
      action: `Complete ${need} more job${need === 1 ? "" : "s"}`,
      deltaPoints: delta,
      projectedScore: simulated,
      probabilityOfNextTier,
    };
  }

  if (!target) {
    return {
      action: "Maintain Elite standards",
      deltaPoints: 0,
      projectedScore: current,
      probabilityOfNextTier: 97,
    };
  }

  const best = pickBestLever(s);
  const projectedScore = score(best.simulate(s));
  const deltaPoints = projectedScore - current;
  const probabilityOfNextTier = clamp(
    Math.round(60 + (projectedScore - threshold) * 6),
    5,
    97,
  );

  return {
    action: best.shortLabel,
    deltaPoints,
    projectedScore,
    probabilityOfNextTier,
  };
}

export function coachNudge(s: Signals): string {
  // Recruit unlock is jobs, not points — never say "0 pts from Shadow"
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
  // Only use the near-miss line when there are actual points left (1–5)
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

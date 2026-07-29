import { CREW } from "./data";
import { churnRisk, score, type Signals } from "./engine";

export type Shortage = {
  city: string;
  slot: string;
  demand: number;
  supply: number;
  gap: number;
};

export const SHORTAGES: Shortage[] = [
  { city: "Austin", slot: "Sat AM", demand: 58, supply: 46, gap: 46 - 58 },
  { city: "Phoenix", slot: "Sun PM", demand: 38, supply: 31, gap: 31 - 38 },
  { city: "Denver", slot: "Fri PM", demand: 52, supply: 50, gap: 50 - 52 },
];

/** Illustrative prior-week snapshot for hero trend + primary driver. */
export const LAST_WEEK = { avgScore: 79, churnRate: 0.12 } as const;

/** Live mean score across CREW. */
export function avgCrewScore(
  overrides?: { id: string; signalsScore: number }[],
): number {
  const scores = CREW.map((m) => {
    const o = overrides?.find((x) => x.id === m.id);
    return o?.signalsScore ?? score(m.signals);
  });
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

/** Share of CREW currently flagged churn. */
export function churnRate(
  overrides?: { id: string; signals: Signals }[],
): number {
  let flagged = 0;
  for (const m of CREW) {
    const signals = overrides?.find((o) => o.id === m.id)?.signals ?? m.signals;
    const s = score(signals);
    if (churnRisk(signals, s).risk) flagged += 1;
  }
  return flagged / CREW.length;
}

/** Marketplace health index — shared formula for current and last week. */
export function supplyHealth(
  avg = avgCrewScore(),
  churn = churnRate(),
): number {
  return Math.round(0.86 * 40 + (avg / 100) * 35 + (1 - churn) * 25);
}

export type PrimaryDriver = {
  kind: "score" | "churn";
  label: string;
  /** Signed health-point contribution of the worse factor (most negative). */
  pts: number;
  dScore: number;
  dChurn: number;
};

/**
 * Attribution: which factor dragged health most vs LAST_WEEK.
 * dScore / dChurn are health-point contributions (can be negative).
 */
export function primaryDriver(
  currentAvg: number,
  currentChurn: number,
): PrimaryDriver {
  const dScore = ((currentAvg - LAST_WEEK.avgScore) / 100) * 35;
  const dChurn = (LAST_WEEK.churnRate - currentChurn) * 25;

  if (dScore <= dChurn) {
    return {
      kind: "score",
      label: "Worker reliability slipping — fewer Silver→Gold graduations",
      pts: +dScore.toFixed(1),
      dScore: +dScore.toFixed(1),
      dChurn: +dChurn.toFixed(1),
    };
  }
  return {
    kind: "churn",
    label: "Rising churn among Silver workers",
    pts: +dChurn.toFixed(1),
    dScore: +dScore.toFixed(1),
    dChurn: +dChurn.toFixed(1),
  };
}

/** delta this week = lastWeekHealth − currentHealth (positive = down). */
export function healthDeltaThisWeek(currentHealth: number): number {
  const last = supplyHealth(LAST_WEEK.avgScore, LAST_WEEK.churnRate);
  return last - currentHealth;
}

/** Expected fill lift % — $15 ≈ +18%. */
export function fillLift(incentiveUsd: number): number {
  const usd = Math.max(0, incentiveUsd);
  return Math.round(28 * (1 - Math.exp(-usd / 15)));
}

export function fastTrackReady(liveScores?: { id: string; score: number }[]): {
  crewCount: number;
  aggregate: number;
  crewIds: string[];
} {
  const crewIds: string[] = [];
  for (const m of CREW) {
    const s = liveScores?.find((o) => o.id === m.id)?.score ?? score(m.signals);
    if (s >= 58 && s < 62) crewIds.push(m.id);
  }
  return { crewCount: crewIds.length, aggregate: 18, crewIds };
}

export function inviteRecruits(): { count: number; expectedConversionPct: number } {
  return { count: 42, expectedConversionPct: 31 };
}

export type MarketplacePayload = {
  supplyHealth: number;
  shortages: Shortage[];
  fillLift: number;
  fastTrackReady: number;
  inviteRecruits: { count: number; expectedConversionPct: number };
  incentiveUsd: number;
  avgCrewScore: number;
  churnRate: number;
  healthDelta: number;
  primaryDriver: PrimaryDriver;
  lastWeekHealth: number;
};

/**
 * When a live selected worker's signals are passed, avg/churn/health
 * recompute with that worker substituted into the CREW mean.
 */
export function evaluateMarketplace(
  incentiveUsd = 0,
  liveWorker?: { id: string; signals: Signals },
): MarketplacePayload {
  const overrides = liveWorker
    ? [
        {
          id: liveWorker.id,
          signalsScore: score(liveWorker.signals),
          signals: liveWorker.signals,
        },
      ]
    : undefined;

  const avg = avgCrewScore(
    overrides?.map((o) => ({ id: o.id, signalsScore: o.signalsScore })),
  );
  const churn = churnRate(
    overrides?.map((o) => ({ id: o.id, signals: o.signals })),
  );
  const health = supplyHealth(avg, churn);
  const ft = fastTrackReady(
    liveWorker
      ? CREW.map((m) => ({
          id: m.id,
          score: m.id === liveWorker.id ? score(liveWorker.signals) : score(m.signals),
        }))
      : undefined,
  );

  return {
    supplyHealth: health,
    shortages: SHORTAGES.map((s) => ({ ...s })),
    fillLift: fillLift(incentiveUsd),
    fastTrackReady: ft.aggregate,
    inviteRecruits: inviteRecruits(),
    incentiveUsd,
    avgCrewScore: Math.round(avg * 10) / 10,
    churnRate: Math.round(churn * 1000) / 1000,
    healthDelta: healthDeltaThisWeek(health),
    primaryDriver: primaryDriver(avg, churn),
    lastWeekHealth: supplyHealth(LAST_WEEK.avgScore, LAST_WEEK.churnRate),
  };
}

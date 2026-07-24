import { CREW } from "./data";
import { churnRisk, score } from "./engine";

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
  overrides?: { id: string; signals: Parameters<typeof churnRisk>[0] }[],
): number {
  let flagged = 0;
  for (const m of CREW) {
    const signals = overrides?.find((o) => o.id === m.id)?.signals ?? m.signals;
    const s = score(signals);
    if (churnRisk(signals, s).risk) flagged += 1;
  }
  return flagged / CREW.length;
}

export function supplyHealth(
  avg = avgCrewScore(),
  churn = churnRate(),
): number {
  return Math.round(0.86 * 40 + (avg / 100) * 35 + (1 - churn) * 25);
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
};

/**
 * When a live selected worker's signals are passed, avg/churn/health
 * recompute with that worker substituted into the CREW mean.
 */
export function evaluateMarketplace(
  incentiveUsd = 0,
  liveWorker?: { id: string; signals: Parameters<typeof score>[0] },
): MarketplacePayload {
  const overrides = liveWorker
    ? [{ id: liveWorker.id, signalsScore: score(liveWorker.signals), signals: liveWorker.signals }]
    : undefined;

  const avg = avgCrewScore(
    overrides?.map((o) => ({ id: o.id, signalsScore: o.signalsScore })),
  );
  const churn = churnRate(
    overrides?.map((o) => ({ id: o.id, signals: o.signals })),
  );
  const ft = fastTrackReady(
    liveWorker
      ? CREW.map((m) => ({
          id: m.id,
          score: m.id === liveWorker.id ? score(liveWorker.signals) : score(m.signals),
        }))
      : undefined,
  );

  return {
    supplyHealth: supplyHealth(avg, churn),
    shortages: SHORTAGES.map((s) => ({ ...s })),
    fillLift: fillLift(incentiveUsd),
    fastTrackReady: ft.aggregate,
    inviteRecruits: inviteRecruits(),
    incentiveUsd,
    avgCrewScore: Math.round(avg * 10) / 10,
    churnRate: Math.round(churn * 1000) / 1000,
  };
}

import type { Capability, Service } from "./capabilities";
import { SERVICE_CAPABILITIES, SERVICE_LABEL, SERVICES } from "./capabilities";
import type { WorkerProfile } from "./worker";
import { matchScore } from "./worker";
import type { CapabilityJob } from "./capabilities";
import type { MarketplacePayload, Shortage } from "./marketplace";

/** Jurisdiction rules — config, not a separate product. */
export type JurisdictionRule = {
  id: string;
  market: string;
  label: string;
  marginRiskPct: number;
  signal: string;
};

export const JURISDICTION_RULES: JurisdictionRule[] = [
  {
    id: "ca-ab5",
    market: "California",
    label: "CA contractor classification margin risk",
    marginRiskPct: 4.2,
    signal: "Jurisdiction config · CA AB5 / Prop 22 exposure on 18% of CA gigs",
  },
];

export type CopilotRecommendation = {
  id: string;
  priority: number;
  issue: string;
  action: string;
  impact: {
    fillRate?: string;
    reliability?: string;
    activation?: string;
    margin?: string;
  };
  signal: string;
  /** Links back to shared profile / capability when relevant. */
  relatedWorkerId?: string;
  relatedCapability?: Capability;
};

/**
 * Marketplace Copilot — ranked actionable recs from the same intelligence layer.
 * Every rec cites a real signal (fill, funnel, supply gap, jurisdiction, reliability).
 */
export function evaluateCopilot(
  market: MarketplacePayload,
  profiles: WorkerProfile[],
  jobs: CapabilityJob[],
): CopilotRecommendation[] {
  const recs: CopilotRecommendation[] = [];

  // 1) Underserved slot from shortages
  const worst = [...market.shortages].sort((a, b) => a.gap - b.gap)[0] as
    | Shortage
    | undefined;
  if (worst && worst.gap < 0) {
    recs.push({
      id: "incentive-slot",
      priority: 1,
      issue: `${worst.city} ${worst.slot} undersupplied (−${Math.abs(worst.gap)} crew)`,
      action: `Raise slot incentive to $${Math.max(15, market.incentiveUsd + 5)} for ${worst.slot}`,
      impact: {
        fillRate: `+${market.fillLift || 12}% expected fill`,
      },
      signal: `Supply gap · demand ${worst.demand} vs supply ${worst.supply}`,
    });
  }

  // 2) Accelerate graduation — workers within 4 pts of Gold (62)
  const nearGold = profiles.filter(
    (p) => p.reliability >= 58 && p.reliability < 62 && p.tier === "Silver",
  );
  if (nearGold.length > 0) {
    const sample = nearGold[0];
    recs.push({
      id: "fast-track",
      priority: 2,
      issue: `${nearGold.length} worker${nearGold.length === 1 ? "" : "s"} within 4 pts of Gold`,
      action: `Accelerate graduation for ${sample.name.split(" ")[0]} — push acceptance/on-time coaching`,
      impact: {
        reliability: `+${market.fastTrackReady}% reliability lift illustrative`,
        fillRate: "Priority matching unlocks ≈ +$140/wk supply quality",
      },
      signal: `Reliability engine · ${sample.name} at ${sample.reliability} (Silver → Gold at 62)`,
      relatedWorkerId: sample.id,
    });
  }

  // 3) Invite qualified recruits for capability gaps on top demand service
  const movingJobs = jobs.filter((j) => j.service === "moving");
  const movers = profiles.filter((p) =>
    SERVICE_CAPABILITIES.moving.every((c) => p.earnedCapabilityIds.includes(c)),
  );
  const qualifyPct = Math.round((movers.length / Math.max(1, profiles.length)) * 100);
  if (qualifyPct < 80) {
    recs.push({
      id: "invite",
      priority: 3,
      issue: `Only ${qualifyPct}% of supply qualifies for Moving`,
      action: `Invite ${market.inviteRecruits.count} recruits with packing + heavy-lift vetting`,
      impact: {
        activation: `${market.inviteRecruits.expectedConversionPct}% expected conversion`,
      },
      signal: `Capability model · ${movers.length}/${profiles.length} profiles earn full Moving set`,
      relatedCapability: "packing",
    });
  }

  // 4) Reallocate supply between markets
  if (market.shortages.length >= 2) {
    const [a, b] = [...market.shortages].sort((x, y) => x.gap - y.gap);
    if (a.gap < 0 && b.gap >= -2) {
      recs.push({
        id: "reallocate",
        priority: 4,
        issue: `${a.city} short while ${b.city} is near balance`,
        action: `Reallocate 3–5 flexible crew from ${b.city} → ${a.city} ${a.slot}`,
        impact: {
          fillRate: `Close ~${Math.min(5, Math.abs(a.gap))} of the ${a.city} gap`,
        },
        signal: `Marketplace shortages · ${a.city} gap ${a.gap}, ${b.city} gap ${b.gap}`,
      });
    }
  }

  // 5) Jurisdiction margin risk
  for (const rule of JURISDICTION_RULES) {
    recs.push({
      id: rule.id,
      priority: 5,
      issue: rule.label,
      action: "Flag CA gigs for compliance review before surge pricing",
      impact: {
        margin: `Protect ~${rule.marginRiskPct}% margin on exposed volume`,
      },
      signal: rule.signal,
    });
  }

  // 6) Capability gap on a specific high-match miss
  const weakAssembly = profiles.find((p) => {
    const ass = p.capabilities.find((c) => c.id === "furniture_assembly");
    return ass?.earned && (ass.reliabilityScore ?? 100) < 70;
  });
  if (weakAssembly) {
    const missJobs = movingJobs.filter(
      (j) =>
        j.requires.includes("furniture_assembly") &&
        matchScore(weakAssembly, j).score < 85,
    ).length;
    recs.push({
      id: "coach-assembly",
      priority: 3,
      issue: `${weakAssembly.name.split(" ")[0]} assembly gap limits ${missJobs || 6}+ matches`,
      action: "Assign Furniture assembly fundamentals coaching module",
      impact: {
        activation: "Unlock ~6 more jobs on same profile",
        reliability: "+2 reliability from module",
      },
      signal: `Capability profile · furniture_assembly score ${
        weakAssembly.capabilities.find((c) => c.id === "furniture_assembly")
          ?.reliabilityScore ?? "—"
      }`,
      relatedWorkerId: weakAssembly.id,
      relatedCapability: "furniture_assembly",
    });
  }

  return recs.sort((a, b) => a.priority - b.priority).slice(0, 5);
}

/** % of profiles that qualify for a service (have all required caps). */
export function supplyQualifyPct(
  profiles: WorkerProfile[],
  service: Service,
): number {
  const required = SERVICE_CAPABILITIES[service];
  const ok = profiles.filter((p) =>
    required.every((c) => p.earnedCapabilityIds.includes(c)),
  ).length;
  return Math.round((ok / Math.max(1, profiles.length)) * 100);
}

export type ServiceConfig = {
  id: Service | string;
  label: string;
  requiredCapabilities: Capability[];
};

export function defaultServiceConfigs(): ServiceConfig[] {
  return SERVICES.map((s) => ({
    id: s,
    label: SERVICE_LABEL[s],
    requiredCapabilities: [...SERVICE_CAPABILITIES[s]],
  }));
}

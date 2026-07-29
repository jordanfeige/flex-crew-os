import type { Capability, CapabilityJob, Service } from "./capabilities";
import {
  ALL_CAPABILITIES,
  CAPABILITY_LABEL,
  SERVICE_CAPABILITIES,
  SERVICE_LABEL,
} from "./capabilities";
import { COACHING_BY_CAPABILITY } from "./coaching";
import type { CapabilityReliabilityBreakdown } from "./reviews";

/**
 * Shared capability object — the intelligence-layer atom.
 * String Capability ids elsewhere reference these records.
 */
export type CapabilityProfile = {
  id: Capability;
  label: string;
  /** Earned / opted-in on this worker's account. */
  earned: boolean;
  verified: boolean;
  /** 0 none · 1 emerging · 2 solid · 3 elite */
  proficiency: 0 | 1 | 2 | 3;
  /** 0–100 reliability within this capability (engine/reviews). */
  reliabilityScore: number | null;
  certs: string[];
  unlocksJobTypes: string[];
  coachingModuleId?: string;
  /** Gap copy when proficiency < 2. */
  gap?: string;
};

/** Catalog metadata shared across all workers (certs defaults, unlock labels). */
const CAPABILITY_META: Record<
  Capability,
  { certs: string[]; unlocksJobTypes: string[] }
> = {
  heavy_lifting: {
    certs: ["Lift safety"],
    unlocksJobTypes: ["Apartment moves", "Office clear-outs", "Heavy furniture"],
  },
  furniture_assembly: {
    certs: ["Assembly badge"],
    unlocksJobTypes: ["Studio moves", "Furniture delivery + build", "Shelf installs"],
  },
  packing: {
    certs: ["Packing standards"],
    unlocksJobTypes: ["Full-service moves", "Fragile-heavy loads"],
  },
  driving: {
    certs: ["Valid license", "Cargo securement"],
    unlocksJobTypes: ["Truck moves", "Same-day delivery", "Route drops"],
  },
  deep_cleaning: {
    certs: ["Cleaning protocol"],
    unlocksJobTypes: ["Deep cleans", "Move-out cleans"],
  },
  carpet_cleaning: {
    certs: ["Carpet machine cert"],
    unlocksJobTypes: ["Carpet shampoo jobs"],
  },
  bathroom_sanitation: {
    certs: ["Sanitation protocol"],
    unlocksJobTypes: ["Bathroom-heavy cleans"],
  },
  tv_mounting: {
    certs: ["Mount safety"],
    unlocksJobTypes: ["TV installation"],
  },
  appliance_install: {
    certs: ["Appliance install"],
    unlocksJobTypes: ["Washer/dryer install"],
  },
};

export function proficiencyFromScore(score: number | null, earned: boolean): 0 | 1 | 2 | 3 {
  if (!earned) return 0;
  if (score == null) return 1;
  if (score >= 90) return 3; // Elite
  if (score >= 75) return 2; // Solid
  return 1; // Building
}

export function buildCapabilityProfile(
  id: Capability,
  earnedIds: Capability[],
  reliability: CapabilityReliabilityBreakdown,
): CapabilityProfile {
  const earned = earnedIds.includes(id);
  const score = earned
    ? (reliability.byCapability[id] ?? 55)
    : null;
  const proficiency = proficiencyFromScore(score, earned);
  const meta = CAPABILITY_META[id];
  const verified = earned && proficiency >= 2;

  let gap: string | undefined;
  if (earned && proficiency < 2) {
    gap = `Gap — complete ${CAPABILITY_LABEL[id].toLowerCase()} coaching to reach solid`;
  } else if (!earned) {
    gap = "Not earned yet — start modular vetting";
  }

  return {
    id,
    label: CAPABILITY_LABEL[id],
    earned,
    verified,
    proficiency,
    reliabilityScore: score,
    certs: earned ? meta.certs : [],
    unlocksJobTypes: meta.unlocksJobTypes,
    coachingModuleId: COACHING_BY_CAPABILITY[id],
    gap,
  };
}

/** All catalog capabilities for a worker — earned first, then addable. */
export function buildWorkerCapabilityProfiles(
  earnedIds: Capability[],
  reliability: CapabilityReliabilityBreakdown,
): CapabilityProfile[] {
  const earned = earnedIds.map((id) =>
    buildCapabilityProfile(id, earnedIds, reliability),
  );
  const rest = ALL_CAPABILITIES.filter((id) => !earnedIds.includes(id)).map((id) =>
    buildCapabilityProfile(id, earnedIds, reliability),
  );
  return [...earned, ...rest];
}

/** Count jobs unlocked by a capability in a catalog. */
export function jobsUnlockedBy(
  cap: Capability,
  jobs: CapabilityJob[],
): CapabilityJob[] {
  return jobs.filter((j) => j.requires.includes(cap));
}

/** Human label for services a capability feeds. */
export function servicesForCapability(cap: Capability): Service[] {
  return (Object.keys(SERVICE_CAPABILITIES) as Service[]).filter((s) =>
    SERVICE_CAPABILITIES[s].includes(cap),
  );
}

export function serviceNamesForCapability(cap: Capability): string {
  return servicesForCapability(cap)
    .map((s) => SERVICE_LABEL[s])
    .join(", ");
}

export const PROFICIENCY_LABEL: Record<0 | 1 | 2 | 3, string> = {
  0: "None",
  1: "Building",
  2: "Solid",
  3: "Elite",
};

/** Score-band label from reliability (0–100). Matches badge copy. */
export function reliabilityBand(score: number | null): "Elite" | "Solid" | "Building" | null {
  if (score == null) return null;
  if (score >= 90) return "Elite";
  if (score >= 75) return "Solid";
  return "Building";
}

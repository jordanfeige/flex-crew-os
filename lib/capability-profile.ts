import type { Capability, CapabilityJob, Service } from "./capabilities";
import {
  ALL_CAPABILITIES,
  CAPABILITY_LABEL,
  SERVICE_CAPABILITIES,
  SERVICE_LABEL,
} from "./capabilities";
import { COACHING_BY_CAPABILITY, COACHING_MODULES } from "./coaching";
import type { CapabilityReliabilityBreakdown, Review } from "./reviews";

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
  /** 0–100 skill score within this capability (engine/reviews). */
  reliabilityScore: number | null;
  certs: string[];
  unlocksJobTypes: string[];
  coachingModuleId?: string;
  /** Gap copy when proficiency < 2. */
  gap?: string;
  /** Why this skill matters — marketplace context. */
  whyMatters: {
    usedInPct: number;
    serviceLabel: string;
    avgEarningsPerJob: number;
    estimatedWeeklyUsd: number;
    estimatedMonthlyJobs: number;
    requiredFor: string[];
  };
  /** Earned proof — jobs, rating, badges. */
  proof: {
    jobsCompleted: number;
    avgRating: number | null;
    badges: string[];
  };
};

export type UnlockRequirement = {
  id: string;
  label: string;
  done: boolean;
};

export type UnlockPath = {
  requirements: UnlockRequirement[];
  doneCount: number;
  total: number;
};

/** Catalog metadata shared across all workers (certs, unlocks, economics). */
const CAPABILITY_META: Record<
  Capability,
  {
    certs: string[];
    unlocksJobTypes: string[];
    usedInPct: number;
    primaryService: Service;
    avgEarningsPerJob: number;
    estimatedWeeklyUsd: number;
    estimatedMonthlyJobs: number;
    requiredFor: string[];
    /** Illustrative completed-job baseline when reviews are sparse. */
    jobsBaseline: number;
    /** Prerequisite capability ids that speed unlock (optional). */
    prereqCapabilities?: Capability[];
    /** Min customer rating to unlock. */
    minRating?: number;
  }
> = {
  heavy_lifting: {
    certs: ["Lift Safety Certified"],
    unlocksJobTypes: [
      "Piano moves",
      "Large home moves",
      "Commercial moves",
      "Appliance delivery",
    ],
    usedInPct: 83,
    primaryService: "moving",
    avgEarningsPerJob: 38,
    estimatedWeeklyUsd: 62,
    estimatedMonthlyJobs: 14,
    requiredFor: ["Piano moves", "Safes", "Commercial jobs"],
    jobsBaseline: 82,
    minRating: 4.5,
  },
  furniture_assembly: {
    certs: ["Assembly Badge"],
    unlocksJobTypes: [
      "Studio moves",
      "Furniture delivery + build",
      "Shelf installs",
      "IKEA assembly",
    ],
    usedInPct: 41,
    primaryService: "moving",
    avgEarningsPerJob: 28,
    estimatedWeeklyUsd: 42,
    estimatedMonthlyJobs: 10,
    requiredFor: ["IKEA builds", "Furniture delivery", "Shelf installs"],
    jobsBaseline: 24,
    prereqCapabilities: ["packing"],
    minRating: 4.5,
  },
  packing: {
    certs: ["Packing Standards"],
    unlocksJobTypes: [
      "Full-service moves",
      "Fragile-heavy loads",
      "Pack-only jobs",
      "White-glove packing",
    ],
    usedInPct: 67,
    primaryService: "moving",
    avgEarningsPerJob: 22,
    estimatedWeeklyUsd: 36,
    estimatedMonthlyJobs: 12,
    requiredFor: ["Full-service moves", "Fragile loads"],
    jobsBaseline: 56,
    minRating: 4.5,
  },
  driving: {
    certs: ["Valid License", "Cargo Securement"],
    unlocksJobTypes: [
      "Truck moves",
      "Same-day delivery",
      "Route drops",
      "Cargo hauls",
    ],
    usedInPct: 74,
    primaryService: "delivery",
    avgEarningsPerJob: 32,
    estimatedWeeklyUsd: 54,
    estimatedMonthlyJobs: 16,
    requiredFor: ["Truck moves", "Route drops", "Same-day delivery"],
    jobsBaseline: 61,
    minRating: 4.5,
  },
  deep_cleaning: {
    certs: ["Cleaning Protocol"],
    unlocksJobTypes: [
      "Deep cleans",
      "Move-out cleans",
      "Post-construction cleans",
      "Airbnb turnovers",
    ],
    usedInPct: 88,
    primaryService: "cleaning",
    avgEarningsPerJob: 26,
    estimatedWeeklyUsd: 48,
    estimatedMonthlyJobs: 11,
    requiredFor: ["Move-out cleans", "Deep cleans"],
    jobsBaseline: 34,
    minRating: 4.6,
  },
  carpet_cleaning: {
    certs: ["Carpet Machine Cert"],
    unlocksJobTypes: [
      "Carpet shampoo jobs",
      "Stain treatment",
      "Area rug cleaning",
      "Pet odor treatment",
    ],
    usedInPct: 35,
    primaryService: "cleaning",
    avgEarningsPerJob: 30,
    estimatedWeeklyUsd: 28,
    estimatedMonthlyJobs: 6,
    requiredFor: ["Carpet shampoo jobs"],
    jobsBaseline: 12,
    prereqCapabilities: ["deep_cleaning"],
    minRating: 4.5,
  },
  bathroom_sanitation: {
    certs: ["Sanitation Protocol"],
    unlocksJobTypes: [
      "Bathroom-heavy cleans",
      "Restroom sanitation",
      "Move-out bathrooms",
      "Commercial restrooms",
    ],
    usedInPct: 52,
    primaryService: "cleaning",
    avgEarningsPerJob: 18,
    estimatedWeeklyUsd: 22,
    estimatedMonthlyJobs: 8,
    requiredFor: ["Bathroom-heavy cleans"],
    jobsBaseline: 18,
    prereqCapabilities: ["deep_cleaning"],
    minRating: 4.5,
  },
  tv_mounting: {
    certs: ["Mount Safety"],
    unlocksJobTypes: [
      "TV Installation",
      "Home Theater Setup",
      "Smart Display Installation",
      "Commercial AV Mounting",
    ],
    usedInPct: 61,
    primaryService: "install",
    avgEarningsPerJob: 45,
    estimatedWeeklyUsd: 58,
    estimatedMonthlyJobs: 9,
    requiredFor: ["TV installation", "Wall mounts"],
    jobsBaseline: 15,
    prereqCapabilities: ["furniture_assembly"],
    minRating: 4.8,
  },
  appliance_install: {
    certs: ["Appliance Install"],
    unlocksJobTypes: [
      "Washer/dryer install",
      "Fridge delivery + install",
      "Dishwasher hookup",
      "Range install",
    ],
    usedInPct: 48,
    primaryService: "install",
    avgEarningsPerJob: 52,
    estimatedWeeklyUsd: 64,
    estimatedMonthlyJobs: 8,
    requiredFor: ["Washer/dryer", "Appliance delivery + install"],
    jobsBaseline: 9,
    prereqCapabilities: ["heavy_lifting"],
    minRating: 4.7,
  },
};

export function proficiencyFromScore(score: number | null, earned: boolean): 0 | 1 | 2 | 3 {
  if (!earned) return 0;
  if (score == null) return 1;
  if (score >= 90) return 3; // Elite
  if (score >= 75) return 2; // Solid
  return 1; // Building
}

function proofForCapability(
  id: Capability,
  earned: boolean,
  verified: boolean,
  reviews: Review[] | undefined,
  workerId: string | undefined,
): CapabilityProfile["proof"] {
  const meta = CAPABILITY_META[id];
  const tagged = (reviews ?? []).filter(
    (r) =>
      (!workerId || r.subjectWorkerId === workerId) &&
      (r.capabilityTags ?? []).includes(id),
  );
  const jobsCompleted = earned
    ? Math.max(meta.jobsBaseline, tagged.length * 8)
    : 0;
  const avgRating =
    tagged.length > 0
      ? Math.round(
          (tagged.reduce((s, r) => s + r.rating, 0) / tagged.length) * 10,
        ) / 10
      : earned
        ? 4.9
        : null;

  const badges: string[] = [];
  if (verified) badges.push("Customer Verified");
  if (earned) {
    for (const cert of meta.certs) badges.push(cert);
  }

  return { jobsCompleted, avgRating, badges };
}

export function buildCapabilityProfile(
  id: Capability,
  earnedIds: Capability[],
  reliability: CapabilityReliabilityBreakdown,
  opts?: { reviews?: Review[]; workerId?: string },
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
    whyMatters: {
      usedInPct: meta.usedInPct,
      serviceLabel: SERVICE_LABEL[meta.primaryService],
      avgEarningsPerJob: meta.avgEarningsPerJob,
      estimatedWeeklyUsd: meta.estimatedWeeklyUsd,
      estimatedMonthlyJobs: meta.estimatedMonthlyJobs,
      requiredFor: meta.requiredFor,
    },
    proof: proofForCapability(
      id,
      earned,
      verified,
      opts?.reviews,
      opts?.workerId,
    ),
  };
}

/**
 * Fastest path to unlock a locked capability — prereqs, rating, cert, assessment.
 * Computed against the worker's current profile (earned skills + rating).
 */
export function unlockPathFor(
  cap: Capability,
  ctx: { earnedIds: Capability[]; ratingsAvg: number },
): UnlockPath {
  const meta = CAPABILITY_META[cap];
  const coach = COACHING_BY_CAPABILITY[cap]
    ? COACHING_MODULES[COACHING_BY_CAPABILITY[cap]]
    : null;
  const certMins = coach?.durationMin ?? 8;
  const minRating = meta.minRating ?? 4.5;
  const requirements: UnlockRequirement[] = [];

  for (const prereq of meta.prereqCapabilities ?? []) {
    requirements.push({
      id: `prereq-${prereq}`,
      label: `${CAPABILITY_LABEL[prereq]} (Complete)`,
      done: ctx.earnedIds.includes(prereq),
    });
  }

  requirements.push({
    id: "rating",
    label: `Customer Rating ${minRating.toFixed(1)}+`,
    done: ctx.ratingsAvg >= minRating,
  });

  requirements.push({
    id: "cert",
    label: `Complete ${certMins}-minute certification`,
    done: false,
  });

  requirements.push({
    id: "assessment",
    label: "Pass practical assessment",
    done: false,
  });

  const doneCount = requirements.filter((r) => r.done).length;
  return {
    requirements,
    doneCount,
    total: requirements.length,
  };
}

/** Locked capabilities sorted by estimated weekly earning opportunity (highest first). */
export function growthOpportunities(
  capabilities: CapabilityProfile[],
): CapabilityProfile[] {
  return capabilities
    .filter((c) => !c.earned)
    .sort(
      (a, b) =>
        b.whyMatters.estimatedWeeklyUsd - a.whyMatters.estimatedWeeklyUsd,
    );
}

/** All catalog capabilities for a worker — earned first, then addable. */
export function buildWorkerCapabilityProfiles(
  earnedIds: Capability[],
  reliability: CapabilityReliabilityBreakdown,
  opts?: { reviews?: Review[]; workerId?: string },
): CapabilityProfile[] {
  const earned = earnedIds.map((id) =>
    buildCapabilityProfile(id, earnedIds, reliability, opts),
  );
  const rest = ALL_CAPABILITIES.filter((id) => !earnedIds.includes(id)).map((id) =>
    buildCapabilityProfile(id, earnedIds, reliability, opts),
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

/** Score-band label from skill score (0–100). Matches badge copy. */
export function reliabilityBand(score: number | null): "Elite" | "Solid" | "Building" | null {
  if (score == null) return null;
  if (score >= 90) return "Elite";
  if (score >= 75) return "Solid";
  return "Building";
}

/** Coaching impact preview — score lift + earnings + unlocked jobs. */
export function coachingImpact(cap: CapabilityProfile): {
  from: number;
  to: number;
  weeklyUsd: number;
  unlocks: string[];
  durationMin: number;
  title: string;
} | null {
  if (!cap.coachingModuleId) return null;
  const coach = COACHING_MODULES[cap.coachingModuleId];
  if (!coach) return null;
  const from = cap.reliabilityScore ?? 50;
  const to = Math.min(100, from + coach.reliabilityBoost);
  return {
    from,
    to,
    weeklyUsd: Math.round(cap.whyMatters.estimatedWeeklyUsd * 0.68),
    unlocks: cap.unlocksJobTypes.slice(0, 2),
    durationMin: coach.durationMin,
    title: coach.title,
  };
}

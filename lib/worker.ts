import type { Capability, CapabilityJob, CapabilityWorker } from "./capabilities";
import { CAPABILITY_LABEL } from "./capabilities";
import {
  buildWorkerCapabilityProfiles,
  type CapabilityProfile,
} from "./capability-profile";
import { coachingModuleFor } from "./coaching";
import { evaluate, type ScorePayload, type Tier } from "./engine";
import type { CapabilityReliabilityBreakdown, Review } from "./reviews";
import { capabilityReliabilityBreakdown } from "./reviews";

/**
 * Shared worker profile — one object for Progress, matching, ops, and Copilot.
 * Built from CapabilityWorker + reliability engine + reviews (never hardcoded in UI).
 */
export type WorkerProfile = {
  id: string;
  name: string;
  city: string;
  avatar: string;
  tier: Tier;
  reliability: number;
  /** Jobs completed — used for Recruit→Certified progress framing. */
  jobsCompleted: number;
  capabilities: CapabilityProfile[];
  /** Earned capability ids — convenience for match/set overlap. */
  earnedCapabilityIds: Capability[];
  ratingsAvg: number;
  ratingsCount: number;
  scorePayload: ScorePayload;
  reliabilityBreakdown: CapabilityReliabilityBreakdown;
};

export type MatchReason = {
  id: string;
  label: string;
  /** Contribution toward match score (points). */
  contribution: number;
  detail: string;
  positive: boolean;
};

export type MatchResult = {
  score: number;
  reasons: MatchReason[];
  coachingHook?: {
    capability: Capability;
    message: string;
    moduleId?: string;
    jobsUnlocked: number;
  };
};

export function buildWorkerProfile(
  worker: CapabilityWorker,
  reviews: Review[],
  signalsOverride?: CapabilityWorker["signals"],
): WorkerProfile {
  const signals = signalsOverride ?? worker.signals;
  const scorePayload = evaluate(signals);
  const reliabilityBreakdown = capabilityReliabilityBreakdown(
    reviews,
    worker.id,
    worker.capabilities,
  );
  const capabilities = buildWorkerCapabilityProfiles(
    worker.capabilities,
    reliabilityBreakdown,
    { reviews, workerId: worker.id },
  );
  const mine = reviews.filter((r) => r.subjectWorkerId === worker.id);
  const ratingsAvg =
    mine.length === 0
      ? signals.avgRating
      : mine.reduce((a, r) => a + r.rating, 0) / mine.length;

  return {
    id: worker.id,
    name: worker.name,
    city: worker.city,
    avatar: worker.avatar,
    tier: scorePayload.tier,
    reliability: scorePayload.score,
    jobsCompleted: signals.jobsCompleted,
    capabilities,
    earnedCapabilityIds: worker.capabilities,
    ratingsAvg: Math.round(ratingsAvg * 10) / 10,
    ratingsCount: mine.length,
    scorePayload,
    reliabilityBreakdown,
  };
}

/**
 * Explainable match — same numbers as Capability Profile + tier system.
 * Score = weighted blend of capability overlap, reliability, rating, location, specialty.
 */
export function matchScore(
  profile: WorkerProfile,
  job: CapabilityJob,
): MatchResult {
  const have = new Set(profile.earnedCapabilityIds);
  const required = job.requires;
  const hit = required.filter((c) => have.has(c));
  const missing = required.filter((c) => !have.has(c));
  const capPct =
    required.length === 0 ? 100 : Math.round((hit.length / required.length) * 100);

  // Weights sum to 100
  const capPts = Math.round(capPct * 0.45);
  const relPts = Math.round((profile.reliability / 100) * 25);
  const ratingPts = Math.round((profile.ratingsAvg / 5) * 15);
  const locationPts = profile.city.split(",")[0]?.trim() === job.city.split(",")[0]?.trim()
    ? 10
    : profile.city.includes(job.city.split(",")[0]?.trim() ?? "")
      ? 8
      : 4;
  const specialtyCaps = hit.filter((c) => {
    const p = profile.capabilities.find((x) => x.id === c);
    return p && p.proficiency >= 2;
  });
  const specialtyPts = Math.min(5, specialtyCaps.length * 2);

  const raw = capPts + relPts + ratingPts + locationPts + specialtyPts;
  const score = Math.min(100, Math.round(raw));

  const reasons: MatchReason[] = [
    {
      id: "capabilities",
      label: "Capability match",
      contribution: capPts,
      detail:
        required.length === 0
          ? "No specialty requirements"
          : `${hit.length}/${required.length} required skills · ${hit.map((c) => CAPABILITY_LABEL[c]).join(", ") || "none"}`,
      positive: capPct >= 70,
    },
    {
      id: "reliability",
      label: "Reliability",
      contribution: relPts,
      detail: `Score ${profile.reliability} · ${profile.tier}`,
      positive: profile.reliability >= 62,
    },
    {
      id: "rating",
      label: "Rating fit",
      contribution: ratingPts,
      detail: `${profile.ratingsAvg.toFixed(1)}★ · ${profile.ratingsCount} review${profile.ratingsCount === 1 ? "" : "s"}`,
      positive: profile.ratingsAvg >= 4.2,
    },
    {
      id: "location",
      label: "Location",
      contribution: locationPts,
      detail: `${profile.city} → ${job.city}`,
      positive: locationPts >= 8,
    },
    {
      id: "specialty",
      label: "Specialized skills",
      contribution: specialtyPts,
      detail:
        specialtyCaps.length > 0
          ? specialtyCaps.map((c) => CAPABILITY_LABEL[c]).join(", ")
          : "No solid/elite specialties on this job yet",
      positive: specialtyCaps.length > 0,
    },
  ].sort((a, b) => b.contribution - a.contribution);

  let coachingHook: MatchResult["coachingHook"];
  if (missing.length > 0) {
    const gap = missing[0];
    const mod = coachingModuleFor(gap);
    // Approximate jobs unlocked if they earn this capability (same service catalog length proxy)
    const jobsUnlocked = 4 + missing.length * 2;
    coachingHook = {
      capability: gap,
      message: `Improve ${CAPABILITY_LABEL[gap]} to unlock ~${jobsUnlocked} more jobs`,
      moduleId: mod?.id,
      jobsUnlocked,
    };
  } else {
    // Strengthen weakest earned required skill
    const weakest = [...hit]
      .map((c) => profile.capabilities.find((p) => p.id === c)!)
      .filter(Boolean)
      .sort(
        (a, b) =>
          (a.reliabilityScore ?? 0) - (b.reliabilityScore ?? 0),
      )[0];
    if (weakest && (weakest.proficiency ?? 0) < 3) {
      const mod = coachingModuleFor(weakest.id);
      coachingHook = {
        capability: weakest.id,
        message: `Improve ${weakest.label} to unlock more priority matches`,
        moduleId: mod?.id,
        jobsUnlocked: 6,
      };
    }
  }

  return { score, reasons, coachingHook };
}

/** Numeric-only helper for call sites that only need the %. */
export function matchPct(profile: WorkerProfile, job: CapabilityJob): number {
  return matchScore(profile, job).score;
}

/** Overlap-only % — legacy CapabilityWorker path (ops that haven't built a profile yet). */
export function overlapMatchPct(
  worker: Pick<CapabilityWorker, "capabilities">,
  job: Pick<CapabilityJob, "requires">,
): number {
  if (job.requires.length === 0) return 100;
  const have = new Set(worker.capabilities);
  const hit = job.requires.filter((c) => have.has(c)).length;
  return Math.round((hit / job.requires.length) * 100);
}

export function nextBestActionForProfile(profile: WorkerProfile): string {
  return profile.scorePayload.nextBestAction;
}

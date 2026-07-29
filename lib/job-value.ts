import {
  CAPABILITY_LABEL,
  jobPayTotal,
  type Capability,
  type CapabilityJob,
} from "./capabilities";
import { nextTierName, type Tier } from "./engine";
import { SHORTAGES } from "./marketplace";
import type { WorkerProfile } from "./worker";

/** Worker-facing offer framing — derived from shared profile + job, never hardcoded in UI. */
export type JobIncentive = {
  kind: "surge" | "completion" | "streak";
  label: string;
  amountUsd: number;
};

export type JobBundle = {
  jobId: string;
  title: string;
  payUsd: number;
};

export type WorkerJobOffer = {
  payUsd: number;
  effectiveHourly: number;
  estHours: number;
  estHoursWithTravel: number;
  distanceMi: number;
  driveMin: number;
  slotLabel: string;
  scheduleLine: string;
  weekEarnings: number;
  weekGoal: number;
  weekAfterClaim: number;
  progressLine: string;
  ptsToNextTier: number;
  nextTier: Tier | null;
  tierProgressLabel: string;
  incentive: JobIncentive | null;
  bundleWith: JobBundle | null;
  qualified: boolean;
  missing: Capability[];
  missingLabel: string | null;
  coachingLine: string | null;
};

/** Illustrative travel seeds for the demo catalog — calibrated per job id. */
const TRAVEL_BY_JOB: Record<string, { distanceMi: number; driveMin: number }> = {
  "job-move-2br": { distanceMi: 4, driveMin: 12 },
  "job-move-office": { distanceMi: 6, driveMin: 18 },
  "job-move-studio": { distanceMi: 3, driveMin: 10 },
  "job-clean-deep": { distanceMi: 5, driveMin: 15 },
  "job-clean-apt": { distanceMi: 2, driveMin: 8 },
  "job-clean-carpet": { distanceMi: 4, driveMin: 14 },
  "job-del-same": { distanceMi: 7, driveMin: 20 },
  "job-del-route": { distanceMi: 11, driveMin: 28 },
  "job-tv-mount": { distanceMi: 3, driveMin: 9 },
  "job-appliance": { distanceMi: 8, driveMin: 22 },
  "job-shelf": { distanceMi: 2, driveMin: 7 },
};

/** Readable start labels from slot tokens like "Sat AM" / "Sun PM". */
const SLOT_START: Record<string, string> = {
  "Sat AM": "Sat 10 AM",
  "Sat PM": "Sat 2 PM",
  "Sun AM": "Sun 10 AM",
  "Sun PM": "Sun 2 PM",
  "Fri PM": "Fri 3 PM",
  "Thu PM": "Thu 3 PM",
  Weekday: "Weekday 11 AM",
  Eve: "Today 6 PM",
};

function travelFor(job: CapabilityJob): { distanceMi: number; driveMin: number } {
  if (job.distanceMi != null && job.driveMin != null) {
    return { distanceMi: job.distanceMi, driveMin: job.driveMin };
  }
  return TRAVEL_BY_JOB[job.id] ?? { distanceMi: 5, driveMin: 15 };
}

function estJobHours(job: CapabilityJob): number {
  return (
    job.jobBrief?.estDurationHours ??
    job.clarity?.estimatedHours ??
    defaultHoursForService(job)
  );
}

function defaultHoursForService(job: CapabilityJob): number {
  switch (job.service) {
    case "moving":
      return 3;
    case "cleaning":
      return 2.5;
    case "delivery":
      return 1.5;
    case "install":
      return 1.5;
    default:
      return 2;
  }
}

function slotLabel(job: CapabilityJob): string {
  return SLOT_START[job.slot] ?? job.slot;
}

function tierProgressFromProfile(profile: WorkerProfile): string {
  const next = nextTierName(profile.tier);
  if (!next) return "Elite · hold your streak";

  const pts = profile.scorePayload.pointsToNextTier;
  const jobsCompleted = profile.jobsCompleted;

  // Mirror engine: Recruit clears at score≥62 AND jobsCompleted≥3.
  if (profile.tier === "Recruit") {
    const jobsRemaining = Math.max(1, 3 - jobsCompleted);
    return `${jobsRemaining} job${jobsRemaining === 1 ? "" : "s"} from ${next}`;
  }

  if (pts <= 0) return `Ready for ${next}`;
  if (pts <= 4) return `1 job from ${next}`;
  if (pts <= 12) return `2 jobs from ${next}`;
  return `${pts} pts from ${next}`;
}

function shortageIncentive(
  job: CapabilityJob,
  incentiveUsd: number,
): JobIncentive | null {
  const city = job.city.split(",")[0]?.trim();
  const hit = SHORTAGES.some(
    (s) => s.gap < 0 && s.city === city && s.slot === job.slot,
  );
  if (hit && incentiveUsd > 0) {
    return {
      kind: "surge",
      label: `+$${incentiveUsd} surge`,
      amountUsd: incentiveUsd,
    };
  }

  // Demo density: Phoenix Sun PM is undersupplied in the marketplace seed.
  if (job.id === "job-move-office" && incentiveUsd > 0) {
    return {
      kind: "surge",
      label: `+$${incentiveUsd} surge`,
      amountUsd: incentiveUsd,
    };
  }

  if (job.id === "job-tv-mount") {
    return {
      kind: "completion",
      label: "+$15 completion bonus",
      amountUsd: 15,
    };
  }

  return null;
}

function findBundle(
  job: CapabilityJob,
  nearby: CapabilityJob[],
): JobBundle | null {
  const city = job.city.split(",")[0]?.trim();
  const peer = nearby.find((candidate) => {
    if (candidate.id === job.id) return false;
    return candidate.city.split(",")[0]?.trim() === city;
  });
  if (!peer) return null;

  return {
    jobId: peer.id,
    title: peer.title,
    payUsd: jobPayTotal(peer),
  };
}

export function buildWorkerJobOffer({
  profile,
  job,
  weekEarnings,
  weekGoal,
  nearbyJobs = [],
  incentiveUsd = 15,
}: {
  profile: WorkerProfile;
  job: CapabilityJob;
  weekEarnings: number;
  weekGoal: number;
  nearbyJobs?: CapabilityJob[];
  incentiveUsd?: number;
}): WorkerJobOffer {
  const payUsd = jobPayTotal(job);
  const travel = travelFor(job);
  const estHours = estJobHours(job);
  const travelHours = Math.round((travel.driveMin / 60) * 10) / 10;
  const estHoursWithTravel =
    job.estHoursWithTravel ??
    Math.round((estHours + travelHours) * 10) / 10;
  const effectiveHourly = Math.max(
    1,
    Math.round(payUsd / Math.max(0.5, estHoursWithTravel)),
  );
  const weekAfterClaim = weekEarnings + payUsd;
  const next = nextTierName(profile.tier);
  const ptsToNextTier = profile.scorePayload.pointsToNextTier;
  const tierLabel = tierProgressFromProfile(profile);
  const have = new Set(profile.earnedCapabilityIds);
  const missing = job.requires.filter((c) => !have.has(c));
  const gap = missing[0];
  const jobsUnlocked = gap ? 4 + missing.length * 2 : 0;

  return {
    payUsd,
    effectiveHourly,
    estHours,
    estHoursWithTravel,
    distanceMi: travel.distanceMi,
    driveMin: travel.driveMin,
    slotLabel: slotLabel(job),
    scheduleLine: `${slotLabel(job)} · ~${estHoursWithTravel} hrs · ${travel.distanceMi} mi / ${travel.driveMin} min`,
    weekEarnings,
    weekGoal,
    weekAfterClaim,
    progressLine: `+$${payUsd} → $${weekAfterClaim} this week · ${tierLabel}`,
    ptsToNextTier,
    nextTier: next,
    tierProgressLabel: tierLabel,
    incentive: shortageIncentive(job, incentiveUsd),
    bundleWith: findBundle(job, nearbyJobs),
    qualified: missing.length === 0,
    missing,
    missingLabel: gap ? CAPABILITY_LABEL[gap] : null,
    coachingLine:
      gap != null
        ? `Add ${CAPABILITY_LABEL[gap]} to unlock ~${jobsUnlocked} more jobs →.`
        : null,
  };
}

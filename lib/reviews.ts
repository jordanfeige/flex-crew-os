import type { Capability, Service } from "./capabilities";
import { SERVICE_CAPABILITIES } from "./capabilities";

export type Review = {
  id: string;
  jobId: string;
  subjectWorkerId: string;
  authorType: "customer" | "worker";
  authorName: string;
  rating: number; // 1–5
  comment: string;
  capabilityTags?: Capability[];
  ts: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Map 1–5 stars → 0–100 reliability points. */
function ratingToPts(rating: number): number {
  return clamp(Math.round((rating / 5) * 100), 0, 100);
}

/**
 * Per-capability score from tagged reviews for one worker (0–100).
 * Untagged reviews do not affect a specific capability.
 * No tagged reviews → null (caller decides fallback).
 */
export function capabilityScore(
  reviews: Review[],
  cap: Capability,
  workerId?: string,
): number | null {
  const tagged = reviews.filter(
    (r) =>
      (!workerId || r.subjectWorkerId === workerId) &&
      (r.capabilityTags ?? []).includes(cap),
  );
  if (tagged.length === 0) return null;
  const avg =
    tagged.reduce((sum, r) => sum + ratingToPts(r.rating), 0) / tagged.length;
  return clamp(Math.round(avg), 0, 100);
}

/**
 * Overall reliability from all reviews for a worker (0–100).
 * Falls back to 50 when no reviews yet.
 */
export function overallReliability(reviews: Review[], workerId?: string): number {
  const mine = workerId
    ? reviews.filter((r) => r.subjectWorkerId === workerId)
    : reviews;
  if (mine.length === 0) return 50;
  const avg =
    mine.reduce((sum, r) => sum + ratingToPts(r.rating), 0) / mine.length;
  return clamp(Math.round(avg), 0, 100);
}

/**
 * Service score = mean of that service's capability scores.
 * Missing capability on the worker counts as 35 (drags the service down).
 * Capability with no reviews yet uses 55 (neutral-proving).
 */
export function serviceReliability(
  reviews: Review[],
  workerId: string,
  service: Service,
  workerCapabilities: Capability[],
): number {
  const caps = SERVICE_CAPABILITIES[service];
  const have = new Set(workerCapabilities);
  const parts = caps.map((cap) => {
    if (!have.has(cap)) return 35;
    return capabilityScore(reviews, cap, workerId) ?? 55;
  });
  return clamp(
    Math.round(parts.reduce((a, b) => a + b, 0) / parts.length),
    0,
    100,
  );
}

export type CapabilityReliabilityBreakdown = {
  overall: number;
  byService: Record<Service, number>;
  byCapability: Partial<Record<Capability, number>>;
};

export function capabilityReliabilityBreakdown(
  reviews: Review[],
  workerId: string,
  workerCapabilities: Capability[],
): CapabilityReliabilityBreakdown {
  const services: Service[] = ["moving", "cleaning", "delivery", "install"];
  const byService = Object.fromEntries(
    services.map((s) => [
      s,
      serviceReliability(reviews, workerId, s, workerCapabilities),
    ]),
  ) as Record<Service, number>;

  const byCapability: Partial<Record<Capability, number>> = {};
  for (const cap of workerCapabilities) {
    const v = capabilityScore(reviews, cap, workerId);
    if (v != null) byCapability[cap] = v;
  }

  return {
    overall: overallReliability(reviews, workerId),
    byService,
    byCapability,
  };
}

import type { Signals } from "./engine";

export type Service = "moving" | "cleaning" | "delivery" | "install";

export type Capability =
  | "heavy_lifting"
  | "furniture_assembly"
  | "appliance_install"
  | "carpet_cleaning"
  | "tv_mounting"
  | "deep_cleaning"
  | "bathroom_sanitation"
  | "driving"
  | "packing";

export const SERVICES: Service[] = ["moving", "cleaning", "delivery", "install"];

export const SERVICE_LABEL: Record<Service, string> = {
  moving: "Moving",
  cleaning: "Cleaning",
  delivery: "Delivery",
  install: "Install",
};

export const CAPABILITY_LABEL: Record<Capability, string> = {
  heavy_lifting: "Heavy lifting",
  furniture_assembly: "Furniture assembly",
  appliance_install: "Appliance install",
  carpet_cleaning: "Carpet cleaning",
  tv_mounting: "TV mounting",
  deep_cleaning: "Deep cleaning",
  bathroom_sanitation: "Bathroom sanitation",
  driving: "Driving",
  packing: "Packing",
};

/** Capabilities that feed each service's reliability score. */
export const SERVICE_CAPABILITIES: Record<Service, Capability[]> = {
  moving: ["heavy_lifting", "furniture_assembly", "packing", "driving"],
  cleaning: ["deep_cleaning", "carpet_cleaning", "bathroom_sanitation"],
  delivery: ["driving", "packing", "heavy_lifting"],
  install: ["tv_mounting", "appliance_install", "furniture_assembly"],
};

export type CapabilityWorker = {
  id: string;
  name: string;
  city: string;
  avatar: string;
  capabilities: Capability[];
  signals: Signals;
};

export type CapabilityJob = {
  id: string;
  title: string;
  service: Service;
  city: string;
  slot: string;
  payUsd: number;
  requires: Capability[];
  /** Optional clarity payload for Job Clarity screen */
  clarity?: JobClarity;
};

export type JobClarity = {
  overview: string[];
  tasks: string[];
  equipment: string[];
  heavyItems: string[];
  riskFlags: string[];
  estimatedHours: number;
  crewRequired: number;
  confidencePct: number;
  pay: { base: number; mileage: number; premium: number };
};

/** % of job.requires the worker has (0–100). */
export function matchScore(
  worker: Pick<CapabilityWorker, "capabilities">,
  job: Pick<CapabilityJob, "requires">,
): number {
  if (job.requires.length === 0) return 100;
  const have = new Set(worker.capabilities);
  const hit = job.requires.filter((c) => have.has(c)).length;
  return Math.round((hit / job.requires.length) * 100);
}

export function jobsForService(service: Service, jobs: CapabilityJob[]): CapabilityJob[] {
  return jobs.filter((j) => j.service === service);
}

export function workerHasCapability(
  worker: Pick<CapabilityWorker, "capabilities">,
  cap: Capability,
): boolean {
  return worker.capabilities.includes(cap);
}

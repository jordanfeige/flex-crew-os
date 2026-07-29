import type { Capability } from "./capabilities";
import { CAPABILITY_LABEL } from "./capabilities";

/** Coaching modules — referenced by Capability.coachingModuleId. */
export type CoachingModule = {
  id: string;
  title: string;
  durationMin: number;
  reliabilityBoost: number;
  capabilityId: Capability;
  summary: string;
};

export const COACHING_MODULES: Record<string, CoachingModule> = {
  "mod-heavy-lift": {
    id: "mod-heavy-lift",
    title: "Safe heavy lifting",
    durationMin: 5,
    reliabilityBoost: 2,
    capabilityId: "heavy_lifting",
    summary: "Body mechanics + two-person lifts for sofas and appliances.",
  },
  "mod-assembly": {
    id: "mod-assembly",
    title: "Furniture assembly fundamentals",
    durationMin: 5,
    reliabilityBoost: 2,
    capabilityId: "furniture_assembly",
    summary: "Hardware sorting, sequence, and damage prevention.",
  },
  "mod-packing": {
    id: "mod-packing",
    title: "Pro packing standards",
    durationMin: 5,
    reliabilityBoost: 2,
    capabilityId: "packing",
    summary: "Fragile wrap, box density, and labeled loads.",
  },
  "mod-driving": {
    id: "mod-driving",
    title: "Cargo securement & routing",
    durationMin: 5,
    reliabilityBoost: 2,
    capabilityId: "driving",
    summary: "Strap patterns, weight balance, and urban routing.",
  },
  "mod-deep-clean": {
    id: "mod-deep-clean",
    title: "Deep clean checklist",
    durationMin: 8,
    reliabilityBoost: 2,
    capabilityId: "deep_cleaning",
    summary: "Room-by-room standards customers rate highest.",
  },
  "mod-carpet": {
    id: "mod-carpet",
    title: "Carpet shampoo basics",
    durationMin: 6,
    reliabilityBoost: 2,
    capabilityId: "carpet_cleaning",
    summary: "Machine setup, dwell time, and dry-down.",
  },
  "mod-bathroom": {
    id: "mod-bathroom",
    title: "Bathroom sanitation protocol",
    durationMin: 5,
    reliabilityBoost: 2,
    capabilityId: "bathroom_sanitation",
    summary: "Disinfection order and product safety.",
  },
  "mod-tv": {
    id: "mod-tv",
    title: "TV mounting safety",
    durationMin: 8,
    reliabilityBoost: 2,
    capabilityId: "tv_mounting",
    summary: "Stud find, weight ratings, cable management.",
  },
  "mod-appliance": {
    id: "mod-appliance",
    title: "Appliance install checklist",
    durationMin: 8,
    reliabilityBoost: 2,
    capabilityId: "appliance_install",
    summary: "Water lines, leveling, and leak checks.",
  },
};

export const COACHING_BY_CAPABILITY: Record<Capability, string> = {
  heavy_lifting: "mod-heavy-lift",
  furniture_assembly: "mod-assembly",
  packing: "mod-packing",
  driving: "mod-driving",
  deep_cleaning: "mod-deep-clean",
  carpet_cleaning: "mod-carpet",
  bathroom_sanitation: "mod-bathroom",
  tv_mounting: "mod-tv",
  appliance_install: "mod-appliance",
};

export function coachingModuleFor(cap: Capability): CoachingModule {
  const id = COACHING_BY_CAPABILITY[cap];
  return COACHING_MODULES[id];
}

export function coachingTitle(cap: Capability): string {
  return coachingModuleFor(cap)?.title ?? `Improve ${CAPABILITY_LABEL[cap]}`;
}

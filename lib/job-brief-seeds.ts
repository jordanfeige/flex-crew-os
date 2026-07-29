import type { BookingInputs, JobBrief } from "./jobBrief";

export const HERO_JOB_ID = "job-move-2br";

export const HERO_BOOKING_INPUTS: BookingInputs = {
  bedrooms: 2,
  floorPickup: 2,
  elevator: true,
  parking: "Street parking at pickup; garage unload at destination",
  destinationNotes: "Destination has garage access for truck staging and unload.",
  items: [
    "queen bed",
    "75in wall-mounted TV",
    "92in sectional",
    "treadmill",
    "piano",
    "safe",
  ],
  specialItems: ["piano", "92in sectional", "safe", "75in TV"],
  customerNotes:
    "Protect the hardwood floors. The staircase has a narrow turn. Rain is forecast during the move window.",
};

/**
 * Persisted hero fallback. It is complete and instant even when the model,
 * network, or provider key is unavailable.
 */
export const HERO_SEED_BRIEF: JobBrief = {
  executiveSummary:
    "Move a furnished two-bedroom apartment from a second-floor pickup to a garage-access destination. Use a three-person crew for the piano, safe, sectional, treadmill, and wall-mounted TV; protect hardwood floors and plan the heavy-item path before loading.",
  estDurationHours: 3.8,
  crewSize: 3,
  tasks: [
    "Confirm inventory, elevator access, and the heavy-item path with the customer",
    "Protect hardwood floors, doorways, and the narrow staircase turn",
    "Remove and pack the wall-mounted 75in TV",
    "Disassemble and wrap the queen bed and 92in sectional",
    "Move the treadmill, piano, and safe with coordinated team lifts",
    "Load, secure, transport, unload, and reassemble at the destination",
  ],
  equipment: [
    "Furniture dolly",
    "Piano board",
    "Furniture pads",
    "Ratchet straps",
    "TV box or screen protector",
    "Basic disassembly tools",
  ],
  heavyItems: ["Piano", "92in sectional", "Safe", "Treadmill"],
  accessNotes: [
    "2nd-floor pickup",
    "Elevator available",
    "Street parking at pickup",
    "Garage unload at destination",
  ],
  riskFlags: [
    "Narrow staircase turn on the heavy-item path",
    "Rain forecast during the move window",
    "Wall-mounted TV requires careful removal and screen protection",
  ],
};

export function seededBriefForJob(jobId?: string): JobBrief | null {
  return jobId === HERO_JOB_ID ? HERO_SEED_BRIEF : null;
}

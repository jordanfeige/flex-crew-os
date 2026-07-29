import { z } from "zod";

export const JobBriefSchema = z.object({
  executiveSummary: z.string().min(1),
  estDurationHours: z.number().positive().max(24),
  crewSize: z.number().int().positive().max(12),
  tasks: z.array(z.string().min(1)).min(1),
  equipment: z.array(z.string().min(1)),
  heavyItems: z.array(z.string().min(1)),
  accessNotes: z.array(z.string().min(1)),
  riskFlags: z.array(z.string().min(1)),
});

export type JobBrief = z.infer<typeof JobBriefSchema>;

export const BookingInputsSchema = z.object({
  bedrooms: z.number().int().min(0).max(20),
  floorPickup: z.number().int().min(0).max(100),
  elevator: z.boolean(),
  parking: z.string().min(1).max(500),
  destinationNotes: z.string().max(2_000).optional(),
  items: z.array(z.string().min(1).max(200)).min(1).max(200),
  specialItems: z.array(z.string().min(1).max(200)).max(50).optional(),
  customerNotes: z.string().max(5_000).optional(),
});

export type BookingInputs = z.infer<typeof BookingInputsSchema>;

export const JobBriefRequestSchema = z.union([
  BookingInputsSchema,
  z.object({
    jobId: z.string().min(1).max(200).optional(),
    inputs: BookingInputsSchema,
  }),
]);

export type JobBriefSource = "ai" | "seed";

export function isJobBrief(value: unknown): value is JobBrief {
  return JobBriefSchema.safeParse(value).success;
}

function unique(values: string[]): string[] {
  return values.filter(
    (value, index, array) => value.trim() && array.indexOf(value) === index,
  );
}

/**
 * Deterministic, schema-valid fallback for bookings without a persisted seed.
 * This is deliberately practical and conservative; it never calls a model.
 */
export function fallbackJobBrief(inputs: BookingInputs): JobBrief {
  const itemText = [...inputs.items, ...(inputs.specialItems ?? [])].join(" ");
  const heavyItems = unique(
    [
      ...(inputs.specialItems ?? []),
      ...inputs.items.filter((item) =>
        /piano|safe|treadmill|sectional|appliance|washer|dryer|refrigerator|fridge/i.test(
          item,
        ),
      ),
    ].map((item) => item.trim()),
  );
  const largeItemCount = heavyItems.length;
  const crewSize = Math.min(
    4,
    Math.max(2, 2 + (largeItemCount >= 2 ? 1 : 0) + (inputs.bedrooms >= 4 ? 1 : 0)),
  );
  const estDurationHours = Math.min(
    10,
    Math.max(
      1.5,
      Math.round(
        (1.25 +
          inputs.bedrooms * 0.75 +
          inputs.items.length * 0.08 +
          largeItemCount * 0.35 +
          (inputs.floorPickup > 0 && !inputs.elevator ? 0.75 : 0)) *
          10,
      ) / 10,
    ),
  );

  const accessNotes = unique([
    inputs.floorPickup === 0
      ? "Ground-floor pickup"
      : `${inputs.floorPickup}${ordinalSuffix(inputs.floorPickup)}-floor pickup`,
    inputs.elevator ? "Elevator available" : "No elevator",
    inputs.parking,
    ...(inputs.destinationNotes ? [inputs.destinationNotes] : []),
  ]);

  const riskFlags = unique([
    ...(inputs.floorPickup > 0 && !inputs.elevator
      ? ["Stair carry required at pickup"]
      : []),
    ...(largeItemCount > 0
      ? ["Confirm a safe two-person path for marked heavy items"]
      : []),
    ...(itemText.match(/tv|mirror|glass|art|fragile/i)
      ? ["Protect fragile and glass items before loading"]
      : []),
  ]);

  return {
    executiveSummary: `${inputs.bedrooms}-bedroom move with ${inputs.items.length} listed item${inputs.items.length === 1 ? "" : "s"} from a ${inputs.floorPickup === 0 ? "ground-floor" : `${inputs.floorPickup}${ordinalSuffix(inputs.floorPickup)}-floor`} pickup. Plan for a crew of ${crewSize} and approximately ${estDurationHours} hours.`,
    estDurationHours,
    crewSize,
    tasks: unique([
      "Confirm inventory and access with the customer",
      "Protect floors, doorways, and listed fragile items",
      "Disassemble and wrap furniture as needed",
      "Load, secure, transport, and unload all listed items",
      "Reassemble furniture and complete a final item check",
    ]),
    equipment: unique([
      "Furniture dolly",
      "Furniture pads",
      "Ratchet straps",
      "Basic hand tools",
      ...(itemText.match(/tv/i) ? ["TV box or screen protector"] : []),
      ...(inputs.floorPickup > 0 ? ["Stair-climbing straps"] : []),
    ]),
    heavyItems,
    accessNotes,
    riskFlags,
  };
}

function ordinalSuffix(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return "th";
  if (value % 10 === 1) return "st";
  if (value % 10 === 2) return "nd";
  if (value % 10 === 3) return "rd";
  return "th";
}

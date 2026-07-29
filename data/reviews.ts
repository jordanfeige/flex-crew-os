import type { Capability, CapabilityJob, CapabilityWorker } from "@/lib/capabilities";
import type { Review } from "@/lib/reviews";
import { CREW } from "@/lib/data";

/** Extend crew with capabilities — jobs match on set overlap. */
export const WORKER_CAPABILITIES: Record<string, Capability[]> = {
  tanya: [
    "heavy_lifting",
    "furniture_assembly",
    "packing",
    "driving",
    "tv_mounting",
    "appliance_install",
    "deep_cleaning",
  ],
  maria: [
    "heavy_lifting",
    "furniture_assembly",
    "packing",
    "driving",
    "deep_cleaning",
    "carpet_cleaning",
    "bathroom_sanitation",
  ],
  deshawn: [
    "heavy_lifting",
    "furniture_assembly",
    "packing",
    "driving",
    // weak on cleaning / install — lower match + service scores
  ],
  kayla: ["packing", "driving"],
  sam: ["heavy_lifting", "driving", "packing", "carpet_cleaning"],
};

export function capabilityWorkers(): CapabilityWorker[] {
  return CREW.map((m) => ({
    ...m,
    capabilities: WORKER_CAPABILITIES[m.id] ?? ["packing"],
  }));
}

export function capabilityWorkerById(id: string): CapabilityWorker {
  const all = capabilityWorkers();
  return all.find((w) => w.id === id) ?? all[0];
}

/** Flagship demo job — must keep walkthrough media for Luke's Job Clarity beat. */
export const DEMO_JOB_ID = "job-move-2br";

/** 2–3 jobs per service — configuration, not new code paths. */
export const CAPABILITY_JOBS: CapabilityJob[] = [
  {
    id: "job-move-2br",
    title: "2BR apartment move",
    service: "moving",
    city: "Phoenix",
    slot: "Sat AM",
    payUsd: 186,
    requires: ["heavy_lifting", "furniture_assembly", "driving"],
    clarity: {
      overview: [
        "2-bedroom apartment",
        "2nd-floor pickup",
        "Elevator available",
        "Garage unload",
      ],
      keyFacts: ["2-bedroom", "2nd-floor pickup", "Elevator", "Garage unload"],
      tasks: [
        { label: "Wrap TV", sourceTimestamp: 42, sourcePhotoId: "ph-living" },
        { label: "Disassemble queen bed", sourceTimestamp: 118, sourcePhotoId: "ph-bed" },
        { label: "Remove wall-mounted TV", sourceTimestamp: 55, sourcePhotoId: "ph-living" },
        { label: "Protect hardwood floors", sourceTimestamp: 90 },
        { label: "Move treadmill", sourceTimestamp: 160, sourcePhotoId: "ph-stairs" },
      ],
      equipment: ["Dolly", "Furniture pads", "Ratchet straps", "TV box"],
      heavyItems: ["Piano", "92\" sectional", "Safe"],
      access: ["2nd floor", "Elevator available", "Garage unload", "Street parking"],
      riskFlags: [
        { label: "Narrow staircase", sourcePhotoId: "ph-stairs", sourceTimestamp: 145 },
        { label: "Rain forecast" },
      ],
      estimatedHours: 3.8,
      crewRequired: 3,
      confidencePct: 91,
      pay: { base: 142, mileage: 18, premium: 26 },
    },
    media: {
      video: {
        url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
        durationSec: 186,
        poster:
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80&auto=format&fit=crop",
      },
      photos: [
        {
          id: "ph-living",
          url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80&auto=format&fit=crop",
          caption: "Living room · wall-mounted TV + sectional",
        },
        {
          id: "ph-bed",
          url: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&q=80&auto=format&fit=crop",
          caption: "Bedroom · queen bed to disassemble",
        },
        {
          id: "ph-stairs",
          url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80&auto=format&fit=crop",
          caption: "Staircase · narrow turn — piano path",
        },
        {
          id: "ph-garage",
          url: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80&auto=format&fit=crop",
          caption: "Garage unload · truck staging",
        },
      ],
    },
  },
  {
    id: "job-move-office",
    title: "Office clear-out",
    service: "moving",
    city: "Phoenix",
    slot: "Sun PM",
    payUsd: 124,
    requires: ["heavy_lifting", "packing", "driving"],
    clarity: {
      overview: ["Small office", "Ground floor", "Loading dock"],
      keyFacts: ["Ground floor", "Loading dock", "Boxes + desks"],
      tasks: ["Pack desk drawers", "Protect glass partitions", "Load dock"],
      equipment: ["Dolly", "Pads", "Bins"],
      heavyItems: ["Standing desks"],
      access: ["Loading dock", "Street parking"],
      riskFlags: ["Tight elevator if dock full"],
      estimatedHours: 2.5,
      crewRequired: 2,
      confidencePct: 82,
      pay: { base: 98, mileage: 12, premium: 14 },
    },
    media: {
      video: {
        url: "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        durationSec: 15,
        poster:
          "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80&auto=format&fit=crop",
      },
      photos: [
        {
          id: "ph-office-1",
          url: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=600&q=80&auto=format&fit=crop",
          caption: "Open office · desks to clear",
        },
        {
          id: "ph-office-2",
          url: "https://images.unsplash.com/photo-1497215842964-222b430dc094?w=600&q=80&auto=format&fit=crop",
          caption: "Loading dock staging",
        },
      ],
    },
  },
  {
    id: "job-move-studio",
    title: "Studio move · stairs",
    service: "moving",
    city: "Tempe",
    slot: "Fri PM",
    payUsd: 96,
    requires: ["heavy_lifting", "furniture_assembly", "packing"],
  },
  {
    id: "job-clean-deep",
    title: "Deep clean · 3BR house",
    service: "cleaning",
    city: "Scottsdale",
    slot: "Sat AM",
    payUsd: 168,
    requires: ["deep_cleaning", "carpet_cleaning", "bathroom_sanitation"],
  },
  {
    id: "job-clean-apt",
    title: "Move-out clean",
    service: "cleaning",
    city: "Phoenix",
    slot: "Sun AM",
    payUsd: 112,
    requires: ["deep_cleaning", "bathroom_sanitation"],
  },
  {
    id: "job-clean-carpet",
    title: "Carpet shampoo · condo",
    service: "cleaning",
    city: "Mesa",
    slot: "Thu PM",
    payUsd: 88,
    requires: ["carpet_cleaning", "deep_cleaning"],
  },
  {
    id: "job-del-same",
    title: "Same-day furniture delivery",
    service: "delivery",
    city: "Phoenix",
    slot: "Sat PM",
    payUsd: 74,
    requires: ["driving", "heavy_lifting", "packing"],
  },
  {
    id: "job-del-route",
    title: "Route drop · 6 stops",
    service: "delivery",
    city: "Valley",
    slot: "Weekday",
    payUsd: 98,
    requires: ["driving", "packing"],
  },
  {
    id: "job-tv-mount",
    title: "TV installation · 75\"",
    service: "install",
    city: "Phoenix",
    slot: "Sun AM",
    payUsd: 132,
    requires: ["tv_mounting", "furniture_assembly"],
    clarity: {
      overview: [
        "Living room wall mount",
        "~90-minute install",
        "Stud wall",
        "Customer-supplied mount",
      ],
      tasks: [
        "Locate studs",
        "Mount bracket",
        "Hang & level TV",
        "Cable management",
        "Test HDMI",
      ],
      equipment: ["Stud finder", "Drill", "Level", "Cable covers"],
      heavyItems: ["75\" TV"],
      riskFlags: ["Brick veneer behind drywall"],
      estimatedHours: 1.5,
      crewRequired: 1,
      confidencePct: 96,
      pay: { base: 110, mileage: 8, premium: 14 },
    },
  },
  {
    id: "job-appliance",
    title: "Washer/dryer install",
    service: "install",
    city: "Chandler",
    slot: "Sat AM",
    payUsd: 148,
    requires: ["appliance_install", "heavy_lifting", "driving"],
  },
  {
    id: "job-shelf",
    title: "Floating shelf + assembly",
    service: "install",
    city: "Phoenix",
    slot: "Eve",
    payUsd: 64,
    requires: ["furniture_assembly", "tv_mounting"],
  },
];

/** Seed reviews — capability-tagged so engine scores are real. */
export const SEED_REVIEWS: Review[] = [
  {
    id: "r1",
    jobId: "job-move-2br",
    subjectWorkerId: "deshawn",
    authorType: "customer",
    authorName: "Priya K.",
    rating: 5,
    comment: "Great packing — fragile boxes arrived perfect.",
    capabilityTags: ["packing", "heavy_lifting"],
    ts: "2026-07-12T18:00:00Z",
  },
  {
    id: "r2",
    jobId: "job-move-office",
    subjectWorkerId: "deshawn",
    authorType: "customer",
    authorName: "Omar S.",
    rating: 4,
    comment: "Strong lift help, on time.",
    capabilityTags: ["heavy_lifting", "driving"],
    ts: "2026-07-08T16:00:00Z",
  },
  {
    id: "r3",
    jobId: "job-move-studio",
    subjectWorkerId: "deshawn",
    authorType: "worker",
    authorName: "Maria R.",
    rating: 4,
    comment: "Solid assembly partner on the bed frame.",
    capabilityTags: ["furniture_assembly"],
    ts: "2026-07-05T20:00:00Z",
  },
  {
    id: "r4",
    jobId: "job-del-same",
    subjectWorkerId: "deshawn",
    authorType: "customer",
    authorName: "Lee A.",
    rating: 5,
    comment: "Careful driver, easy drop.",
    capabilityTags: ["driving", "packing"],
    ts: "2026-06-28T14:00:00Z",
  },
  {
    id: "r5",
    jobId: "job-tv-mount",
    subjectWorkerId: "tanya",
    authorType: "customer",
    authorName: "Chris M.",
    rating: 5,
    comment: "Mounting was perfect — level first try.",
    capabilityTags: ["tv_mounting", "furniture_assembly"],
    ts: "2026-07-15T17:00:00Z",
  },
  {
    id: "r6",
    jobId: "job-clean-deep",
    subjectWorkerId: "maria",
    authorType: "customer",
    authorName: "Dana W.",
    rating: 5,
    comment: "Bathroom sanitation was spotless.",
    capabilityTags: ["bathroom_sanitation", "deep_cleaning"],
    ts: "2026-07-14T15:00:00Z",
  },
  {
    id: "r7",
    jobId: "job-clean-carpet",
    subjectWorkerId: "maria",
    authorType: "customer",
    authorName: "Sam O.",
    rating: 4,
    comment: "Carpet came out looking new.",
    capabilityTags: ["carpet_cleaning"],
    ts: "2026-07-10T19:00:00Z",
  },
  {
    id: "r8",
    jobId: "job-appliance",
    subjectWorkerId: "tanya",
    authorType: "worker",
    authorName: "Deshawn T.",
    rating: 5,
    comment: "Appliance hookup was clean.",
    capabilityTags: ["appliance_install"],
    ts: "2026-07-11T21:00:00Z",
  },
  {
    id: "r9",
    jobId: "job-move-2br",
    subjectWorkerId: "tanya",
    authorType: "customer",
    authorName: "Jordan F.",
    rating: 5,
    comment: "Elite crew energy — packing + lift.",
    capabilityTags: ["packing", "heavy_lifting", "driving"],
    ts: "2026-07-16T18:30:00Z",
  },
  {
    id: "r10",
    jobId: "job-del-route",
    subjectWorkerId: "sam",
    authorType: "customer",
    authorName: "Nina P.",
    rating: 2,
    comment: "Late to the first stop.",
    capabilityTags: ["driving"],
    ts: "2026-07-09T12:00:00Z",
  },
];

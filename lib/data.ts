import type { Signals, Tier } from "./engine";

export type CrewMember = {
  id: string;
  name: string;
  city: string;
  avatar: string;
  signals: Signals;
};

/** Engine computes scores — never hardcode them. */
export const CREW: CrewMember[] = [
  {
    id: "tanya",
    name: "Tanya B.",
    city: "Austin, TX",
    avatar: "TB",
    signals: {
      onTimeRate: 0.99,
      avgRating: 4.95,
      acceptanceRate: 0.95,
      jobsCompleted: 60,
      lateCancellations: 0,
      noShows: 0,
    },
  },
  {
    id: "maria",
    name: "Maria R.",
    city: "Denver, CO",
    avatar: "MR",
    signals: {
      onTimeRate: 0.9,
      avgRating: 4.6,
      acceptanceRate: 0.8,
      jobsCompleted: 25,
      lateCancellations: 1,
      noShows: 0,
    },
  },
  {
    id: "deshawn",
    name: "Deshawn T.",
    city: "Phoenix, AZ",
    avatar: "DT",
    signals: {
      onTimeRate: 0.8,
      avgRating: 4.3,
      acceptanceRate: 0.38,
      jobsCompleted: 5,
      lateCancellations: 1,
      noShows: 0,
    },
  },
  {
    id: "kayla",
    name: "Kayla P.",
    city: "Sioux Falls, SD",
    avatar: "KP",
    signals: {
      onTimeRate: 1.0,
      avgRating: 5.0,
      acceptanceRate: 1.0,
      jobsCompleted: 1,
      lateCancellations: 0,
      noShows: 0,
    },
  },
  {
    id: "sam",
    name: "Sam O.",
    city: "Tampa, FL",
    avatar: "SO",
    signals: {
      onTimeRate: 0.68,
      avgRating: 4.0,
      acceptanceRate: 0.4,
      jobsCompleted: 22,
      lateCancellations: 3,
      noShows: 1,
    },
  },
];

export const PIPELINE = {
  recruit: 312,
  shadow: 428,
  pro: 1040,
  elite: 220,
  dau: 2000,
} as const;

export const PERKS_BY_TIER: Record<Tier, string[]> = {
  Recruit: ["Building your record"],
  Shadow: ["Standard matching"],
  Pro: ["Priority matching", "Weekly payout"],
  Elite: ["Top-crew badge", "Surge access"],
};

export const MATCHED_JOBS: Record<
  Tier,
  { title: string; pay: string; note: string }[]
> = {
  Recruit: [
    { title: "Studio move · 2 hrs", pay: "$48", note: "Good proving job nearby" },
    { title: "Storage load-out", pay: "$62", note: "Partnered with a Pro" },
  ],
  Shadow: [
    { title: "2BR apartment move", pay: "$96", note: "Standard match" },
    { title: "Office clear-out", pay: "$110", note: "Sat AM · short drive" },
    { title: "Piano assist", pay: "$85", note: "Training credit eligible" },
  ],
  Pro: [
    { title: "Priority · 3BR house", pay: "$168", note: "Pro early access" },
    { title: "Priority · Same-day condo", pay: "$142", note: "Pro early access" },
    { title: "Corporate relocation", pay: "$210", note: "High rating required" },
  ],
  Elite: [
    { title: "Priority · Estate move", pay: "$320", note: "Elite first pick" },
    { title: "Priority · White-glove", pay: "$280", note: "Elite first pick" },
    { title: "VIP same-day", pay: "$240", note: "Reserved for Elite" },
  ],
};

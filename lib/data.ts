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
  bronze: 312,
  silver: 428,
  gold: 1040,
  platinum: 220,
  dau: 2000,
} as const;

export const PERKS_BY_TIER: Record<Tier, string[]> = {
  Bronze: ["Building your record"],
  Silver: ["Standard matching"],
  Gold: ["Priority matching", "Weekly payout"],
  Platinum: ["Top-crew badge", "Surge access"],
};

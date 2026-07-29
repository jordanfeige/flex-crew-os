import type { Tier } from "@/lib/engine";

export const TIERS: Tier[] = ["Bronze", "Silver", "Gold", "Platinum"];

export function tierCss(t: Tier): string {
  if (t === "Bronze") return "var(--bronze)";
  if (t === "Silver") return "var(--silver)";
  if (t === "Gold") return "var(--gold)";
  return "var(--platinum)";
}

export function tierChipClass(t: Tier): string {
  if (t === "Bronze") return "bg-[var(--bronze)] text-white";
  if (t === "Silver") return "bg-[var(--silver)] text-white";
  if (t === "Gold") return "bg-[var(--gold)] text-[#1a1508]";
  return "bg-[var(--platinum)] text-white";
}

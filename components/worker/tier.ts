import type { Tier } from "@/lib/engine";

export const TIERS: Tier[] = ["Bronze", "Silver", "Gold", "Platinum"];

export function tierCss(t: Tier): string {
  if (t === "Bronze") return "var(--bronze)";
  if (t === "Silver") return "var(--silver)";
  if (t === "Gold") return "var(--gold)";
  return "var(--platinum)";
}

export function tierChipClass(t: Tier): string {
  if (t === "Bronze") return "bg-[var(--bronze-bg)] text-[var(--bronze)]";
  if (t === "Silver") return "bg-[var(--silver-bg)] text-[#5a6472]";
  if (t === "Gold") return "bg-[#fbf6e4] text-[#8a7310]";
  return "bg-[#eef0f3] text-[#4b5563]";
}

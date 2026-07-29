import type { Tier } from "@/lib/engine";

export const TIERS: Tier[] = ["Recruit", "Certified", "Professional", "Elite"];

/** Keep existing color tokens — visual language unchanged, labels evolved. */
export function tierCss(t: Tier): string {
  if (t === "Recruit") return "var(--bronze)";
  if (t === "Certified") return "var(--silver)";
  if (t === "Professional") return "var(--gold)";
  return "var(--platinum)";
}

export function tierChipClass(t: Tier): string {
  if (t === "Recruit") return "bg-[var(--bronze-bg)] text-[var(--bronze)]";
  if (t === "Certified") return "bg-[var(--silver-bg)] text-[#5a6472]";
  if (t === "Professional") return "bg-[#fbf6e4] text-[#8a7310]";
  return "bg-[#eef0f3] text-[#4b5563]";
}

export function tierPillClass(t: Tier): string {
  if (t === "Recruit") return "fx-pill tier-bronze";
  if (t === "Certified") return "fx-pill tier";
  if (t === "Professional") return "fx-pill tier-gold";
  return "fx-pill tier-platinum";
}

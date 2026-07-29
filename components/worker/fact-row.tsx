"use client";

import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

export type FactTone = "neutral" | "amber" | "risk";

/** Canonical fact list row — used on Job Clarity, landing details, progress. */
export function FactRow({
  icon: Icon,
  label,
  tone = "neutral",
  onClick,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  tone?: FactTone;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 py-1.5 text-left",
        onClick && "rounded-md hover:bg-muted/40",
      )}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          tone === "risk" && "text-critical",
          tone === "amber" && "text-warn",
          tone === "neutral" && "text-muted-foreground",
        )}
        aria-hidden
      />
      <span className="text-sm leading-snug text-foreground">{label}</span>
    </Comp>
  );
}

export function FactSectionHeader({
  icon: Icon,
  title,
  count,
  tone = "neutral",
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  count: number;
  tone?: FactTone;
}) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <Icon
        className={cn(
          "h-3.5 w-3.5",
          tone === "risk" && "text-critical",
          tone === "amber" && "text-warn",
          tone === "neutral" && "text-primary",
        )}
        aria-hidden
      />
      <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold tabular text-muted-foreground">
        {count}
      </span>
    </div>
  );
}

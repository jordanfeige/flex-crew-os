"use client";

import type { ComponentType } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FactTone = "neutral" | "amber" | "risk";

/** Prototype FactRow — 22×22 tinted dot. */
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
        "fx-frow",
        tone === "amber" && "amber",
        tone === "risk" && "risk",
        onClick && "tap",
      )}
    >
      <span className="dot">
        <Icon className="h-3 w-3" aria-hidden />
      </span>
      <span>{label}</span>
    </Comp>
  );
}

export function FactSectionHeader({
  icon: Icon,
  title,
  count,
  tone = "neutral",
  expanded,
  onToggle,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  count: number;
  tone?: FactTone;
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const interactive = typeof onToggle === "function";
  const Comp = interactive ? "button" : "div";

  return (
    <Comp
      type={interactive ? "button" : undefined}
      onClick={onToggle}
      aria-expanded={interactive ? expanded : undefined}
      className="fx-sec-h"
      style={{ marginBottom: expanded === false ? 0 : 8 }}
    >
      <Icon
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          tone === "risk" && "text-[var(--risk)]",
          tone === "amber" && "text-[var(--amber)]",
          tone === "neutral" && "text-[var(--flex)]",
        )}
        aria-hidden
      />
      <span>{title}</span>
      <span className="count">{count}</span>
      {interactive ? (
        <span className={cn("chev", expanded && "open")} aria-hidden>
          <ChevronDown className="h-4 w-4" />
        </span>
      ) : null}
    </Comp>
  );
}

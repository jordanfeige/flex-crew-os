"use client";

import { useState } from "react";
import { ChevronDown, Sparkles } from "lucide-react";
import type { CapabilityJob } from "@/lib/capabilities";
import { CAPABILITY_LABEL } from "@/lib/capabilities";
import type { WorkerProfile } from "@/lib/worker";
import { matchScore } from "@/lib/worker";
import { cn } from "@/lib/utils";

export function WhyMatched({
  profile,
  job,
  onImprove,
}: {
  profile: WorkerProfile;
  job: CapabilityJob;
  onImprove?: (capabilityId: string, moduleId?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const result = matchScore(profile, job);

  return (
    <div className="rounded-lg border border-border bg-muted/30">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left"
        aria-expanded={open}
      >
        <Sparkles className="h-3 w-3 shrink-0 text-[var(--flex)]" />
        <span className="flex-1 text-[11px] font-semibold text-[var(--flex)]">
          Why you were matched
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>
      {open ? (
        <div
          className="space-y-2 border-t border-border px-2.5 py-2"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[11px] leading-snug text-muted-foreground">
            Your strengths earned this · same profile as Progress
          </p>
          <ul className="space-y-1.5">
            {result.reasons.map((r) => (
              <li key={r.id} className="flex items-start justify-between gap-2 text-xs">
                <div className="min-w-0">
                  <p
                    className={cn(
                      "font-semibold",
                      r.positive ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {r.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground">{r.detail}</p>
                </div>
                <span className="shrink-0 font-semibold tabular text-[var(--flex)]">
                  +{r.contribution}
                </span>
              </li>
            ))}
          </ul>
          {result.coachingHook ? (
            <button
              type="button"
              className="w-full rounded-md bg-[var(--flex-tint)] px-2 py-1.5 text-left text-[11px] font-semibold text-[var(--flex)]"
              onClick={() =>
                onImprove?.(
                  result.coachingHook!.capability,
                  result.coachingHook!.moduleId,
                )
              }
            >
              {result.coachingHook.message.replace(
                CAPABILITY_LABEL[result.coachingHook.capability],
                CAPABILITY_LABEL[result.coachingHook.capability],
              )}{" "}
              →
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

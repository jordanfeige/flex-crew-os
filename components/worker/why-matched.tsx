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
    <div className="fx-why">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        className={cn("fx-why-h", open && "open")}
        aria-expanded={open}
      >
        <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
        <span className="lbl">Why you were matched</span>
        <span className={cn("chev", open && "open")} aria-hidden>
          <ChevronDown className="h-3.5 w-3.5" />
        </span>
      </button>
      {open ? (
        <div className="fx-why-body" onClick={(e) => e.stopPropagation()}>
          <p style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, lineHeight: 1.4 }}>
            Your strengths earned this · same profile as Progress
          </p>
          {result.reasons.map((r) => (
            <div key={r.id} className="fx-why-row">
              <div style={{ minWidth: 0 }}>
                <p
                  style={{
                    fontWeight: 600,
                    color: r.positive ? "var(--ink)" : "var(--muted)",
                  }}
                >
                  {r.label}
                </p>
                <p style={{ fontSize: 11, color: "var(--muted)" }}>{r.detail}</p>
              </div>
              <span
                className="fx-tabular"
                style={{
                  flexShrink: 0,
                  fontWeight: 700,
                  color: "var(--flex)",
                }}
              >
                +{r.contribution}
              </span>
            </div>
          ))}
          {result.coachingHook ? (
            <button
              type="button"
              className="fx-add-cap"
              style={{ marginTop: 8, padding: "8px 10px" }}
              onClick={() =>
                onImprove?.(
                  result.coachingHook!.capability,
                  result.coachingHook!.moduleId,
                )
              }
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--flex)" }}>
                {result.coachingHook.message.replace(
                  CAPABILITY_LABEL[result.coachingHook.capability],
                  CAPABILITY_LABEL[result.coachingHook.capability],
                )}{" "}
                →
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

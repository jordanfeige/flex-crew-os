"use client";

import type { CapabilityJob } from "@/lib/capabilities";
import { buildWorkerJobOffer } from "@/lib/job-value";
import type { WorkerProfile } from "@/lib/worker";
import { cn } from "@/lib/utils";

/**
 * Compact matched job row — worker-value framing (pay/hr, schedule).
 * Prefer WorkerHomeTab JobRow for the full phone experience.
 */
export function JobCard({
  job,
  profile,
  weekEarnings,
  weekGoal,
  onOpen,
}: {
  job: CapabilityJob;
  profile: WorkerProfile;
  weekEarnings: number;
  weekGoal: number;
  onOpen: () => void;
}) {
  const offer = buildWorkerJobOffer({
    profile,
    job,
    weekEarnings,
    weekGoal,
  });

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-start justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-left transition-colors hover:bg-muted/40",
      )}
    >
      <div className="min-w-0">
        <p className="text-xs font-medium">{job.title}</p>
        <p className="text-[11px] text-muted-foreground">{offer.scheduleLine}</p>
        <p className="mt-0.5 text-[10px] font-medium text-muted-foreground">
          {offer.qualified ? "✓ Qualified" : `Missing: ${offer.missingLabel}`}
          {job.clarity || job.media || job.jobBrief ? " · AI Job Brief" : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <span className="block text-xs font-semibold tabular text-primary">
          ${offer.payUsd}
        </span>
        <span className="text-[10px] tabular text-muted-foreground">
          ~${offer.effectiveHourly}/hr
        </span>
      </div>
    </button>
  );
}

"use client";

import type { CapabilityJob } from "@/lib/capabilities";
import { jobPayTotal } from "@/lib/capabilities";
import { cn } from "@/lib/utils";

/** Matched job row — shared by landing + engagement. */
export function JobCard({
  job,
  match,
  onOpen,
}: {
  job: CapabilityJob;
  match: number;
  onOpen: () => void;
}) {
  const pay = jobPayTotal(job);
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
        <p className="text-[11px] text-muted-foreground">
          {job.city} · {job.slot} · Match {match}%
          {job.clarity || job.media ? " · AI summary" : ""}
        </p>
      </div>
      <span className="shrink-0 text-xs font-semibold tabular text-primary">${pay}</span>
    </button>
  );
}

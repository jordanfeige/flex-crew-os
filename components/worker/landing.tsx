"use client";

import { useMemo } from "react";
import type { CapabilityJob } from "@/lib/capabilities";
import { jobPayTotal } from "@/lib/capabilities";
import type { ScorePayload, Tier } from "@/lib/engine";
import { ProgressRing } from "@/components/worker/progress-ring";
import { JobCard } from "@/components/worker/job-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function tierCss(t: Tier): string {
  if (t === "Recruit") return "var(--recruit)";
  if (t === "Shadow") return "var(--shadow-tier)";
  if (t === "Pro") return "var(--pro)";
  return "var(--elite)";
}

export function WorkerLanding({
  name,
  city,
  avatar,
  result,
  ptsLabel,
  activated,
  nearbyPayTotal,
  nextBestAction,
  jobs,
  weekEarnings,
  weekGoal,
  onOpenJob,
  onOpenProgress,
  onPrimaryAction,
}: {
  name: string;
  city: string;
  avatar: string;
  result: ScorePayload;
  ptsLabel: string;
  /** First job claimed = activated (Luke). */
  activated: boolean;
  nearbyPayTotal: number;
  nextBestAction: string;
  jobs: { job: CapabilityJob; match: number }[];
  weekEarnings: number;
  weekGoal: number;
  onOpenJob: (job: CapabilityJob) => void;
  onOpenProgress: () => void;
  onPrimaryAction: () => void;
}) {
  const primaryJob = jobs[0]?.job ?? null;
  const heroHook = useMemo(() => {
    if (!activated) {
      return {
        title: `$${nearbyPayTotal.toLocaleString()} in jobs near you`,
        sub: "Claim your first move to activate.",
      };
    }
    return {
      title: `$${weekEarnings}`,
      sub: `This week · goal $${weekGoal}`,
    };
  }, [activated, nearbyPayTotal, weekEarnings, weekGoal]);

  return (
    <div className="space-y-4">
      {/* Identity + tier — same chrome as engagement */}
      <div className="flex items-center gap-3">
        <div
          className="grid h-11 w-11 place-items-center rounded-full text-sm font-semibold text-white"
          style={{ background: tierCss(result.tier) }}
        >
          {avatar}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold tracking-tight">{name}</p>
          <p className="text-xs text-muted-foreground">{city}</p>
        </div>
        <Badge
          className="border-0 text-white"
          style={{ background: tierCss(result.tier) }}
        >
          {result.tier}
        </Badge>
        {!activated ? (
          <Badge variant="warn" className="normal-case tracking-normal">
            Not active
          </Badge>
        ) : (
          <Badge variant="live" className="normal-case tracking-normal">
            Active
          </Badge>
        )}
      </div>

      {/* Earnings-first hero */}
      <div className="rounded-xl border border-good/25 bg-good-tint/60 px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {activated ? "This week" : "Near you"}
        </p>
        <p className="mt-0.5 text-2xl font-semibold tabular tracking-tight text-good">
          {heroHook.title}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{heroHook.sub}</p>
        {activated ? (
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-card/80">
            <div
              className="h-full rounded-full bg-good"
              style={{
                width: `${Math.min(100, (weekEarnings / Math.max(1, weekGoal)) * 100)}%`,
              }}
            />
          </div>
        ) : null}
      </div>

      {/* Single NBA */}
      <div className="rounded-xl border border-primary/20 bg-muted/40 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
          Next best action
        </p>
        <p className="mt-1 text-sm font-medium leading-snug">{nextBestAction}</p>
        <Button
          type="button"
          className="mt-3 h-9 w-full text-sm font-semibold"
          onClick={() => {
            if (!activated && primaryJob) onOpenJob(primaryJob);
            else onPrimaryAction();
          }}
        >
          {!activated ? "Claim first move" : "View progress"}
        </Button>
      </div>

      {/* Reliability ring */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 shadow-card">
        <ProgressRing
          value={result.score}
          color={tierCss(result.tier)}
          label={String(result.score)}
          sub={ptsLabel}
          size={96}
        />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reliability
          </p>
          <p className="mt-0.5 text-sm font-semibold tracking-tight">{result.tier}</p>
          <p className="text-[11px] text-muted-foreground">{ptsLabel}</p>
          <button
            type="button"
            onClick={onOpenProgress}
            className="mt-2 text-[11px] font-semibold text-primary hover:underline"
          >
            Career path & coach →
          </button>
        </div>
      </div>

      {/* Matched jobs */}
      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Matched jobs
          {(result.tier === "Pro" || result.tier === "Elite") && " · priority"}
        </p>
        <div className="space-y-1.5">
          {jobs.map(({ job, match }) => (
            <JobCard
              key={job.id}
              job={job}
              match={match}
              onOpen={() => onOpenJob(job)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

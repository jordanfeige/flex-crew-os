"use client";

import { Check, ChevronRight, Sparkles } from "lucide-react";
import type { CapabilityJob } from "@/lib/capabilities";
import { jobPayTotal } from "@/lib/capabilities";
import type { WorkerProfile } from "@/lib/worker";
import { Badge } from "@/components/ui/badge";
import { WhyMatched } from "@/components/worker/why-matched";
import { tierChipClass, tierCss } from "@/components/worker/tier";
import { cn } from "@/lib/utils";

export function WorkerHomeTab({
  profile,
  activated,
  weekEarnings,
  weekGoal,
  bookedJob,
  availableJobs,
  nudge,
  onOpenBooked,
  onOpenAvailable,
  onImproveCapability,
}: {
  profile: WorkerProfile;
  activated: boolean;
  weekEarnings: number;
  weekGoal: number;
  bookedJob: CapabilityJob | null;
  availableJobs: { job: CapabilityJob; match: number }[];
  nudge: string;
  onOpenBooked: (job: CapabilityJob) => void;
  onOpenAvailable: (job: CapabilityJob) => void;
  onImproveCapability?: (capabilityId: string, moduleId?: string) => void;
}) {
  const pct = Math.min(100, Math.round((weekEarnings / Math.max(1, weekGoal)) * 100));
  const { name, city, avatar, scorePayload: result } = profile;

  return (
    <div className="space-y-4">
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
        {activated ? (
          <Badge variant="live" className="gap-1 normal-case tracking-normal">
            <span className="h-1.5 w-1.5 rounded-full bg-good" aria-hidden />
            Active
          </Badge>
        ) : (
          <Badge variant="warn" className="normal-case tracking-normal">
            Not active
          </Badge>
        )}
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            tierChipClass(result.tier),
          )}
        >
          {result.tier}
        </span>
      </div>

      <div
        className="rounded-2xl px-4 py-3.5 text-white shadow-elevated"
        style={{
          background: "linear-gradient(135deg, var(--flex) 0%, var(--flex-dark) 100%)",
        }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/80">
          This week
        </p>
        <p className="mt-1 text-3xl font-semibold tabular tracking-tight">
          ${weekEarnings}
          <span className="text-base font-medium text-white/75"> / ${weekGoal}</span>
        </p>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/25">
          <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Your next job
        </p>
        {bookedJob ? (
          <JobRow
            job={bookedJob}
            mode="confirmed"
            profile={profile}
            onOpen={() => onOpenBooked(bookedJob)}
            onImprove={onImproveCapability}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
            No booked job yet — claim one below to activate.
          </p>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Available near you
        </p>
        <div className="space-y-1.5">
          {availableJobs.map(({ job, match }) => (
            <JobRow
              key={job.id}
              job={job}
              mode="claimable"
              match={match}
              profile={profile}
              onOpen={() => onOpenAvailable(job)}
              onImprove={onImproveCapability}
            />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-[var(--flex-tint)] px-3 py-2.5">
        <p className="text-sm leading-snug text-foreground">{nudge}</p>
      </div>
    </div>
  );
}

function JobRow({
  job,
  mode,
  match,
  profile,
  onOpen,
  onImprove,
}: {
  job: CapabilityJob;
  mode: "confirmed" | "claimable";
  match?: number;
  profile: WorkerProfile;
  onOpen: () => void;
  onImprove?: (capabilityId: string, moduleId?: string) => void;
}) {
  const pay = jobPayTotal(job);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/40"
      >
        <div
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-xs font-semibold text-white"
          style={{ background: "var(--flex)" }}
        >
          Fx
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tracking-tight">{job.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {job.city} · {job.slot}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {mode === "confirmed" ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-good-tint px-1.5 py-0.5 text-[10px] font-semibold text-good">
                <Check className="h-2.5 w-2.5" /> Confirmed
              </span>
            ) : (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                  (match ?? 0) >= 90
                    ? "bg-good-tint text-good"
                    : "bg-warn-tint text-warn",
                )}
              >
                Match {match}%
              </span>
            )}
            <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--flex-tint)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--flex)]">
              <Sparkles className="h-2.5 w-2.5" /> AI Job Brief
            </span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <span className="text-sm font-semibold tabular text-[var(--flex)]">${pay}</span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>
      {mode === "claimable" ? (
        <div className="border-t border-border px-2 py-1.5">
          <WhyMatched profile={profile} job={job} onImprove={onImprove} />
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { Check, ChevronRight, Sparkles } from "lucide-react";
import type { CapabilityJob } from "@/lib/capabilities";
import { jobPayTotal } from "@/lib/capabilities";
import type { WorkerProfile } from "@/lib/worker";
import { WhyMatched } from "@/components/worker/why-matched";
import { tierPillClass } from "@/components/worker/tier";
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
  hideHeader,
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
  /** When true, avatar/tier live in the phone shell header. */
  hideHeader?: boolean;
}) {
  const pct = Math.min(100, Math.round((weekEarnings / Math.max(1, weekGoal)) * 100));
  const { name, city, avatar, scorePayload: result } = profile;

  return (
    <div>
      {!hideHeader ? (
        <div className="fx-head" style={{ paddingTop: 18 }}>
          <div className="fx-av">{avatar}</div>
          <div className="fx-who">
            <div className="n">{name}</div>
            <div className="l">{city}</div>
          </div>
          <div className="fx-badges">
            <span className={cn("fx-pill", activated ? "active" : "inactive")}>
              {activated ? "● Active" : "Not active"}
            </span>
            <span className={tierPillClass(result.tier)}>{result.tier.toUpperCase()}</span>
          </div>
        </div>
      ) : null}

      <div className="fx-lbl">This week</div>
      <div className="fx-earn">
        <div className="top">
          <span className="k">Earned</span>
          <span className="goal">Goal ${weekGoal}</span>
        </div>
        <div className="v">${weekEarnings}</div>
        <div className="fx-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="fx-lbl">Your next job</div>
      {bookedJob ? (
        <JobRow
          job={bookedJob}
          mode="confirmed"
          profile={profile}
          onOpen={() => onOpenBooked(bookedJob)}
          onImprove={onImproveCapability}
        />
      ) : (
        <div className="fx-card" style={{ color: "var(--muted)", fontSize: 13 }}>
          No booked job yet — claim one below to activate.
        </div>
      )}

      <div className="fx-lbl">Available near you</div>
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

      <div className="fx-nudge">
        <span aria-hidden>🎯</span>
        <div className="txt">{nudge}</div>
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
  const strong = (match ?? 0) >= 90;

  const row = (
    <button type="button" className="fx-job" onClick={onOpen}>
      <div className="ic">Fx</div>
      <div className="mid">
        <div className="t">{job.title}</div>
        <div className="s">
          {job.city} · {job.slot}
        </div>
        <div className="meta">
          {mode === "confirmed" ? (
            <span className="fx-tag conf">
              <Check className="mr-0.5 inline h-2.5 w-2.5" /> Confirmed
            </span>
          ) : (
            <span className={cn("fx-tag", strong ? "m100" : "m50")}>
              Match {match}%
            </span>
          )}
          <span className="fx-tag ai">
            <Sparkles className="mr-0.5 inline h-2.5 w-2.5" /> AI Job Brief
          </span>
        </div>
      </div>
      <span className="pay">${pay}</span>
      <span className="fx-chev">
        <ChevronRight className="h-4 w-4" />
      </span>
    </button>
  );

  if (mode !== "claimable") return row;

  return (
    <div className="fx-job-shell">
      {row}
      <WhyMatched profile={profile} job={job} onImprove={onImprove} />
    </div>
  );
}

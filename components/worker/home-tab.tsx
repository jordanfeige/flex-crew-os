"use client";

import { Check, ChevronRight, Sparkles } from "lucide-react";
import type { CapabilityJob } from "@/lib/capabilities";
import { buildWorkerJobOffer } from "@/lib/job-value";
import type { WorkerProfile } from "@/lib/worker";
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
  incentiveUsd = 15,
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
  /** Ranked nearby jobs — match stays engine-side only. */
  availableJobs: CapabilityJob[];
  nudge: string;
  incentiveUsd?: number;
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
          weekEarnings={weekEarnings}
          weekGoal={weekGoal}
          nearbyJobs={availableJobs}
          incentiveUsd={incentiveUsd}
          onOpen={() => onOpenBooked(bookedJob)}
          onImprove={onImproveCapability}
        />
      ) : (
        <div className="fx-card" style={{ color: "var(--muted)", fontSize: 13 }}>
          No booked job yet — claim one below to activate.
        </div>
      )}

      <div className="fx-lbl">Available near you</div>
      {availableJobs.map((job) => (
        <JobRow
          key={job.id}
          job={job}
          mode="claimable"
          profile={profile}
          weekEarnings={weekEarnings}
          weekGoal={weekGoal}
          nearbyJobs={availableJobs}
          incentiveUsd={incentiveUsd}
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
  profile,
  weekEarnings,
  weekGoal,
  nearbyJobs,
  incentiveUsd,
  onOpen,
  onImprove,
}: {
  job: CapabilityJob;
  mode: "confirmed" | "claimable";
  profile: WorkerProfile;
  weekEarnings: number;
  weekGoal: number;
  nearbyJobs: CapabilityJob[];
  incentiveUsd: number;
  onOpen: () => void;
  onImprove?: (capabilityId: string, moduleId?: string) => void;
}) {
  const offer = buildWorkerJobOffer({
    profile,
    job,
    weekEarnings,
    weekGoal,
    nearbyJobs,
    incentiveUsd,
  });

  return (
    <div className={cn("fx-job-shell", mode === "claimable" && !offer.qualified && "has-gap")}>
      <button type="button" className="fx-job" onClick={onOpen}>
        <div className="ic">Fx</div>
        <div className="mid">
          <div className="t">{job.title}</div>
          <div className="s">{offer.scheduleLine}</div>
          {mode === "claimable" ? (
            <div className="prog">{offer.progressLine}</div>
          ) : null}
          {offer.incentive ? (
            <div className="surge">🔥 {offer.incentive.label}</div>
          ) : null}
          {mode === "claimable" && offer.bundleWith ? (
            <div className="bundle">
              Pairs with a nearby job → +${offer.bundleWith.payUsd}
            </div>
          ) : null}
          <div className="meta">
            {mode === "confirmed" ? (
              <span className="fx-tag conf">
                <Check className="mr-0.5 inline h-2.5 w-2.5" /> Confirmed
              </span>
            ) : offer.qualified ? (
              <span className="fx-tag m100">
                <Check className="mr-0.5 inline h-2.5 w-2.5" /> Qualified
              </span>
            ) : (
              <span className="fx-tag m50">Missing: {offer.missingLabel}</span>
            )}
            <span className="fx-tag ai">
              <Sparkles className="mr-0.5 inline h-2.5 w-2.5" /> AI Job Brief
            </span>
          </div>
        </div>
        <div className="paycol">
          <span className="pay">${offer.payUsd}</span>
          <span className="hr">~${offer.effectiveHourly}/hr</span>
        </div>
        <span className="fx-chev">
          <ChevronRight className="h-4 w-4" />
        </span>
      </button>
      {mode === "claimable" && offer.coachingLine && offer.missing[0] ? (
        <button
          type="button"
          className="fx-job-coach"
          onClick={(e) => {
            e.stopPropagation();
            onImprove?.(offer.missing[0]);
          }}
        >
          {offer.coachingLine}
        </button>
      ) : null}
    </div>
  );
}

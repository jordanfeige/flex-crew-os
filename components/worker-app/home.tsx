"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  Home,
  User,
} from "lucide-react";
import type { Capability, CapabilityJob } from "@/lib/capabilities";
import { CAPABILITY_LABEL, matchScore } from "@/lib/capabilities";
import type { CapabilityReliabilityBreakdown } from "@/lib/reviews";
import type { ScorePayload, Signals } from "@/lib/engine";
import { nextTierName } from "@/lib/engine";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function MiniRing({
  value,
  color,
  label,
  sub,
}: {
  value: number;
  color: string;
  label: string;
  sub: string;
}) {
  const reduce = useReducedMotion();
  const r = 36;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value)) / 100;
  const dash = c * pct;
  return (
    <div className="relative h-[96px] w-[96px] shrink-0">
      <svg viewBox="0 0 96 96" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="48" cy="48" r={r} fill="none" stroke="var(--border)" strokeWidth="8" />
        <motion.circle
          cx="48"
          cy="48"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          initial={false}
          animate={{ strokeDasharray: `${dash} ${c - dash}` }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-semibold tabular leading-none">{label}</span>
        <span className="mt-0.5 max-w-[4rem] text-[9px] leading-tight text-muted-foreground">
          {sub}
        </span>
      </div>
    </div>
  );
}

function tierColor(tier: string): string {
  if (tier === "Recruit") return "var(--recruit)";
  if (tier === "Shadow") return "var(--shadow-tier)";
  if (tier === "Pro") return "var(--pro)";
  return "var(--elite)";
}

export function WorkerHome({
  workerName,
  signals,
  result,
  capabilityReliability,
  earningsWeek,
  goalWeek,
  firstJobDone,
  activated,
  jobs,
  capabilities,
  tab,
  onTabChange,
  onOpenJob,
  onRestartActivation,
}: {
  workerName: string;
  signals: Signals;
  result: ScorePayload;
  capabilityReliability: CapabilityReliabilityBreakdown;
  earningsWeek: number;
  goalWeek: number;
  firstJobDone: boolean;
  activated: boolean;
  jobs: CapabilityJob[];
  capabilities: Capability[];
  tab: "home" | "jobs" | "profile";
  onTabChange: (t: "home" | "jobs" | "profile") => void;
  onOpenJob: (job: CapabilityJob) => void;
  onRestartActivation: () => void;
}) {
  const next = nextTierName(result.tier);
  const ptsLabel =
    result.tier === "Elite"
      ? "Elite"
      : result.tier === "Recruit"
        ? `${Math.max(0, 3 - signals.jobsCompleted)} jobs to Shadow`
        : `${result.pointsToNextTier} pts to ${next}`;

  const nba = !firstJobDone
    ? "Claim & complete your first move to activate the Pro track"
    : result.nextBestAction;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-20 pt-1">
        {tab === "home" || tab === "jobs" ? (
          <>
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                This week
              </p>
              <p className="mt-1 text-2xl font-semibold tabular tracking-tight text-good">
                ${earningsWeek}
                <span className="text-sm font-medium text-muted-foreground">
                  {" "}
                  · Goal ${goalWeek}
                </span>
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-good"
                  style={{
                    width: `${Math.min(100, (earningsWeek / goalWeek) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-card">
              <MiniRing
                value={result.score}
                color={tierColor(result.tier)}
                label={String(result.score)}
                sub={ptsLabel}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                    style={{ background: tierColor(result.tier) }}
                  >
                    {result.tier}
                  </span>
                  {firstJobDone ? (
                    <span className="rounded-full bg-good-tint px-2 py-0.5 text-[10px] font-semibold text-good">
                      Active
                    </span>
                  ) : (
                    <span className="rounded-full bg-warn-tint px-2 py-0.5 text-[10px] font-semibold text-warn">
                      Verified · not active
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-snug text-muted-foreground">
                  Overall reliability{" "}
                  <span className="font-semibold tabular text-foreground">
                    {capabilityReliability.overall}
                  </span>
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-accent/50 p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                Next best action
              </p>
              <p className="mt-1 text-sm font-medium leading-snug">{nba}</p>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Personalized jobs
              </p>
              <div className="space-y-2">
                {jobs.map((job) => {
                  const pct = matchScore({ capabilities }, job);
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => onOpenJob(job)}
                      className="flex w-full items-start justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-left shadow-card transition-colors hover:bg-muted/40"
                    >
                      <div>
                        <p className="text-sm font-semibold">{job.title}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {job.city} · {job.slot}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold tabular text-primary">
                          ${job.payUsd}
                        </p>
                        <p className="text-[11px] font-medium tabular text-muted-foreground">
                          Match {pct}%
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        {tab === "profile" ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <p className="text-lg font-semibold">{workerName}</p>
              <p className="text-xs text-muted-foreground">
                {activated ? "Verified" : "In activation"} ·{" "}
                {firstJobDone ? "Active" : "Awaiting first job"}
              </p>
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Capabilities
              </p>
              <div className="flex flex-wrap gap-1.5">
                {capabilities.map((c) => (
                  <span
                    key={c}
                    className="rounded-md bg-muted px-2 py-1 text-[11px] font-medium"
                  >
                    {CAPABILITY_LABEL[c]}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 p-3">
              <p className="text-xs font-semibold">Reliability by service</p>
              <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
                {(
                  [
                    ["Moving", capabilityReliability.byService.moving],
                    ["Cleaning", capabilityReliability.byService.cleaning],
                    ["Delivery", capabilityReliability.byService.delivery],
                    ["Install", capabilityReliability.byService.install],
                  ] as const
                ).map(([label, v]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-semibold tabular">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button type="button" variant="outline" className="w-full" onClick={onRestartActivation}>
              Replay activation
            </Button>
          </div>
        ) : null}
      </div>

      <nav className="absolute inset-x-0 bottom-0 flex border-t border-border bg-card/95 backdrop-blur">
        {(
          [
            ["home", Home, "Home"],
            ["jobs", Briefcase, "Jobs"],
            ["profile", User, "Profile"],
          ] as const
        ).map(([id, Icon, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => onTabChange(id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium",
              tab === id ? "text-primary" : "text-muted-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

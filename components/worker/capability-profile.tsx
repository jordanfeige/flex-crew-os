"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowDown,
  BadgeCheck,
  BookOpen,
  Check,
  ChevronDown,
  Lock,
  Plus,
  Star,
} from "lucide-react";
import type { CapabilityJob } from "@/lib/capabilities";
import { CAPABILITY_LABEL } from "@/lib/capabilities";
import {
  PROFICIENCY_LABEL,
  coachingImpact,
  growthOpportunities,
  jobsUnlockedBy,
  reliabilityBand,
  unlockPathFor,
  type CapabilityProfile,
} from "@/lib/capability-profile";
import { COACHING_MODULES } from "@/lib/coaching";
import type { WorkerProfile } from "@/lib/worker";
import { cn } from "@/lib/utils";

export function CapabilityProfileSection({
  profile,
  jobs,
  focusCapabilityId,
  onAddCapability,
  onOpenCoaching,
}: {
  profile: WorkerProfile;
  jobs: CapabilityJob[];
  /** Expand this capability (from Why-matched coaching hook). */
  focusCapabilityId?: string | null;
  onAddCapability: () => void;
  onOpenCoaching?: (moduleId: string) => void;
}) {
  const earned = profile.capabilities.filter((c) => c.earned);
  const locked = growthOpportunities(profile.capabilities);
  const [openId, setOpenId] = useState<string | null>(earned[0]?.id ?? null);
  const [highlightJobId, setHighlightJobId] = useState<string | null>(null);
  const ratedJobs = profile.ratingsCount;

  useEffect(() => {
    if (focusCapabilityId) setOpenId(focusCapabilityId);
  }, [focusCapabilityId]);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
    setHighlightJobId(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] leading-snug text-muted-foreground">
        Elite 90–100 · Solid 75–89 · Building &lt;75 · earned from your{" "}
        {ratedJobs} rated job{ratedJobs === 1 ? "" : "s"}. Skills unlock jobs —
        jobs raise earnings.
      </p>

      <div className="space-y-1.5">
        {earned.map((cap) => (
          <CapabilityRow
            key={cap.id}
            cap={cap}
            jobs={jobs}
            open={openId === cap.id}
            highlightJobId={openId === cap.id ? highlightJobId : null}
            onToggle={() => toggle(cap.id)}
            onSelectJob={(jobId) =>
              setHighlightJobId((prev) => (prev === jobId ? null : jobId))
            }
            onOpenCoaching={onOpenCoaching}
          />
        ))}
      </div>

      {locked.length > 0 ? (
        <div className="space-y-1.5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Growth Opportunities
            </p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              Unlock new capabilities to qualify for more jobs and increase your
              earning potential.
            </p>
          </div>
          {locked.map((cap) => (
            <LockedCapabilityRow
              key={cap.id}
              cap={cap}
              open={openId === cap.id}
              earnedIds={profile.earnedCapabilityIds}
              ratingsAvg={profile.ratingsAvg}
              onToggle={() => toggle(cap.id)}
              onStartUnlock={onAddCapability}
            />
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onAddCapability}
        className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
      >
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--flex-tint)] text-[var(--flex)]">
          <Plus className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Add a capability →</p>
          <p className="text-[11px] text-muted-foreground">
            Unlock more job types · raise earning potential
          </p>
        </div>
      </button>
    </div>
  );
}

function LockedCapabilityRow({
  cap,
  open,
  earnedIds,
  ratingsAvg,
  onToggle,
  onStartUnlock,
}: {
  cap: CapabilityProfile;
  open: boolean;
  earnedIds: CapabilityProfile["id"][];
  ratingsAvg: number;
  onToggle: () => void;
  onStartUnlock: () => void;
}) {
  const path = unlockPathFor(cap.id, { earnedIds, ratingsAvg });
  const coach = cap.coachingModuleId
    ? COACHING_MODULES[cap.coachingModuleId]
    : null;
  // Aspirational catalog unlocks for growth coaching.
  const jobExamples = cap.unlocksJobTypes.slice(0, 4);
  const progressPct = Math.round((path.doneCount / path.total) * 100);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold">{cap.label}</span>
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              Locked
            </span>
          </div>
          {!open ? (
            <p className="mt-1 text-[10px] text-muted-foreground">
              ≈ +${cap.whyMatters.estimatedWeeklyUsd}/week potential
            </p>
          ) : null}
          {open ? (
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[var(--flex)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          ) : null}
        </div>
        {!open ? (
          <span className="text-[10px] font-semibold text-[var(--flex)]">
            Unlock →
          </span>
        ) : (
          <span className="text-[10px] font-semibold tabular text-muted-foreground">
            {path.doneCount}/{path.total}
          </span>
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border bg-muted/20 px-3 py-2.5">
          {/* Estimated opportunity */}
          <div className="rounded-lg border border-[var(--green)]/20 bg-[var(--green-bg)] px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--green)]">
              Estimated opportunity
            </p>
            <p className="mt-0.5 text-sm font-bold text-foreground">
              +${cap.whyMatters.estimatedWeeklyUsd}/week
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Avg payout +${cap.whyMatters.avgEarningsPerJob}/job · ~
              {cap.whyMatters.estimatedMonthlyJobs} jobs/month
            </p>
          </div>

          {/* What you'll unlock */}
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                What you&apos;ll unlock
              </p>
              <ArrowDown className="h-3 w-3 text-[var(--flex)]" />
            </div>
            <ul className="mt-1.5 space-y-1">
              {jobExamples.map((title) => (
                <li
                  key={title}
                  className="flex items-center gap-2 rounded-lg bg-card px-2 py-1.5 text-xs"
                >
                  <span className="text-[var(--flex)]">↓</span>
                  {title}
                </li>
              ))}
            </ul>
          </div>

          {/* Requirements / fastest path */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Requirements
              </p>
              <p className="text-[10px] font-semibold tabular text-[var(--flex)]">
                {path.doneCount} of {path.total} complete
              </p>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[var(--flex)] transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <ul className="mt-2 space-y-1.5">
              {path.requirements.map((req) => (
                <li
                  key={req.id}
                  className="flex items-start gap-2 text-xs leading-snug"
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full",
                      req.done
                        ? "bg-good-tint text-good"
                        : "border border-border bg-card text-muted-foreground",
                    )}
                  >
                    {req.done ? (
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      req.done
                        ? "text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {req.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Fastest path CTA — open modular vetting */}
          {coach ? (
            <button
              type="button"
              onClick={onStartUnlock}
              className="flex w-full items-start gap-2 rounded-lg border border-[var(--flex)]/20 bg-[var(--flex-tint)] px-2.5 py-2 text-left"
            >
              <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--flex)]" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">
                  {coach.title} · {coach.durationMin} min
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Fastest path to unlock {cap.label}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-[var(--flex)]">
                  Start unlock · +${cap.whyMatters.estimatedWeeklyUsd}/week
                </p>
              </div>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartUnlock}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[var(--flex)] px-2.5 py-2 text-xs font-semibold text-white"
            >
              Start unlock →
            </button>
          )}
        </div>
      ) : null}
    </div>
  );
}

function CapabilityRow({
  cap,
  jobs,
  open,
  highlightJobId,
  onToggle,
  onSelectJob,
  onOpenCoaching,
}: {
  cap: CapabilityProfile;
  jobs: CapabilityJob[];
  open: boolean;
  highlightJobId: string | null;
  onToggle: () => void;
  onSelectJob: (jobId: string) => void;
  onOpenCoaching?: (moduleId: string) => void;
}) {
  const unlocked = jobsUnlockedBy(cap.id, jobs);
  const impact = coachingImpact(cap);
  const band = reliabilityBand(cap.reliabilityScore);
  const bandLabel = band ?? PROFICIENCY_LABEL[cap.proficiency];
  const elite = band === "Elite";
  const solid = band === "Solid";
  const building = band === "Building" || (!band && cap.earned);
  const jobTypeCount = unlocked.length || cap.unlocksJobTypes.length;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm font-semibold">{cap.label}</span>
            {cap.verified ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-good-tint px-1.5 py-0.5 text-[10px] font-semibold text-good">
                <BadgeCheck className="h-2.5 w-2.5" /> Verified
              </span>
            ) : null}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                elite && "bg-good-tint text-good",
                solid && "bg-[var(--flex-bg)] text-[var(--flex)]",
                building && "bg-warn-tint text-warn",
                !band && !cap.earned && "bg-muted text-muted-foreground",
              )}
            >
              {bandLabel}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${cap.reliabilityScore ?? 0}%`,
                background: elite
                  ? "var(--good)"
                  : solid
                    ? "var(--flex)"
                    : "var(--warn)",
              }}
            />
          </div>
          {!open ? (
            <p className="mt-1 text-[10px] text-muted-foreground">
              Used in {jobTypeCount} job type{jobTypeCount === 1 ? "" : "s"} · ≈
              +${cap.whyMatters.avgEarningsPerJob}/job
            </p>
          ) : null}
        </div>
        <span className="text-xs font-semibold tabular text-muted-foreground">
          {cap.reliabilityScore ?? "—"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="space-y-3 border-t border-border bg-muted/20 px-3 py-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {cap.proof.jobsCompleted > 0 ? (
              <span className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium">
                {cap.proof.jobsCompleted} completed jobs
              </span>
            ) : null}
            {cap.proof.avgRating != null ? (
              <span className="inline-flex items-center gap-0.5 rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium">
                <Star className="h-2.5 w-2.5 fill-[#f5a623] text-[#f5a623]" />
                {cap.proof.avgRating.toFixed(1)}
              </span>
            ) : null}
            {cap.proof.badges.slice(0, 3).map((b) => (
              <span
                key={b}
                className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium"
              >
                {b}
              </span>
            ))}
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Why this skill matters
            </p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-card px-2.5 py-1.5">
                <p className="text-[10px] text-muted-foreground">Used in</p>
                <p className="text-xs font-semibold">
                  {cap.whyMatters.usedInPct}% of{" "}
                  {cap.whyMatters.serviceLabel.toLowerCase()} jobs
                </p>
              </div>
              <div className="rounded-lg bg-card px-2.5 py-1.5">
                <p className="text-[10px] text-muted-foreground">Avg payout</p>
                <p className="text-xs font-semibold">
                  +${cap.whyMatters.avgEarningsPerJob}/job
                </p>
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              Required for: {cap.whyMatters.requiredFor.join(" · ")}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Unlocks
              </p>
              <ArrowDown className="h-3 w-3 text-[var(--flex)]" />
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--flex)]">
                {jobTypeCount} job type{jobTypeCount === 1 ? "" : "s"}
              </p>
            </div>
            <ul className="mt-1.5 space-y-1">
              {unlocked.length > 0
                ? unlocked.slice(0, 4).map((job) => {
                    const active = highlightJobId === job.id;
                    return (
                      <li key={job.id}>
                        <button
                          type="button"
                          onClick={() => onSelectJob(job.id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                            active
                              ? "bg-[var(--flex-tint)] font-semibold text-[var(--flex)]"
                              : "bg-card text-foreground hover:bg-muted/60",
                          )}
                        >
                          <span className="text-[var(--flex)]">↓</span>
                          <span className="flex-1">{job.title}</span>
                          {active ? (
                            <span className="text-[10px] font-semibold">
                              Matched
                            </span>
                          ) : null}
                        </button>
                        {active ? (
                          <p className="mt-1 px-2 text-[10px] leading-snug text-muted-foreground">
                            Match powered by:{" "}
                            {job.requires.map((c, i) => {
                              const label =
                                c === cap.id
                                  ? cap.label
                                  : (CAPABILITY_LABEL[c] ??
                                    c.replaceAll("_", " "));
                              const node: ReactNode =
                                c === cap.id ? (
                                  <strong key={c} className="text-foreground">
                                    {label}
                                  </strong>
                                ) : (
                                  <span key={c}>{label}</span>
                                );
                              return (
                                <span key={c}>
                                  {i > 0 ? " · " : null}
                                  {node}
                                </span>
                              );
                            })}
                          </p>
                        ) : null}
                      </li>
                    );
                  })
                : cap.unlocksJobTypes.map((title) => (
                    <li
                      key={title}
                      className="flex items-center gap-2 rounded-lg bg-card px-2 py-1.5 text-xs"
                    >
                      <span className="text-[var(--flex)]">↓</span>
                      {title}
                    </li>
                  ))}
            </ul>
          </div>

          <div className="rounded-lg border border-[var(--green)]/20 bg-[var(--green-bg)] px-2.5 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--green)]">
              Business value
            </p>
            <p className="mt-0.5 text-xs font-semibold text-foreground">
              Average earnings +${cap.whyMatters.avgEarningsPerJob}/job
              <span className="font-medium text-muted-foreground">
                {" "}
                · Estimated +${cap.whyMatters.estimatedWeeklyUsd}/week
              </span>
            </p>
          </div>

          {cap.gap ? (
            <p className="text-[11px] text-warn">{cap.gap}</p>
          ) : null}

          {impact ? (
            <button
              type="button"
              onClick={() => onOpenCoaching?.(cap.coachingModuleId!)}
              className="flex w-full items-start gap-2 rounded-lg border border-[var(--flex)]/20 bg-[var(--flex-tint)] px-2.5 py-2 text-left"
            >
              <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--flex)]" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">
                  {impact.title} · {impact.durationMin} min
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Improves {cap.label} {impact.from} → {impact.to}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Unlocks: {impact.unlocks.join(" · ")}
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-[var(--flex)]">
                  Estimated impact · +${impact.weeklyUsd}/week
                </p>
              </div>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

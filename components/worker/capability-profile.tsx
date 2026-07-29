"use client";

import { useEffect, useState } from "react";
import {
  BadgeCheck,
  BookOpen,
  ChevronDown,
  Lock,
  Plus,
} from "lucide-react";
import type { CapabilityJob } from "@/lib/capabilities";
import {
  PROFICIENCY_LABEL,
  jobsUnlockedBy,
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
  const locked = profile.capabilities.filter((c) => !c.earned);
  const [openId, setOpenId] = useState<string | null>(earned[0]?.id ?? null);

  useEffect(() => {
    if (focusCapabilityId) setOpenId(focusCapabilityId);
  }, [focusCapabilityId]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Capability profile
        </p>
        <span className="text-[10px] text-muted-foreground">
          {earned.length} earned · shared with matching
        </span>
      </div>

      <div className="space-y-1.5">
        {earned.map((cap) => (
          <CapabilityRow
            key={cap.id}
            cap={cap}
            jobs={jobs}
            open={openId === cap.id}
            onToggle={() =>
              setOpenId((prev) => (prev === cap.id ? null : cap.id))
            }
            onOpenCoaching={onOpenCoaching}
          />
        ))}
      </div>

      {locked.length > 0 ? (
        <div className="space-y-1.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Not earned yet
          </p>
          {locked.slice(0, 4).map((cap) => (
            <button
              key={cap.id}
              type="button"
              onClick={onAddCapability}
              className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-3 py-2 text-left hover:bg-muted/40"
            >
              <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="flex-1 text-xs font-medium text-muted-foreground">
                {cap.label}
              </span>
              <span className="text-[10px] font-semibold text-[var(--flex)]">
                Vet →
              </span>
            </button>
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
            Modular vetting · same profile powers matching & ops
          </p>
        </div>
      </button>
    </div>
  );
}

function CapabilityRow({
  cap,
  jobs,
  open,
  onToggle,
  onOpenCoaching,
}: {
  cap: CapabilityProfile;
  jobs: CapabilityJob[];
  open: boolean;
  onToggle: () => void;
  onOpenCoaching?: (moduleId: string) => void;
}) {
  const unlocked = jobsUnlockedBy(cap.id, jobs);
  const coach = cap.coachingModuleId
    ? COACHING_MODULES[cap.coachingModuleId]
    : null;
  const strong = (cap.proficiency ?? 0) >= 2;

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
            ) : (
              <span className="rounded-full bg-warn-tint px-1.5 py-0.5 text-[10px] font-semibold text-warn">
                Proving
              </span>
            )}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                strong ? "bg-good-tint text-good" : "bg-warn-tint text-warn",
              )}
            >
              {PROFICIENCY_LABEL[cap.proficiency]}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${cap.reliabilityScore ?? 0}%`,
                background: strong ? "var(--good)" : "var(--warn)",
              }}
            />
          </div>
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
        <div className="space-y-2.5 border-t border-border bg-muted/20 px-3 py-2.5">
          {cap.certs.length > 0 ? (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Certs
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {cap.certs.map((c) => (
                  <span
                    key={c}
                    className="rounded-md border border-border bg-card px-2 py-0.5 text-[11px] font-medium"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {cap.gap ? (
            <p className="text-[11px] text-warn">{cap.gap}</p>
          ) : null}

          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Unlocks · {unlocked.length || cap.unlocksJobTypes.length} job
              type{(unlocked.length || cap.unlocksJobTypes.length) === 1 ? "" : "s"}
            </p>
            <ul className="mt-1 space-y-0.5">
              {(unlocked.length
                ? unlocked.slice(0, 4).map((j) => j.title)
                : cap.unlocksJobTypes
              ).map((title) => (
                <li key={title} className="text-xs text-foreground">
                  · {title}
                </li>
              ))}
            </ul>
          </div>

          {coach ? (
            <button
              type="button"
              onClick={() => onOpenCoaching?.(coach.id)}
              className="flex w-full items-start gap-2 rounded-lg border border-[var(--flex)]/20 bg-[var(--flex-tint)] px-2.5 py-2 text-left"
            >
              <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--flex)]" />
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {coach.title} · {coach.durationMin} min
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {coach.summary} · +{coach.reliabilityBoost} reliability
                </p>
              </div>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

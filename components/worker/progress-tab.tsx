"use client";

import { BookOpen, Star } from "lucide-react";
import type { CapabilityJob } from "@/lib/capabilities";
import { CAPABILITY_LABEL } from "@/lib/capabilities";
import { nextTierName } from "@/lib/engine";
import { TIER_ECONOMICS } from "@/lib/stickiness";
import type { WorkerProfile } from "@/lib/worker";
import { CapabilityProfileSection } from "@/components/worker/capability-profile";
import { ProgressRing } from "@/components/worker/progress-ring";
import { TIERS, tierCss } from "@/components/worker/tier";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function WorkerProgressTab({
  profile,
  ptsLabel,
  jobs,
  focusCapabilityId,
  training,
  onTakeCourse,
  onAddCapability,
  onOpenCoaching,
}: {
  profile: WorkerProfile;
  ptsLabel: string;
  jobs: CapabilityJob[];
  focusCapabilityId?: string | null;
  training: number;
  onTakeCourse: () => void;
  onAddCapability: () => void;
  onOpenCoaching?: (moduleId: string) => void;
}) {
  const result = profile.scorePayload;
  const next = nextTierName(result.tier);
  const unlock = next ? TIER_ECONOMICS[next] : null;

  const earned = profile.capabilities.filter((c) => c.earned);
  const gap = [...earned].sort(
    (a, b) => (a.reliabilityScore ?? 100) - (b.reliabilityScore ?? 100),
  )[0];

  return (
    <div className="space-y-4">
      {/* Where you stand */}
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-3 shadow-card">
        <ProgressRing
          value={result.score}
          color={tierCss(result.tier)}
          label={String(result.score)}
          sub={ptsLabel}
          size={96}
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Where you stand
          </p>
          <div className="flex flex-col gap-1.5">
            {TIERS.map((t) => {
              const idx = TIERS.indexOf(t);
              const cur = TIERS.indexOf(result.tier);
              const done = idx < cur;
              const here = t === result.tier;
              return (
                <div key={t} className="flex items-center gap-2 text-xs">
                  <span
                    className={cn(
                      "h-2 w-2 rounded-full",
                      done || here ? "opacity-100" : "opacity-30",
                    )}
                    style={{ background: tierCss(t) }}
                  />
                  <span
                    className={cn(
                      here ? "font-semibold text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {t}
                    {done ? " ✓" : ""}
                    {here ? " · you're here" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {unlock && next ? (
        <div className="rounded-xl border border-[var(--flex)]/20 bg-[var(--flex-tint)] px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--flex)]">
            What {next} unlocks
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {unlock.unlockLabel} ≈ +${unlock.weeklyUsd}/week
          </p>
        </div>
      ) : null}

      {/* Stage 1 — Capability Profile (shared object) */}
      <CapabilityProfileSection
        profile={profile}
        jobs={jobs}
        focusCapabilityId={focusCapabilityId}
        onAddCapability={onAddCapability}
        onOpenCoaching={onOpenCoaching}
      />

      {/* Ratings */}
      <div className="rounded-xl border border-border bg-card p-3 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          Ratings
        </p>
        <div className="mt-1.5 flex items-center gap-1.5">
          <Star className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />
          <span className="text-sm font-semibold tabular">
            {profile.ratingsAvg.toFixed(1)}
          </span>
          <span className="text-xs text-muted-foreground">
            · {profile.ratingsCount} review
            {profile.ratingsCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Boost your score */}
      <Button
        type="button"
        className="h-auto w-full flex-col items-start gap-0.5 whitespace-normal px-3 py-3 text-left"
        onClick={onTakeCourse}
        disabled={training >= 6}
      >
        <span className="flex w-full items-start gap-2">
          <BookOpen className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="min-w-0 leading-snug">
            5-min course · +2 reliability
          </span>
        </span>
        <span className="pl-6 text-[11px] font-normal leading-snug opacity-90">
          {gap
            ? `Closes your ${CAPABILITY_LABEL[gap.id].toLowerCase()} gap · ${training}/6`
            : `Training bonus ${training}/6`}
          {training >= 6 ? " · capped" : ""}
        </span>
      </Button>
    </div>
  );
}

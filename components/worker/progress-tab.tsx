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
    <div>
      <div className="fx-lbl">Where you stand</div>
      <div className="fx-card">
        <div className="flex items-center gap-4">
          <ProgressRing
            value={result.score}
            color={
              result.tier === "Silver" ? "#8a93a3" : tierCss(result.tier)
            }
            label={String(result.score)}
            sub={ptsLabel}
            size={96}
          />
          <div className="min-w-0 flex-1">
            {TIERS.map((t) => {
              const idx = TIERS.indexOf(t);
              const cur = TIERS.indexOf(result.tier);
              const done = idx < cur;
              const here = t === result.tier;
              return (
                <div
                  key={t}
                  className={cn("fx-step", done && "done", here && "cur")}
                >
                  <span className="d" />
                  {t}
                  {here ? " · you're here" : ""}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {unlock && next ? (
        <div className="fx-unlock">
          <div className="t">What {next} unlocks</div>
          <div className="s">
            {unlock.unlockLabel} ≈ +${unlock.weeklyUsd}/week
          </div>
        </div>
      ) : null}

      <div className="fx-lbl">Capability profile</div>
      <CapabilityProfileSection
        profile={profile}
        jobs={jobs}
        focusCapabilityId={focusCapabilityId}
        onAddCapability={onAddCapability}
        onOpenCoaching={onOpenCoaching}
      />

      <div className="fx-lbl">Ratings</div>
      <div className="fx-card">
        <div className="flex items-baseline gap-2">
          <Star className="h-4 w-4 fill-[#f5a623] text-[#f5a623]" />
          <span className="text-2xl font-extrabold tabular">
            {profile.ratingsAvg.toFixed(1)}
          </span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            · {profile.ratingsCount} review
            {profile.ratingsCount === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <button type="button" className="fx-course" onClick={onTakeCourse} disabled={training >= 6}>
        <BookOpen className="h-5 w-5 shrink-0" />
        <div>
          <div className="t">5-min course · +2 reliability</div>
          <div className="s">
            {gap
              ? `Closes your ${CAPABILITY_LABEL[gap.id].toLowerCase()} gap · ${training}/6`
              : `Training bonus ${training}/6`}
            {training >= 6 ? " · capped" : ""}
          </div>
        </div>
      </button>
    </div>
  );
}

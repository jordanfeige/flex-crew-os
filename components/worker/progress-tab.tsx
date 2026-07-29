"use client";

import { BookOpen, Sparkles, TrendingUp } from "lucide-react";
import type { CapabilityJob } from "@/lib/capabilities";
import { CAPABILITY_LABEL } from "@/lib/capabilities";
import { coachingImpact } from "@/lib/capability-profile";
import { nextTierName } from "@/lib/engine";
import { opportunityInsight } from "@/lib/opportunity";
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
  const opportunity = opportunityInsight(profile.capabilities);

  const earned = profile.capabilities.filter((c) => c.earned);
  const gap = [...earned].sort(
    (a, b) => (a.reliabilityScore ?? 100) - (b.reliabilityScore ?? 100),
  )[0];
  const gapImpact = gap ? coachingImpact(gap) : null;

  const fromLabel = (() => {
    if (result.tier === "Elite") return "You're Elite — keep raising the bar";
    if (result.tier === "Recruit") {
      const need = ptsLabel.match(/^(\d+)/)?.[1] ?? "3";
      return `You're ${need} job${need === "1" ? "" : "s"} from Certified`;
    }
    const m = ptsLabel.match(/^(\d+)\s*pts?\s*to\s*(.+)$/i);
    if (m) {
      const n = m[1];
      return `You're ${n} point${n === "1" ? "" : "s"} from ${m[2]}`;
    }
    return `You're progressing toward ${next ?? "Elite"}`;
  })();

  return (
    <div>
      <p className="mb-3 px-0.5 text-[12.5px] leading-snug text-[var(--muted)]">
        Your skills determine the jobs you qualify for, your earning potential,
        and how quickly you progress within Flex.
      </p>

      <div className="fx-lbl">Your career path</div>
      <div className="fx-card">
        <div className="flex items-center gap-4">
          <ProgressRing
            value={result.score}
            color={
              result.tier === "Certified" ? "#8a93a3" : tierCss(result.tier)
            }
            label={String(result.score)}
            sub="Pro Score"
            size={104}
          />
          <div className="min-w-0 flex-1">
            <p className="mb-2 text-[13px] font-semibold leading-snug text-[var(--ink)]">
              {fromLabel}
            </p>
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
          <div className="t">{fromLabel}</div>
          <div className="s" style={{ marginTop: 6 }}>
            Unlocks
          </div>
          <ul className="mt-1.5 space-y-1">
            {unlock.unlocks.map((u) => (
              <li
                key={u}
                className="flex items-start gap-1.5 text-[12.5px] text-[var(--ink)]"
              >
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--flex)]" />
                {u}
              </li>
            ))}
            <li className="flex items-start gap-1.5 text-[12.5px] font-semibold text-[var(--ink)]">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--green)]" />
              Estimated +${unlock.weeklyUsd}/week earning potential
            </li>
          </ul>
        </div>
      ) : null}

      {opportunity ? (
        <div
          className="fx-card"
          style={{ borderColor: "rgba(34,96,249,0.25)" }}
        >
          <div className="mb-1.5 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-[var(--flex)]" />
            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--flex)]">
              Opportunity Engine
            </span>
          </div>
          <p className="text-[14px] font-bold leading-snug text-[var(--ink)]">
            You&apos;re leaving approximately ${opportunity.weeklyLeftOnTable}
            /week on the table.
          </p>
          <p className="mt-1.5 text-[12px] leading-snug text-[var(--muted)]">
            {opportunity.summary}
          </p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-md bg-[var(--flex-tint)] px-2 py-0.5 text-[10px] font-semibold text-[var(--flex)]">
              <TrendingUp className="h-3 w-3" />+
              {opportunity.earningsLiftPct}% weekly
            </span>
            <span className="rounded-md bg-[var(--green-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--green)]">
              +{opportunity.additionalJobsPerWeek} jobs/week
            </span>
          </div>
        </div>
      ) : null}

      <div className="fx-lbl">Your skills · Professional Score</div>
      <CapabilityProfileSection
        profile={profile}
        jobs={jobs}
        focusCapabilityId={focusCapabilityId}
        onAddCapability={onAddCapability}
        onOpenCoaching={onOpenCoaching}
      />

      <div className="fx-lbl">Customer trust</div>
      <div className="fx-card">
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span className="fx-tabular" style={{ fontSize: 24, fontWeight: 800 }}>
            {profile.ratingsAvg.toFixed(1)}
          </span>
          <span style={{ color: "#f5a623", fontSize: 14 }} aria-hidden>
            ★★★★★
          </span>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>
            · {profile.ratingsCount} review
            {profile.ratingsCount === 1 ? "" : "s"}
          </span>
        </div>
        <p style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
          Ratings feed your Professional Score and marketplace trust.
        </p>
      </div>

      <button
        type="button"
        className="fx-course"
        onClick={onTakeCourse}
        disabled={training >= 6}
      >
        <BookOpen className="h-5 w-5 shrink-0" />
        <div>
          <div className="t">
            {gapImpact
              ? `${gapImpact.title} · ${gapImpact.durationMin} min`
              : "5-min skill course"}
          </div>
          <div className="s">
            {gapImpact && gap
              ? `Improves ${CAPABILITY_LABEL[gap.id]} ${gapImpact.from} → ${gapImpact.to} · ≈ +$${gapImpact.weeklyUsd}/week · ${training}/6`
              : `Training bonus ${training}/6`}
            {training >= 6 ? " · capped" : ""}
          </div>
        </div>
      </button>
    </div>
  );
}

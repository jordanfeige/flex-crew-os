"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { CapabilityReliabilityBreakdown } from "@/lib/reviews";
import type { ScorePayload, Signals, Tier } from "@/lib/engine";
import type { MarketplacePayload } from "@/lib/marketplace";
import { SERVICE_LABEL, SERVICES } from "@/lib/capabilities";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function SignalBar({
  label,
  pct,
  display,
  pulse,
}: {
  label: string;
  pct: number;
  display: string;
  pulse: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex justify-between gap-2 text-[10px]">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-semibold tabular text-foreground">{display}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn(
            "h-full rounded-full bg-primary",
            pulse && "ring-2 ring-primary/40",
          )}
          initial={false}
          animate={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
          transition={{ type: "spring", stiffness: 160, damping: 22 }}
        />
      </div>
    </div>
  );
}

function PipelineNode({
  label,
  value,
  sub,
  active,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  active: boolean;
  className?: string;
}) {
  return (
    <motion.div
      animate={
        active
          ? { scale: 1.02, borderColor: "var(--primary)", boxShadow: "0 0 0 2px color-mix(in oklab, var(--primary) 25%, transparent)" }
          : { scale: 1, borderColor: "var(--border)", boxShadow: "0 0 0 0 transparent" }
      }
      transition={{ duration: 0.35 }}
      className={cn(
        "rounded-xl border bg-card px-3 py-2.5 shadow-card",
        className,
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular tracking-tight">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p> : null}
    </motion.div>
  );
}

function Connector({ active }: { active: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative flex h-8 items-center justify-center" aria-hidden>
      <div className="h-full w-px bg-border" />
      {!reduce && active ? (
        <motion.span
          key={String(active)}
          className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-primary"
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: 28, opacity: 0.15 }}
          transition={{ duration: 0.55, ease: "easeInOut" }}
        />
      ) : null}
    </div>
  );
}

export function EnginePipeline({
  signals,
  result,
  market,
  pulseKey,
  capabilityReliability,
}: {
  signals: Signals;
  result: ScorePayload;
  market: MarketplacePayload;
  /** Bumps when signals change — drives pulse animation. */
  pulseKey: string;
  capabilityReliability: CapabilityReliabilityBreakdown;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "signals" | "engine" | "outputs">("idle");
  const [openBreakdown, setOpenBreakdown] = useState(false);

  useEffect(() => {
    if (reduce) {
      setPhase("idle");
      return;
    }
    setPhase("signals");
    const t1 = window.setTimeout(() => setPhase("engine"), 220);
    const t2 = window.setTimeout(() => setPhase("outputs"), 480);
    const t3 = window.setTimeout(() => setPhase("idle"), 1100);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [pulseKey, reduce]);

  const impact = result.estimatedImpact;
  const coachLine =
    impact.nextTier != null
      ? `${impact.probFrom}% → ${impact.probTo}% ${impact.nextTier}`
      : "Elite hold";

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Reliability engine</CardTitle>
          <Badge variant="engine">One engine</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-1">
        {/* Signals */}
        <div
          className={cn(
            "rounded-xl border border-border bg-muted/30 p-3 transition-shadow",
            phase === "signals" && "shadow-elevated ring-1 ring-primary/30",
          )}
        >
          <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Signals
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <SignalBar
              label="On-time"
              pct={signals.onTimeRate * 100}
              display={`${Math.round(signals.onTimeRate * 100)}%`}
              pulse={phase === "signals"}
            />
            <SignalBar
              label="Rating"
              pct={(signals.avgRating / 5) * 100}
              display={signals.avgRating.toFixed(2)}
              pulse={phase === "signals"}
            />
            <SignalBar
              label="Acceptance"
              pct={signals.acceptanceRate * 100}
              display={`${Math.round(signals.acceptanceRate * 100)}%`}
              pulse={phase === "signals"}
            />
            <SignalBar
              label="Jobs"
              pct={(Math.min(signals.jobsCompleted, 10) / 10) * 100}
              display={`${signals.jobsCompleted}/10`}
              pulse={phase === "signals"}
            />
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {signals.lateCancellations > 0 ? (
              <Badge variant="critical" className="normal-case tracking-normal">
                Late cancels {signals.lateCancellations}
              </Badge>
            ) : null}
            {signals.noShows > 0 ? (
              <Badge variant="critical" className="normal-case tracking-normal">
                No-shows {signals.noShows}
              </Badge>
            ) : null}
            {(signals.trainingBonus ?? 0) > 0 ? (
              <Badge variant="live" className="normal-case tracking-normal">
                Training +{signals.trainingBonus}
              </Badge>
            ) : null}
            {signals.lateCancellations === 0 &&
            signals.noShows === 0 &&
            !(signals.trainingBonus ?? 0) ? (
              <span className="text-[11px] text-muted-foreground">No penalty chips</span>
            ) : null}
          </div>
        </div>

        <Connector active={phase === "engine" || phase === "signals"} />

        {/* Engine spine */}
        <motion.div
          animate={
            phase === "engine"
              ? { scale: 1.01 }
              : { scale: 1 }
          }
          className={cn(
            "rounded-xl border border-border bg-card px-4 py-3 shadow-card",
            phase === "engine" && "border-primary/50 shadow-elevated",
          )}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Reliability engine
          </p>
          <div className="mt-1 flex items-end justify-between gap-3">
            <div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={result.score}
                  initial={reduce ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduce ? undefined : { opacity: 0 }}
                  className="text-3xl font-semibold tabular tracking-tight"
                >
                  {result.score}
                </motion.p>
              </AnimatePresence>
              <p className="text-xs text-muted-foreground">Live score · signals</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold" style={{ color: tierColor(result.tier) }}>
                {result.tier}
              </p>
              <p className="text-xs text-muted-foreground">
                Next gate {result.nextThreshold}
              </p>
            </div>
          </div>

          {/* Per-capability reliability from reviews */}
          <div className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Overall reliability
              </p>
              <motion.p
                key={capabilityReliability.overall}
                initial={reduce ? false : { opacity: 0.4 }}
                animate={{ opacity: 1 }}
                className="text-xl font-semibold tabular tracking-tight"
              >
                {capabilityReliability.overall}
              </motion.p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
              {SERVICES.map((s) => (
                <div key={s} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">{SERVICE_LABEL[s]}</span>
                  <motion.span
                    key={`${s}-${capabilityReliability.byService[s]}`}
                    initial={reduce ? false : { opacity: 0.4 }}
                    animate={{ opacity: 1 }}
                    className="font-semibold tabular text-foreground"
                  >
                    {capabilityReliability.byService[s]}
                  </motion.span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">
              From capability-tagged reviews · missing caps drag the service score
            </p>
          </div>

          <button
            type="button"
            onClick={() => setOpenBreakdown((o) => !o)}
            className="mt-3 flex w-full items-center justify-between rounded-lg border border-border bg-muted/40 px-3 py-2 text-left text-xs font-medium transition-colors hover:bg-muted"
            aria-expanded={openBreakdown}
          >
            How it&apos;s computed
            <ChevronDown
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                openBreakdown && "rotate-180",
              )}
            />
          </button>
          <AnimatePresence initial={false}>
            {openBreakdown ? (
              <motion.div
                initial={reduce ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reduce ? undefined : { height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2 divide-y divide-border rounded-lg border border-border px-3">
                  {result.breakdown.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-0.5 py-2"
                    >
                      <span className="text-sm font-medium">{row.label}</span>
                      <span className="text-xs tabular text-muted-foreground">
                        {row.weightPct > 0 ? `${row.weightPct}%` : "—"}
                      </span>
                      <span
                        className={cn(
                          "min-w-10 text-right text-sm font-semibold tabular",
                          row.points >= 0 ? "text-good" : "text-critical",
                        )}
                      >
                        {row.points >= 0 ? "+" : ""}
                        {row.points.toFixed(1)}
                      </span>
                      <span className="col-span-3 text-xs text-muted-foreground">
                        {row.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.div>

        <Connector active={phase === "outputs" || phase === "engine"} />

        {/* Outputs */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            Outputs
          </p>
          <div className="grid grid-cols-2 gap-2">
            <PipelineNode
              label="Tier"
              value={result.tier}
              sub={`${result.pointsToNextTier} pts to next`}
              active={phase === "outputs"}
            />
            <PipelineNode
              label="AI Coach"
              value={coachLine}
              sub={impact.action}
              active={phase === "outputs"}
            />
            <PipelineNode
              label="Marketplace health"
              value={`${market.supplyHealth}/100`}
              sub={`Δ ${market.healthDelta > 0 ? "−" : "+"}${Math.abs(market.healthDelta)} wk`}
              active={phase === "outputs"}
            />
            <PipelineNode
              label="Recommendations"
              value={`Fill +${market.fillLift}%`}
              sub={`Fast-track ${market.fastTrackReady}`}
              active={phase === "outputs"}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function tierColor(t: Tier): string {
  if (t === "Recruit") return "var(--recruit)";
  if (t === "Shadow") return "var(--shadow-tier)";
  if (t === "Pro") return "var(--pro)";
  return "var(--elite)";
}

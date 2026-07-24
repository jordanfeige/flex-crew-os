"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Flame,
  GraduationCap,
  Inbox,
  Radio,
  Shield,
  Sparkles,
  TrendingUp,
  Users,
  AlertTriangle,
  DollarSign,
} from "lucide-react";
import { CREW, MATCHED_JOBS, PERKS_BY_TIER, PIPELINE, type CrewMember } from "@/lib/data";
import { evaluateMarketplace, SHORTAGES } from "@/lib/marketplace";
import {
  evaluate,
  nextTierName,
  type Signals,
  type Tier,
} from "@/lib/engine";
import {
  onTimeStreak,
  sinceYouLeft,
  tierMoney,
  tierRank,
  TIER_ECONOMICS,
} from "@/lib/stickiness";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

function cloneSignals(s: Signals): Signals {
  return { ...s, trainingBonus: s.trainingBonus ?? 0 };
}

function tierCss(t: Tier): string {
  if (t === "Recruit") return "var(--recruit)";
  if (t === "Shadow") return "var(--shadow-tier)";
  if (t === "Pro") return "var(--pro)";
  return "var(--elite)";
}

const TIERS: Tier[] = ["Recruit", "Shadow", "Pro", "Elite"];

const NAV = [
  { href: "#simulator", label: "Simulator", icon: Radio },
  { href: "#experience", label: "Experience", icon: Users },
  { href: "#engine", label: "Engine", icon: Shield },
  { href: "#marketplace", label: "Marketplace", icon: TrendingUp },
] as const;

function ProgressRing({
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
  const r = 48;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value)) / 100;
  const dash = c * pct;

  return (
    <div className="relative h-[120px] w-[120px] shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--border)" strokeWidth="9" />
        <motion.circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          initial={false}
          animate={{ strokeDasharray: `${dash} ${c - dash}` }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={label}
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -4 }}
            className="text-2xl font-semibold tabular tracking-tight"
          >
            {label}
          </motion.span>
        </AnimatePresence>
        <span className="mt-0.5 max-w-[4.5rem] text-[10px] leading-tight text-muted-foreground">
          {sub}
        </span>
      </div>
    </div>
  );
}

function HealthRadial({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const v = Math.min(100, Math.max(0, value));
  const r = 58;
  const cx = 80;
  const cy = 78;
  const track = `M ${cx - r} ${cy} A ${r} ${r} 0 0 0 ${cx + r} ${cy}`;
  // Semicircle length = πr
  const length = Math.PI * r;
  const filled = (v / 100) * length;

  const status =
    v >= 75
      ? { color: "var(--good)", label: "Healthy", hint: "Fill + reliability holding" }
      : v >= 55
        ? { color: "var(--warn)", label: "Watch", hint: "Gaps or churn pressure" }
        : { color: "var(--critical)", label: "At risk", hint: "Liquidity under strain" };

  return (
    <div className="rounded-xl border border-border bg-muted/30 px-3 pb-3 pt-2">
      <div className="relative mx-auto w-[160px]">
        <svg
          viewBox="0 0 160 96"
          className="mx-auto h-[96px] w-[160px] overflow-visible"
          aria-hidden
        >
          {/* Track */}
          <path
            d={track}
            fill="none"
            stroke="var(--border)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Value */}
          <motion.path
            key={v}
            d={track}
            fill="none"
            stroke={status.color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={`${filled} ${length}`}
            initial={reduce ? false : { strokeDasharray: `0 ${length}` }}
            animate={{ strokeDasharray: `${filled} ${length}` }}
            transition={
              reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 22 }
            }
          />
          {/* End cap tick marks at 0 / 50 / 100 */}
          {[0, 0.5, 1].map((t) => {
            // Upper semicircle: π → 0 going counterclockwise (SVG y-down)
            const a = Math.PI * (1 - t);
            const x1 = cx + (r - 7) * Math.cos(a);
            const y1 = cy - (r - 7) * Math.sin(a);
            const x2 = cx + (r + 7) * Math.cos(a);
            const y2 = cy - (r + 7) * Math.sin(a);
            return (
              <line
                key={t}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--muted-foreground)"
                strokeWidth="1.5"
                strokeOpacity="0.35"
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
          <motion.p
            key={value}
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[1.75rem] font-semibold leading-none tabular tracking-tight"
          >
            {value}
            <span className="text-sm font-medium text-muted-foreground">/100</span>
          </motion.p>
        </div>
      </div>
      <div className="mt-1 text-center">
        <p className="text-xs font-medium text-foreground">Marketplace health</p>
        <p className="mt-0.5 flex items-center justify-center gap-1.5 text-[11px]">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: status.color }}
            aria-hidden
          />
          <span className="font-semibold" style={{ color: status.color }}>
            {status.label}
          </span>
          <span className="text-muted-foreground">· {status.hint}</span>
        </p>
      </div>
    </div>
  );
}

function Stepper({
  value,
  onChange,
  min = 0,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Decrease"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </Button>
      <span className="min-w-8 text-center text-sm font-semibold tabular">{value}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Increase"
        onClick={() => onChange(value + 1)}
      >
        +
      </Button>
    </div>
  );
}

const DEFAULT_WORKER_ID = "deshawn";

function seedSignals(id: string): Signals {
  const member = CREW.find((c) => c.id === id) ?? CREW.find((c) => c.id === DEFAULT_WORKER_ID)!;
  return cloneSignals(member.signals);
}

export default function HomePage() {
  const reduce = useReducedMotion();
  const [selectedId, setSelectedId] = useState(DEFAULT_WORKER_ID);
  const [signals, setSignals] = useState<Signals>(() => seedSignals(DEFAULT_WORKER_ID));
  const [incentiveUsd, setIncentiveUsd] = useState(15);
  const [logoOk, setLogoOk] = useState(true);
  const [activeNav, setActiveNav] = useState("#simulator");
  const mainRef = useRef<HTMLElement>(null);
  const prevTierRef = useRef<Tier | null>(null);
  const [graduation, setGraduation] = useState<{ from: Tier; to: Tier } | null>(
    null,
  );

  function goTo(href: string) {
    setActiveNav(href);
    if (href === "#simulator") {
      mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectWorker(id: string) {
    const nextSignals = seedSignals(id);
    setSelectedId(id);
    setSignals(nextSignals);
    setGraduation(null);
    // Seed prev tier to the new worker so we don't false-celebrate on switch
    prevTierRef.current = evaluate(nextSignals).tier;
  }

  function resetSeed() {
    const nextSignals = seedSignals(selectedId);
    setSignals(nextSignals);
    setGraduation(null);
    prevTierRef.current = evaluate(nextSignals).tier;
  }

  function patch(partial: Partial<Signals>) {
    setSignals((prev) => ({ ...prev, ...partial }));
  }

  function takeCourse() {
    setSignals((prev) => {
      const current = prev.trainingBonus ?? 0;
      if (current >= 6) return prev;
      return { ...prev, trainingBonus: Math.min(6, current + 2) };
    });
  }

  const result = useMemo(() => evaluate(signals), [signals]);
  const market = useMemo(
    () => evaluateMarketplace(incentiveUsd, { id: selectedId, signals }),
    [incentiveUsd, selectedId, signals],
  );
  const next = nextTierName(result.tier);
  const training = signals.trainingBonus ?? 0;
  const jobs = MATCHED_JOBS[result.tier];
  const perks = PERKS_BY_TIER[result.tier];
  const member: CrewMember = CREW.find((c) => c.id === selectedId) ?? CREW[0];
  const impact = result.estimatedImpact;
  const money = useMemo(() => tierMoney(signals), [signals]);
  const streak = useMemo(() => onTimeStreak(signals), [signals]);
  const dryOpen = useMemo(() => sinceYouLeft(signals), [signals]);

  useEffect(() => {
    const prev = prevTierRef.current;
    if (prev !== null && tierRank(result.tier) > tierRank(prev)) {
      setGraduation({ from: prev, to: result.tier });
      const timeout = window.setTimeout(() => setGraduation(null), 3200);
      prevTierRef.current = result.tier;
      return () => window.clearTimeout(timeout);
    }
    prevTierRef.current = result.tier;
  }, [result.tier]);

  // Initialize prev tier on first mount (Deshawn seed)
  useEffect(() => {
    if (prevTierRef.current === null) {
      prevTierRef.current = result.tier;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ptsLabel =
    result.tier === "Elite"
      ? "Elite"
      : result.tier === "Recruit"
        ? `${Math.max(0, 3 - signals.jobsCompleted)} job${3 - signals.jobsCompleted === 1 ? "" : "s"} to Shadow`
        : `${result.pointsToNextTier} pts to ${next}`;

  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.28, ease: "easeOut" as const },
      };

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Sidebar — Gymdesk schema */}
      <aside className="hidden h-dvh w-[240px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <div className="flex items-center border-b border-sidebar-border px-4 py-4">
          {logoOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/logo-flex.png"
              alt="Flex"
              height={28}
              className="h-7 w-auto"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-[11px] font-semibold text-primary-foreground">
              Fx
            </span>
          )}
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3 py-4" aria-label="Workspace">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          {NAV.map(({ href, label, icon: Icon }) => (
            <a
              key={href}
              href={href}
              onClick={(e) => {
                e.preventDefault();
                goTo(href);
              }}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                activeNav === href
                  ? "bg-sidebar-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", activeNav === href && "text-primary")} />
              <span className="flex-1">{label}</span>
              {activeNav === href ? (
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
              ) : null}
            </a>
          ))}
        </nav>
      </aside>

      <div className="flex h-dvh min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 md:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              Flex Crew OS · Supply Lifecycle Platform
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
              JF
            </span>
          </div>
        </header>

        {/* Fixed under top nav — never scrolls away */}
        <div
          id="simulator"
          className="z-40 shrink-0 border-b border-border bg-card px-4 py-3 md:px-6 lg:px-8"
        >
          <Card className="mx-auto max-w-[1280px] shadow-elevated">
            <CardHeader className="flex-row items-start justify-between gap-3 space-y-0 border-b-0 pb-0 sm:items-center">
              <div>
                <CardTitle className="text-sm">Simulator · {member.name}</CardTitle>
                <CardDescription>
                  Nudge a signal — every surface recomputes from one engine.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-9 rounded-lg border border-border bg-card px-3 text-sm shadow-card"
                  value={selectedId}
                  onChange={(e) => selectWorker(e.target.value)}
                  aria-label="Worker"
                >
                  {CREW.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} · {c.city}
                    </option>
                  ))}
                </select>
                <Button type="button" variant="link" className="h-auto px-0" onClick={resetSeed}>
                  Reset to seed
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>On-time</span>
                  <span className="font-semibold tabular text-foreground">
                    {Math.round(signals.onTimeRate * 100)}%
                  </span>
                </div>
                <input
                  key={`${selectedId}-onTime`}
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  autoComplete="off"
                  className="w-full accent-[var(--primary)]"
                  value={Math.round(signals.onTimeRate * 100)}
                  onChange={(e) => patch({ onTimeRate: Number(e.target.value) / 100 })}
                  aria-label="On-time rate"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Acceptance</span>
                  <span className="font-semibold tabular text-foreground">
                    {Math.round(signals.acceptanceRate * 100)}%
                  </span>
                </div>
                <input
                  key={`${selectedId}-acceptance`}
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  className="w-full accent-[var(--primary)]"
                  value={Math.round(signals.acceptanceRate * 100)}
                  onChange={(e) =>
                    patch({ acceptanceRate: Number(e.target.value) / 100 })
                  }
                  aria-label="Acceptance rate"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Avg rating</span>
                  <span className="font-semibold tabular text-foreground">
                    {signals.avgRating.toFixed(2)}
                  </span>
                </div>
                <input
                  key={`${selectedId}-rating`}
                  type="range"
                  min={0}
                  max={500}
                  step={1}
                  className="w-full accent-[var(--primary)]"
                  value={Math.round(signals.avgRating * 100)}
                  onChange={(e) => patch({ avgRating: Number(e.target.value) / 100 })}
                  aria-label="Average rating"
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Jobs completed</p>
                <Stepper
                  value={signals.jobsCompleted}
                  onChange={(n) => patch({ jobsCompleted: n })}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Late cancellations</p>
                <Stepper
                  value={signals.lateCancellations}
                  onChange={(n) => patch({ lateCancellations: n })}
                />
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">No-shows</p>
                <Stepper value={signals.noShows} onChange={(n) => patch({ noShows: n })} />
              </div>
            </CardContent>
          </Card>
        </div>

        <main ref={mainRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 md:p-6 lg:p-8">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
            {/* Three columns */}
            <div id="experience" className="scroll-mt-4 grid gap-5 lg:grid-cols-3">
              {/* LEFT — Worker */}
              <motion.div {...fade}>
                <Card className="relative h-full overflow-hidden">
                  <AnimatePresence>
                    {graduation ? (
                      <motion.div
                        key={`${graduation.from}-${graduation.to}`}
                        initial={reduce ? false : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-20 flex items-center justify-center bg-card/95 p-6 backdrop-blur-sm"
                      >
                        <motion.div
                          initial={reduce ? false : { scale: 0.85, y: 12 }}
                          animate={{ scale: 1, y: 0 }}
                          transition={{ type: "spring", stiffness: 260, damping: 18 }}
                          className="max-w-[240px] text-center"
                        >
                          <motion.div
                            animate={
                              reduce
                                ? undefined
                                : { scale: [1, 1.08, 1], rotate: [0, -2, 2, 0] }
                            }
                            transition={{ duration: 0.7 }}
                            className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full text-white"
                            style={{ background: tierCss(graduation.to) }}
                          >
                            <GraduationCap className="h-7 w-7" />
                          </motion.div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            You graduated
                          </p>
                          <p className="mt-1 text-xl font-semibold tracking-tight">
                            {graduation.from} → {graduation.to}
                          </p>
                          <p className="mt-2 text-sm font-medium text-primary">
                            {TIER_ECONOMICS[graduation.to].headline}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Priority matching is live · illustrative earnings
                          </p>
                        </motion.div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle>Worker experience</CardTitle>
                      <Badge variant="live">Engagement</Badge>
                    </div>
                    <CardDescription>Career ladder · money · reason to open</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-center gap-3">
                      <div
                        className="grid h-11 w-11 place-items-center rounded-full text-sm font-semibold text-white"
                        style={{ background: tierCss(result.tier) }}
                      >
                        {member.avatar}
                      </div>
                      <div>
                        <p className="font-semibold tracking-tight">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.city}</p>
                      </div>
                      <Badge
                        className="ml-auto border-0 text-white"
                        style={{ background: tierCss(result.tier) }}
                      >
                        {result.tier}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-4">
                      <ProgressRing
                        value={result.score}
                        color={tierCss(result.tier)}
                        label={String(result.score)}
                        sub={ptsLabel}
                      />
                      <div className="min-w-0 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Career path
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {TIERS.map((t) => {
                            const active = result.tier === t;
                            const passed =
                              TIERS.indexOf(t) <= TIERS.indexOf(result.tier) &&
                              !(result.tier === "Recruit" && t !== "Recruit");
                            return (
                              <div key={t} className="flex items-center gap-2 text-xs">
                                <span
                                  className={cn(
                                    "h-2 w-2 rounded-full",
                                    active || passed ? "opacity-100" : "opacity-30",
                                  )}
                                  style={{ background: tierCss(t) }}
                                />
                                <span
                                  className={cn(
                                    active
                                      ? "font-semibold text-foreground"
                                      : "text-muted-foreground",
                                  )}
                                >
                                  {t}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Progression pays */}
                    {money.next ? (
                      <div className="rounded-xl border border-good/25 bg-good-tint/60 px-3 py-2.5">
                        <div className="flex items-start gap-2">
                          <DollarSign className="mt-0.5 h-4 w-4 shrink-0 text-good" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {money.headline}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              Illustrative ·{" "}
                              {result.tier === "Recruit"
                                ? `${Math.max(0, 3 - signals.jobsCompleted)} more job${3 - signals.jobsCompleted === 1 ? "" : "s"} to unlock`
                                : `${result.pointsToNextTier} pts to unlock`}{" "}
                              · same reliability score
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {money.demotion ? (
                      <div className="rounded-xl border border-warn/30 bg-warn-tint px-3 py-2 text-xs text-warn">
                        <strong className="font-semibold">Keep your tier</strong> —{" "}
                        {money.demotion}
                      </div>
                    ) : null}

                    {/* Dry open — kills the bounce */}
                    <div className="rounded-xl border border-border bg-muted/40 p-3">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-sm font-semibold">
                          <Inbox className="h-4 w-4 text-primary" />
                          Since you left
                        </div>
                        {streak.count > 0 ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              streak.atRiskHours <= 6
                                ? "bg-warn-tint text-warn"
                                : "bg-accent text-accent-foreground",
                            )}
                          >
                            <Flame className="h-3 w-3" />
                            {streak.count} · {streak.atRiskHours}h
                          </span>
                        ) : null}
                      </div>
                      <ul className="space-y-1.5">
                        {dryOpen.map((line) => (
                          <li
                            key={line.id}
                            className={cn(
                              "text-xs leading-relaxed",
                              line.tone === "money" && "font-medium text-foreground",
                              line.tone === "risk" && "text-warn",
                              line.tone === "learn" && "text-muted-foreground",
                              line.tone === "neutral" && "text-muted-foreground",
                            )}
                          >
                            {line.text}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Perks · {result.tier}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {perks.map((p) => (
                          <span
                            key={p}
                            className="rounded-md bg-accent px-2 py-1 text-[11px] font-medium text-accent-foreground"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Card className="border-primary/20 bg-muted/40 shadow-none">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                          <Sparkles className="h-4 w-4 text-primary" />
                          AI Coach
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Daily goal
                          </p>
                          <p className="text-sm">{result.dailyGoal}</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Next best action
                          </p>
                          <p className="text-sm">{result.nextBestAction}</p>
                        </div>
                        <motion.div
                          key={`${impact.deltaPoints}-${impact.probabilityOfNextTier}-${money.weeklyUsd}`}
                          initial={reduce ? false : { opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-lg border border-border bg-card px-3 py-2"
                        >
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                            Estimated impact · illustrative
                          </p>
                          <p className="mt-1 text-sm font-semibold tabular text-primary">
                            {impact.deltaPoints >= 0 ? "+" : ""}
                            {impact.deltaPoints} Reliability → {impact.probabilityOfNextTier}% chance
                            of {next ?? "Elite"}
                          </p>
                          {money.next ? (
                            <p className="mt-0.5 text-xs font-medium text-good">
                              Unlock ≈ +${money.weeklyUsd}/week
                            </p>
                          ) : null}
                          <p className="mt-0.5 text-xs text-muted-foreground">{impact.action}</p>
                        </motion.div>
                        <p className="border-l-[3px] border-primary pl-2.5 text-xs leading-relaxed">
                          {result.coachNudge}
                        </p>
                      </CardContent>
                    </Card>

                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Matched jobs
                        {(result.tier === "Pro" || result.tier === "Elite") && " · priority"}
                      </p>
                      <div className="space-y-1.5">
                        {jobs.map((j) => (
                          <div
                            key={j.title}
                            className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                          >
                            <div>
                              <p className="text-xs font-medium">{j.title}</p>
                              <p className="text-[11px] text-muted-foreground">{j.note}</p>
                            </div>
                            <span className="text-xs font-semibold tabular text-primary">
                              {j.pay}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="h-auto w-full flex-col items-start gap-0.5 py-3"
                      onClick={takeCourse}
                      disabled={training >= 6}
                    >
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        5-min furniture-handling course · +2 reliability
                      </span>
                      <span className="text-[11px] font-normal opacity-90">
                        Training bonus {training}/6{training >= 6 ? " · capped" : ""}
                      </span>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              {/* CENTER — Engine */}
              <motion.div id="engine" className="scroll-mt-4" key={`engine-${result.score}`} {...fade}>
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle>Reliability engine</CardTitle>
                      <Badge variant="engine">Explainability</Badge>
                    </div>
                    <CardDescription>
                      Transparent weighted sum — the spine of every surface.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Live score</p>
                        <p className="text-3xl font-semibold tabular tracking-tight">{result.score}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Next threshold</p>
                        <p className="text-lg font-semibold tabular">{result.nextThreshold}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {result.churnRisk.risk ? (
                        <Badge variant="critical" className="gap-1 normal-case tracking-normal">
                          <AlertTriangle className="h-3 w-3" />
                          Churn risk · {result.churnRisk.reason}
                        </Badge>
                      ) : (
                        <Badge variant="live">No churn flags</Badge>
                      )}
                      {result.tier === "Shadow" && result.pointsToNextTier <= 4 ? (
                        <Badge variant="warn" className="gap-1 normal-case tracking-normal">
                          <GraduationCap className="h-3 w-3" />
                          Graduation-ready · {result.pointsToNextTier} pts to Pro
                        </Badge>
                      ) : null}
                    </div>

                    <div className="divide-y divide-border">
                      {result.breakdown.map((row) => (
                        <div key={row.label} className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-0.5 py-2.5 first:pt-0 last:pb-0">
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
                          <span className="col-span-3 text-xs text-muted-foreground">{row.reason}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* RIGHT — Marketplace */}
              <motion.div
                id="marketplace"
                className="scroll-mt-4"
                key={`mkt-${market.supplyHealth}-${market.fillLift}`}
                {...fade}
              >
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <CardTitle>Marketplace intelligence</CardTitle>
                      <Badge variant="engine">Liquidity</Badge>
                    </div>
                    <CardDescription>Same score → shortages, fill, churn.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <HealthRadial value={market.supplyHealth} />

                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Worker pipeline · {PIPELINE.dau.toLocaleString()} DAU
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {(
                          [
                            ["Recruit", PIPELINE.recruit, "recruit"],
                            ["Shadow", PIPELINE.shadow, "shadow-tier"],
                            ["Pro", PIPELINE.pro, "pro"],
                            ["Elite", PIPELINE.elite, "elite"],
                          ] as const
                        ).map(([label, count, key]) => (
                          <div
                            key={label}
                            className={cn(
                              "rounded-xl border border-border bg-card p-3 shadow-card transition-shadow",
                              result.tier === label && "border-primary/40 shadow-elevated",
                            )}
                          >
                            <p className="text-xs font-medium text-muted-foreground">{label}</p>
                            <p
                              className="mt-1 text-xl font-semibold tabular tracking-tight"
                              style={{ color: `var(--${key})` }}
                            >
                              {count.toLocaleString()}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {result.tier === label ? `${member.name.split(" ")[0]} is here` : "\u00a0"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Predicted supply issues
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-border text-left text-[10px] uppercase tracking-wide text-muted-foreground">
                              <th className="pb-2 pr-2 font-semibold">City</th>
                              <th className="pb-2 pr-2 font-semibold">Slot</th>
                              <th className="pb-2 pr-2 font-semibold">Demand</th>
                              <th className="pb-2 pr-2 font-semibold">Supply</th>
                              <th className="pb-2 font-semibold">Gap</th>
                            </tr>
                          </thead>
                          <tbody>
                            {SHORTAGES.map((s) => (
                              <tr key={`${s.city}-${s.slot}`} className="border-b border-border last:border-0">
                                <td className="py-2 pr-2">{s.city}</td>
                                <td className="py-2 pr-2">{s.slot}</td>
                                <td className="py-2 pr-2 tabular">{s.demand}</td>
                                <td className="py-2 pr-2 tabular">{s.supply}</td>
                                <td
                                  className={cn(
                                    "py-2 font-semibold tabular",
                                    s.gap < 0 && "text-critical",
                                  )}
                                >
                                  {s.gap}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
                      <p className="text-sm font-semibold">Incentive to close gaps</p>
                      <p className="text-xs text-muted-foreground">
                        Slot bonus ${incentiveUsd} — diminishing returns
                      </p>
                      <Slider
                        min={0}
                        max={30}
                        step={1}
                        value={[incentiveUsd]}
                        onValueChange={([v]) => setIncentiveUsd(v)}
                      />
                      <p className="text-lg font-semibold tabular text-primary">
                        Expected fill +{market.fillLift}%
                      </p>
                    </div>

                    <div className="grid gap-2">
                      <div className="rounded-xl border border-border bg-muted/40 p-3">
                        <p className="text-sm font-semibold">Fast-track Shadow → Pro</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Within 4 pts of Pro · +9% reliability lift illustrative
                        </p>
                        <p className="mt-2 text-lg font-semibold tabular text-primary">
                          Fast-track {market.fastTrackReady}
                        </p>
                      </div>
                      <div className="rounded-xl border border-border bg-muted/40 p-3">
                        <p className="text-sm font-semibold">Invite recruits</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Activation stalls after onboarding — true activation is job 3–4
                        </p>
                        <p className="mt-2 text-lg font-semibold tabular text-primary">
                          Invite {market.inviteRecruits.count} ·{" "}
                          {market.inviteRecruits.expectedConversionPct}% conv.
                        </p>
                      </div>
                    </div>

                    {result.churnRisk.risk ? (
                      <div className="rounded-xl border border-critical/20 bg-critical-tint px-3 py-2.5 text-xs text-critical">
                        <strong className="font-semibold">{member.name.split(" ")[0]} churn risk</strong>
                        {" — "}
                        {result.churnRisk.reason}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

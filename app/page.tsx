"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import {
  Boxes,
  ChevronDown,
  GraduationCap,
  Radio,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { CREW, type CrewMember } from "@/lib/data";
import {
  CAPABILITY_JOBS,
  SEED_REVIEWS,
  WORKER_CAPABILITIES,
  capabilityWorkerById,
  capabilityWorkers,
} from "@/data/reviews";
import { jobPayTotal, type Capability, type CapabilityJob } from "@/lib/capabilities";
import { evaluateMarketplace } from "@/lib/marketplace";
import { evaluateCopilot } from "@/lib/copilot";
import {
  evaluate,
  nextTierName,
  type Signals,
  type Tier,
} from "@/lib/engine";
import type { Review } from "@/lib/reviews";
import { tierRank, TIER_ECONOMICS } from "@/lib/stickiness";
import { buildWorkerProfile, matchScore } from "@/lib/worker";
import { COACHING_MODULES } from "@/lib/coaching";
import { CapabilityEngineSection } from "@/components/capability-engine";
import { EnginePipeline } from "@/components/engine-pipeline";
import { MarketplaceCopilot } from "@/components/marketplace-copilot";
import { MarketplaceHero } from "@/components/marketplace-hero";
import { WorkerHomeTab } from "@/components/worker/home-tab";
import { WorkerProgressTab } from "@/components/worker/progress-tab";
import { CapabilityVettingSheet } from "@/components/worker/capability-vetting";
import { PhoneFrame } from "@/components/worker/phone-frame";
import { tierCss, tierPillClass } from "@/components/worker/tier";
import {
  JobDetailScreen,
  type JobDetailMode,
} from "@/components/worker-app/job-clarity";
import { RatingModal } from "@/components/worker-app/rating-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

function cloneSignals(s: Signals): Signals {
  return { ...s, trainingBonus: s.trainingBonus ?? 0 };
}

const SEED_BOOKED =
  CAPABILITY_JOBS.find((j) => j.id === "job-move-2br") ?? CAPABILITY_JOBS[0];

/** Always pull the catalog row so demo jobs keep walkthrough media. */
function resolveCatalogJob(job: CapabilityJob): CapabilityJob {
  return CAPABILITY_JOBS.find((j) => j.id === job.id) ?? job;
}

const NAV = [
  { href: "#marketplace-hero", label: "Marketplace", icon: TrendingUp },
  { href: "#simulator", label: "Simulator", icon: Radio },
  { href: "#experience", label: "Experience", icon: Users },
  { href: "#engine", label: "Engine", icon: Shield },
  { href: "#capability-engine", label: "Cap Engine", icon: Boxes },
] as const;

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
  const [activeNav, setActiveNav] = useState("#marketplace-hero");
  const mainRef = useRef<HTMLElement>(null);
  const prevTierRef = useRef<Tier | null>(null);
  const [graduation, setGraduation] = useState<{ from: Tier; to: Tier } | null>(
    null,
  );
  const [highlightExperience, setHighlightExperience] = useState(false);
  const [reviews, setReviews] = useState<Review[]>(() => [...SEED_REVIEWS]);
  const [clarityJob, setClarityJob] = useState<CapabilityJob | null>(null);
  const [detailMode, setDetailMode] = useState<JobDetailMode>("claimable");
  const [detailMatch, setDetailMatch] = useState(0);
  const [bookedJob, setBookedJob] = useState<CapabilityJob | null>(SEED_BOOKED);
  const [ratingJob, setRatingJob] = useState<CapabilityJob | null>(null);
  /** Home | Progress — one worker home, two segments. */
  const [workerTab, setWorkerTab] = useState<"home" | "progress">("home");
  const [weekEarnings, setWeekEarnings] = useState(0);
  const [claimToast, setClaimToast] = useState<string | null>(null);
  /** Collapsed by default so Worker / Capability Engine stay in view. */
  const [simOpen, setSimOpen] = useState(false);
  /** Earned capabilities overlay — starts from seed, grows via vetting. */
  const [earnedCaps, setEarnedCaps] = useState<Capability[]>(
    () => WORKER_CAPABILITIES[DEFAULT_WORKER_ID] ?? [],
  );
  const [vettingOpen, setVettingOpen] = useState(false);
  const [focusCapabilityId, setFocusCapabilityId] = useState<string | null>(null);

  function goTo(href: string) {
    setActiveNav(href);
    if (href === "#simulator") {
      setSimOpen(true);
      if (window.matchMedia("(min-width: 768px)").matches) {
        mainRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (href === "#capability-engine" || href === "#experience") {
      setSimOpen(false);
    }
    const el = document.querySelector(href);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function seeWhy() {
    setHighlightExperience(true);
    goTo("#experience");
    window.setTimeout(() => setHighlightExperience(false), 1800);
  }

  function selectWorker(id: string) {
    // Always re-seed every control from that worker's CREW signals
    const nextSignals = seedSignals(id);
    setSelectedId(id);
    setSignals(nextSignals);
    setGraduation(null);
    setClarityJob(null);
    setRatingJob(null);
    setBookedJob(SEED_BOOKED);
    setWorkerTab("home");
    setWeekEarnings(0);
    setClaimToast(null);
    setEarnedCaps(WORKER_CAPABILITIES[id] ?? []);
    setVettingOpen(false);
    setFocusCapabilityId(null);
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
  const capWorker = useMemo(() => {
    const base = capabilityWorkerById(selectedId);
    return { ...base, capabilities: earnedCaps, signals };
  }, [selectedId, earnedCaps, signals]);
  const workerProfile = useMemo(
    () => buildWorkerProfile(capWorker, reviews, signals),
    [capWorker, reviews, signals],
  );
  const allProfiles = useMemo(() => {
    return capabilityWorkers().map((w) => {
      if (w.id === selectedId) {
        return buildWorkerProfile(
          { ...w, capabilities: earnedCaps, signals },
          reviews,
          signals,
        );
      }
      return buildWorkerProfile(w, reviews);
    });
  }, [selectedId, earnedCaps, signals, reviews]);
  const capabilityReliability = workerProfile.reliabilityBreakdown;
  const market = useMemo(
    () => evaluateMarketplace(incentiveUsd, { id: selectedId, signals }),
    [incentiveUsd, selectedId, signals],
  );
  const copilotRecs = useMemo(
    () => evaluateCopilot(market, allProfiles, CAPABILITY_JOBS),
    [market, allProfiles],
  );
  const next = nextTierName(result.tier);
  const training = signals.trainingBonus ?? 0;
  /** Available near you — explainable match from shared WorkerProfile. */
  const availableJobs = useMemo(() => {
    return [...CAPABILITY_JOBS]
      .filter((job) => job.id !== bookedJob?.id)
      .map((job) => ({ job, match: matchScore(workerProfile, job).score }))
      .sort((a, b) => {
        const ca = a.job.clarity || a.job.media ? 1 : 0;
        const cb = b.job.clarity || b.job.media ? 1 : 0;
        if (cb !== ca) return cb - ca;
        return b.match - a.match;
      })
      .slice(0, 3);
  }, [workerProfile, bookedJob?.id]);
  /** Luke: activation = first job completed (not onboarding). */
  const activated = signals.jobsCompleted >= 1;
  const weekGoal = 400 + TIER_ECONOMICS[result.tier].weeklyUsd;
  const displayWeekEarnings = activated
    ? weekEarnings + Math.round(120 + signals.jobsCompleted * 18)
    : weekEarnings;
  const member: CrewMember = CREW.find((c) => c.id === selectedId) ?? CREW[0];

  /** Plain-language Home nudge — skills → jobs → earnings. */
  const homeNudge =
    result.tier === "Certified"
      ? "Claim 1 more weekend job to reach Professional — unlocks priority matching, ≈ +$140/week."
      : result.tier === "Recruit"
        ? `Complete ${Math.max(0, 3 - signals.jobsCompleted)} more job${Math.max(0, 3 - signals.jobsCompleted) === 1 ? "" : "s"} to reach Certified — standard matching unlocks.`
        : result.tier === "Professional"
          ? "Keep your on-time streak to hold Professional priority matching."
          : "You're Elite — keep the streak to stay there.";

  function openJobDetail(
    job: CapabilityJob,
    mode: JobDetailMode,
    match = 0,
  ) {
    const full = resolveCatalogJob(job);
    setDetailMode(mode);
    setDetailMatch(match);
    setClarityJob(full);
  }

  function claimJob(job: CapabilityJob) {
    const full = resolveCatalogJob(job);
    const pay = jobPayTotal(full);
    setBookedJob(full);
    setClarityJob(null);
    setWeekEarnings((e) => e + pay);
    setWorkerTab("home");
    setClaimToast(`Move claimed · $${pay} — it's under Your next job`);
    window.setTimeout(() => setClaimToast(null), 3200);
  }

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

  // Auto-collapse simulator when Capability Engine enters view
  useEffect(() => {
    const target = document.querySelector("#capability-engine");
    if (!target) return;

    const mq = window.matchMedia("(min-width: 768px)");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSimOpen(false);
        }
      },
      {
        root: mq.matches ? mainRef.current : null,
        threshold: 0.2,
        rootMargin: "0px 0px -35% 0px",
      },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  const ptsLabel =
    result.tier === "Elite"
      ? "Elite"
      : result.tier === "Recruit"
        ? `${Math.max(0, 3 - signals.jobsCompleted)} job${3 - signals.jobsCompleted === 1 ? "" : "s"} to Certified`
        : `${result.pointsToNextTier} pt${result.pointsToNextTier === 1 ? "" : "s"} to ${next}`;

  const fade = reduce
    ? {}
    : {
        initial: { opacity: 0, y: 6 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.28, ease: "easeOut" as const },
      };

  return (
    <div className="flex min-h-dvh bg-background md:h-dvh md:overflow-hidden">
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

      <div className="flex min-w-0 flex-1 flex-col md:h-dvh md:min-h-0 md:overflow-hidden">
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

        {/* Collapsible control strip — collapsed by default for demo canvas */}
        <div
          id="simulator"
          className="z-40 shrink-0 border-b border-border bg-card px-4 py-2.5 md:px-6 lg:px-8"
        >
          <Card className="mx-auto max-w-[1280px] shadow-elevated">
            <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                <p className="text-sm font-semibold tracking-tight">
                  Simulator · {member.name}
                </p>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                  style={{ background: tierCss(result.tier) }}
                >
                  {result.tier}
                </span>
                <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold tabular text-foreground">
                  {result.score}
                </span>
                {!simOpen ? (
                  <>
                    <span className="hidden text-[11px] tabular text-muted-foreground sm:inline">
                      On-time {Math.round(signals.onTimeRate * 100)}%
                    </span>
                    <span className="hidden text-[11px] tabular text-muted-foreground md:inline">
                      Accept {Math.round(signals.acceptanceRate * 100)}%
                    </span>
                    <span className="hidden text-[11px] tabular text-muted-foreground lg:inline">
                      ★ {signals.avgRating.toFixed(2)}
                    </span>
                  </>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  className="h-8 max-w-[200px] rounded-lg border border-border bg-card px-2.5 text-xs shadow-card sm:max-w-none sm:text-sm"
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1"
                  aria-expanded={simOpen}
                  onClick={() => setSimOpen((o) => !o)}
                >
                  {simOpen ? "Hide signals" : "Edit signals"}
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 transition-transform",
                      simOpen && "rotate-180",
                    )}
                  />
                </Button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {simOpen ? (
                <motion.div
                  key="sim-controls"
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={reduce ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 border-t border-border px-4 pt-2">
                    <p className="text-[11px] text-muted-foreground">
                      Nudge signals — every surface recomputes from one engine
                    </p>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto px-0 text-xs"
                      onClick={resetSeed}
                    >
                      Reset to seed
                    </Button>
                  </div>
                  <CardContent
                    key={selectedId}
                    className="grid gap-4 pb-4 pt-3 sm:grid-cols-2 lg:grid-cols-3"
                  >
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
                        onChange={(e) =>
                          patch({ onTimeRate: Number(e.target.value) / 100 })
                        }
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
                        onChange={(e) =>
                          patch({ avgRating: Number(e.target.value) / 100 })
                        }
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
                      <Stepper
                        value={signals.noShows}
                        onChange={(n) => patch({ noShows: n })}
                      />
                    </div>
                  </CardContent>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </Card>
        </div>

        <main
          ref={mainRef}
          className="flex-1 p-4 md:min-h-0 md:overflow-y-auto md:overscroll-contain md:p-6 lg:p-8"
        >
          <div className="mx-auto flex max-w-[1280px] flex-col gap-5">
            <MarketplaceHero market={market} onSeeWhy={seeWhy} />

            {/* Three columns */}
            <div className="scroll-mt-4 grid gap-5 lg:grid-cols-3">
              {/* LEFT — Worker */}
              <motion.div
                id="experience"
                className={cn(
                  "scroll-mt-4 transition-shadow",
                  highlightExperience && "ring-2 ring-primary rounded-[48px]",
                )}
                {...fade}
              >
                <p className="mb-2 flex items-center gap-2 px-1 text-sm font-semibold tracking-tight">
                  Worker experience
                  <Badge variant="live">Engagement</Badge>
                </p>
                <PhoneFrame>
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
                        </motion.div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <AnimatePresence>
                    {clarityJob ? (
                      <motion.div
                        key={clarityJob.id}
                        initial={reduce ? false : { opacity: 0, x: 12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={reduce ? undefined : { opacity: 0, x: 8 }}
                        className="absolute inset-0 z-30 flex h-full min-h-0 flex-col overflow-hidden bg-[var(--canvas)]"
                      >
                        <JobDetailScreen
                          job={clarityJob}
                          mode={detailMode}
                          match={detailMatch}
                          onBack={() => setClarityJob(null)}
                          onClaim={() => claimJob(clarityJob)}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>

                  <div className="fx-head">
                    <div className="fx-av">{member.avatar}</div>
                    <div className="fx-who">
                      <div className="n">{member.name}</div>
                      <div className="l">{member.city}</div>
                    </div>
                    <div className="fx-badges">
                      <span className={cn("fx-pill", activated ? "active" : "inactive")}>
                        {activated ? "● Active" : "Not active"}
                      </span>
                      <span className={tierPillClass(result.tier)}>
                        {result.tier.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="fx-body relative">
                    {workerTab === "home" ? (
                      <WorkerHomeTab
                        profile={workerProfile}
                        activated={activated}
                        weekEarnings={displayWeekEarnings}
                        weekGoal={weekGoal}
                        bookedJob={bookedJob}
                        availableJobs={availableJobs}
                        nudge={homeNudge}
                        hideHeader
                        onOpenBooked={(job) => openJobDetail(job, "confirmed")}
                        onOpenAvailable={(job) => {
                          const m =
                            availableJobs.find((a) => a.job.id === job.id)?.match ??
                            matchScore(workerProfile, job).score;
                          openJobDetail(job, "claimable", m);
                        }}
                        onImproveCapability={(capId) => {
                          setFocusCapabilityId(capId);
                          setWorkerTab("progress");
                        }}
                      />
                    ) : (
                      <WorkerProgressTab
                        profile={workerProfile}
                        ptsLabel={ptsLabel}
                        jobs={CAPABILITY_JOBS}
                        focusCapabilityId={focusCapabilityId}
                        training={training}
                        onTakeCourse={takeCourse}
                        onAddCapability={() => setVettingOpen(true)}
                        onOpenCoaching={(moduleId) => {
                          const mod = COACHING_MODULES[moduleId];
                          if (mod) takeCourse();
                        }}
                      />
                    )}
                    <CapabilityVettingSheet
                      open={vettingOpen}
                      profile={workerProfile}
                      onClose={() => setVettingOpen(false)}
                      onEarn={(cap) => {
                        setEarnedCaps((prev) =>
                          prev.includes(cap) ? prev : [...prev, cap],
                        );
                      }}
                    />
                    <AnimatePresence>
                      {claimToast ? (
                        <motion.div
                          key="claim-toast"
                          initial={reduce ? false : { opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 4 }}
                          className="absolute inset-x-3 bottom-2 z-10 rounded-xl bg-[#111827] px-3 py-2.5 text-center text-[13px] font-semibold text-white"
                        >
                          {claimToast}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>

                  <nav className="fx-nav" aria-label="Worker tabs">
                    <button
                      type="button"
                      className={workerTab === "home" ? "on" : undefined}
                      onClick={() => setWorkerTab("home")}
                    >
                      <span className="text-lg" aria-hidden>
                        ⌂
                      </span>
                      <span className="nl">Home</span>
                    </button>
                    <button
                      type="button"
                      className={workerTab === "progress" ? "on" : undefined}
                      onClick={() => setWorkerTab("progress")}
                    >
                      <span className="text-lg" aria-hidden>
                        ◉
                      </span>
                      <span className="nl">Progress</span>
                    </button>
                  </nav>
                </PhoneFrame>
              </motion.div>

              {/* CENTER — Engine pipeline */}
              <motion.div id="engine" className="scroll-mt-4" {...fade}>
                <EnginePipeline
                  signals={signals}
                  result={result}
                  market={market}
                  capabilityReliability={capabilityReliability}
                  pulseKey={`${selectedId}-${signals.onTimeRate}-${signals.acceptanceRate}-${signals.avgRating}-${signals.jobsCompleted}-${signals.lateCancellations}-${signals.noShows}-${signals.trainingBonus ?? 0}-${incentiveUsd}-${capabilityReliability.overall}`}
                />
              </motion.div>

              {/* RIGHT — Marketplace Copilot (ops) */}
              <motion.div
                id="marketplace"
                className="scroll-mt-4"
                key={`mkt-${market.supplyHealth}-${market.fillLift}`}
                {...fade}
              >
                <MarketplaceCopilot
                  recommendations={copilotRecs}
                  onSeeWorker={(id) => {
                    selectWorker(id);
                    setWorkerTab("progress");
                    goTo("#experience");
                  }}
                />
                <div className="mt-3 rounded-xl border border-border bg-card p-3 shadow-card">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Incentive lever · feeds Copilot fill impact
                  </p>
                  <Slider
                    className="mt-2"
                    min={0}
                    max={30}
                    step={1}
                    value={[incentiveUsd]}
                    onValueChange={([v]) => setIncentiveUsd(v)}
                  />
                  <p className="mt-1 text-sm font-semibold tabular text-primary">
                    Slot bonus ${incentiveUsd} · expected fill +{market.fillLift}%
                  </p>
                </div>
              </motion.div>
            </div>

            <RatingModal
              open={ratingJob != null}
              job={ratingJob}
              workerId={selectedId}
              onClose={() => setRatingJob(null)}
              onSubmit={(review) => {
                setReviews((prev) => [...prev, review]);
                setRatingJob(null);
              }}
            />

            <CapabilityEngineSection
              profiles={allProfiles}
              jobs={CAPABILITY_JOBS}
              focusWorkerId={selectedId}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckSquare,
  MapPin,
  MessageSquare,
  Navigation,
  Play,
  RefreshCw,
  Weight,
  Wrench,
} from "lucide-react";
import type { CapabilityJob, JobClarity } from "@/lib/capabilities";
import { CAPABILITY_LABEL, riskLabel, taskLabel } from "@/lib/capabilities";
import {
  isJobBrief,
  type JobBrief,
  type JobBriefSource,
} from "@/lib/jobBrief";
import { FactRow, FactSectionHeader } from "@/components/worker/fact-row";
import {
  WalkthroughMedia,
  type LightboxItem,
} from "@/components/worker/media-lightbox";
import { cn } from "@/lib/utils";

export type JobDetailMode = "claimable" | "confirmed";

type ResolvedClarity = JobClarity & {
  keyFacts: string[];
  access: string[];
  risks: Array<string | { label: string; sourceTimestamp?: number; sourcePhotoId?: string }>;
};

type SectionKey = "tasks" | "equipment" | "heavy" | "risks" | "access";

function resolveClarity(
  job: CapabilityJob,
  persistedBrief: JobBrief | undefined,
): ResolvedClarity {
  const fallback: JobClarity = job.clarity ?? {
    overview: [`${job.title}`, `${job.city} · ${job.slot}`, "Standard access"],
    tasks: ["Protect floors", "Load truck", "Secure cargo", "Unload at destination"],
    equipment: ["Dolly", "Pads", "Straps"],
    heavyItems: ["Listed at claim"],
    riskFlags: ["Confirm access on arrival"],
    estimatedHours: 2.5,
    crewRequired: 2,
    confidencePct: 78,
    pay: {
      base: Math.round(job.payUsd * 0.78),
      mileage: Math.round(job.payUsd * 0.1),
      premium: Math.round(job.payUsd * 0.12),
    },
  };
  const base: JobClarity = persistedBrief
    ? {
        ...fallback,
        overview: [persistedBrief.executiveSummary],
        tasks: persistedBrief.tasks,
        equipment: persistedBrief.equipment,
        heavyItems: persistedBrief.heavyItems,
        access: persistedBrief.accessNotes,
        riskFlags: persistedBrief.riskFlags,
        estimatedHours: persistedBrief.estDurationHours,
        crewRequired: persistedBrief.crewSize,
      }
    : fallback;

  const durationRe = /\b(\d+(\.\d+)?)\s*-?\s*hour|\b~\d|\bhrs?\b/i;
  const overviewNoDuration = base.overview.filter((line) => !durationRe.test(line));
  const parking = base.riskFlags.filter((r) => /parking/i.test(riskLabel(r)));
  const risks = base.riskFlags.filter((r) => !/parking/i.test(riskLabel(r)));
  const access =
    base.access ??
    [
      ...overviewNoDuration.filter((line) =>
        /floor|elevator|garage|unload|pickup|access|staging/i.test(line),
      ),
      ...parking.map(riskLabel),
    ].filter((v, i, arr) => arr.indexOf(v) === i);
  const keyFacts =
    base.keyFacts ??
    overviewNoDuration.map((line) =>
      line.replace(/\s+apartment$/i, "").replace(/\s+available$/i, "").trim(),
    );

  return {
    ...base,
    overview: overviewNoDuration,
    keyFacts: keyFacts.length ? keyFacts : overviewNoDuration,
    access: access.length ? access : ["Confirm access on arrival"],
    risks: risks.length ? risks : base.riskFlags,
  };
}

export function JobDetailScreen({
  job,
  mode,
  onBack,
  onClaim,
  onBriefPersist,
}: {
  job: CapabilityJob;
  mode: JobDetailMode;
  onBack: () => void;
  onClaim: () => void;
  onBriefPersist?: (
    brief: JobBrief,
    metadata: { source: JobBriefSource; generatedAt: string },
  ) => void;
}) {
  const reduce = useReducedMotion();
  const [brief, setBrief] = useState<JobBrief | undefined>(job.jobBrief);
  const [briefSource, setBriefSource] = useState<JobBriefSource>(
    job.jobBriefSource ?? "seed",
  );
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const c = resolveClarity(job, brief);
  const total = c.pay.base + c.pay.mileage + c.pay.premium;
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);
  const [claimedFlash, setClaimedFlash] = useState(false);
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    tasks: true,
    equipment: true,
    heavy: false,
    risks: false,
    access: true,
  });

  useEffect(() => {
    setBrief(job.jobBrief);
    setBriefSource(job.jobBriefSource ?? "seed");
    setRegenerateError(null);
  }, [job.id, job.jobBrief, job.jobBriefSource]);

  function toggle(key: SectionKey) {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function openPhotoById(id?: string) {
    if (!job.media || !id) return;
    const photo = job.media.photos.find((p) => p.id === id);
    if (photo) setLightbox({ kind: "photo", photo });
    else if (job.media.video) setLightbox({ kind: "video", video: job.media.video });
  }

  function handleClaim() {
    setClaimedFlash(true);
    window.setTimeout(() => onClaim(), 1400);
  }

  async function regenerateBrief() {
    if (!job.bookingInputs || regenerating) return;

    setRegenerating(true);
    setRegenerateError(null);

    try {
      const response = await fetch("/api/job-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId: job.id, inputs: job.bookingInputs }),
      });

      if (!response.ok) {
        throw new Error(`Job Brief request failed (${response.status})`);
      }

      const nextBrief: unknown = await response.json();
      if (!isJobBrief(nextBrief)) {
        throw new Error("Job Brief response did not match the schema");
      }

      const source =
        response.headers.get("X-Job-Brief-Source") === "ai" ? "ai" : "seed";
      const generatedAt =
        response.headers.get("X-Job-Brief-Generated-At") ??
        new Date().toISOString();

      setBrief(nextBrief);
      setBriefSource(source);
      onBriefPersist?.(nextBrief, { source, generatedAt });
    } catch {
      // Keep the persisted brief visible; the demo never falls into a blank state.
      setRegenerateError("Couldn’t refresh right now. Showing the saved brief.");
    } finally {
      setRegenerating(false);
    }
  }

  if (claimedFlash) {
    return (
      <motion.div
        className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-white"
        style={{
          background: "linear-gradient(160deg, var(--flex) 0%, var(--flex-d) 100%)",
        }}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white text-[var(--flex)]">
          <Check className="h-7 w-7" />
        </span>
        <p className="text-2xl font-semibold tracking-tight">Move claimed!</p>
        <p className="text-sm text-white/85">It&apos;s on your Home as Your next job.</p>
      </motion.div>
    );
  }

  return (
    <div className="fx-detail">
      <div className="fx-dhead">
        <button type="button" className="fx-dback" onClick={onBack} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="fx-dttl">Move Summary</div>
          <div className="fx-daitag">
            <span className="sp">✦</span>
            AI Job Brief from the customer&apos;s booking
          </div>
        </div>
        {job.bookingInputs ? (
          <button
            type="button"
            onClick={regenerateBrief}
            disabled={regenerating}
            className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-semibold text-[var(--flex)] transition-colors hover:bg-[var(--flex-tint)] disabled:opacity-60"
          >
            <RefreshCw
              className={cn("h-3 w-3", regenerating && "animate-spin")}
            />
            {regenerating ? "Generating…" : "Regenerate with AI"}
          </button>
        ) : null}
      </div>

      <div className="fx-dbody">
        {regenerating ? (
          <div
            className="fx-sec animate-pulse"
            aria-live="polite"
            aria-label="Generating a fresh AI Job Brief"
          >
            <div className="h-2.5 w-36 rounded bg-muted" />
            <div className="mt-2 h-2 w-full rounded bg-muted" />
            <div className="mt-1.5 h-2 w-4/5 rounded bg-muted" />
          </div>
        ) : null}
        {regenerateError ? (
          <p
            className="mb-3 rounded-lg bg-warn-tint px-3 py-2 text-[11px] text-warn"
            role="status"
          >
            {regenerateError}
          </p>
        ) : null}
        <div className="fx-dhero">
          <div className="name">{job.title}</div>
          <div className="sub">
            {job.city} · {job.slot}
          </div>
          {mode === "confirmed" ? (
            <span className="stat">✓ Confirmed</span>
          ) : (
            <span className="stat match-ok">✓ Claimable</span>
          )}
          <div className="row2">
            <div className="aigen">
              ✦{" "}
              {briefSource === "ai"
                ? "AI-generated from the customer’s structured inputs"
                : "Saved brief from the customer’s structured inputs"}
              <div style={{ marginTop: 6 }} className="fx-tabular">
                {c.estimatedHours} hrs est. · Crew of {c.crewRequired}
              </div>
            </div>
            <div className="earnb">
              <div className="l">You earn</div>
              <div className="n">${total}</div>
            </div>
          </div>
          {brief?.executiveSummary ? (
            <p className="mt-3 text-[12px] leading-snug text-[var(--muted)]">
              {brief.executiveSummary}
            </p>
          ) : null}
          {job.requires.length > 0 ? (
            <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
              {job.requires.map((req) => (
                <span key={req} className="fx-tag ai">
                  {CAPABILITY_LABEL[req]}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {job.media &&
        (job.media.video || job.media.photos.length > 0) ? (
          <div className="fx-sec">
            <div className="fx-sec-h" style={{ cursor: "default" }}>
              <Play className="h-3.5 w-3.5 text-[var(--flex)]" />
              From the customer&apos;s walkthrough
              <span className="count">
                {job.media.photos.length + (job.media.video ? 1 : 0)}
              </span>
            </div>
            <WalkthroughMedia
              media={job.media}
              openItem={lightbox}
              onOpen={setLightbox}
              onClose={() => setLightbox(null)}
            />
            <p
              style={{
                fontSize: 11.5,
                color: "var(--muted)",
                marginTop: 10,
                display: "flex",
                gap: 6,
              }}
            >
              <span style={{ color: "var(--flex)" }}>✦</span>
              Walkthrough attached for reference. Video and photos are
              display-only today.
            </p>
          </div>
        ) : (
          <div className="fx-sec" style={{ fontSize: 12, color: "var(--muted)" }}>
            Brief generated from structured customer inputs (no walkthrough video
            attached).
          </div>
        )}

        <div className="fx-sec">
          <div className="fx-sec-h" style={{ cursor: "default" }}>
            At a glance
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {c.keyFacts.map((fact) => (
              <span key={fact} className="fx-chip">
                {fact}
              </span>
            ))}
          </div>
        </div>

        <div className="fx-sec">
          <FactSectionHeader
            icon={CheckSquare}
            title="Tasks"
            count={c.tasks.length}
            expanded={open.tasks}
            onToggle={() => toggle("tasks")}
          />
          {open.tasks
            ? c.tasks.map((t) => {
                const label = taskLabel(t);
                const meta = typeof t === "string" ? null : t;
                return (
                  <FactRow
                    key={label}
                    icon={CheckSquare}
                    label={label}
                    onClick={
                      meta?.sourcePhotoId
                        ? () => openPhotoById(meta.sourcePhotoId)
                        : undefined
                    }
                  />
                );
              })
            : null}
        </div>

        <div className="fx-sec">
          <FactSectionHeader
            icon={Wrench}
            title="Equipment"
            count={c.equipment.length}
            expanded={open.equipment}
            onToggle={() => toggle("equipment")}
          />
          {open.equipment
            ? c.equipment.map((e) => (
                <FactRow key={e} icon={Wrench} label={e} />
              ))
            : null}
        </div>

        <div className="fx-sec">
          <FactSectionHeader
            icon={Weight}
            title="Heavy items"
            count={c.heavyItems.length}
            tone="amber"
            expanded={open.heavy}
            onToggle={() => toggle("heavy")}
          />
          {open.heavy
            ? c.heavyItems.map((h) => (
                <FactRow key={h} icon={Weight} label={h} tone="amber" />
              ))
            : null}
        </div>

        <div className="fx-sec">
          <FactSectionHeader
            icon={AlertTriangle}
            title="Risk flags"
            count={c.risks.length}
            tone="risk"
            expanded={open.risks}
            onToggle={() => toggle("risks")}
          />
          {open.risks
            ? c.risks.map((r) => {
                const label = riskLabel(r);
                const meta = typeof r === "string" ? null : r;
                return (
                  <FactRow
                    key={label}
                    icon={AlertTriangle}
                    label={label}
                    tone="risk"
                    onClick={
                      meta?.sourcePhotoId
                        ? () => openPhotoById(meta.sourcePhotoId)
                        : undefined
                    }
                  />
                );
              })
            : null}
        </div>

        {c.access.length ? (
          <div className="fx-sec">
            <FactSectionHeader
              icon={MapPin}
              title="Access"
              count={c.access.length}
              expanded={open.access}
              onToggle={() => toggle("access")}
            />
            {open.access
              ? c.access.map((a) => (
                  <FactRow key={a} icon={MapPin} label={a} />
                ))
              : null}
          </div>
        ) : null}
      </div>

      <div className="fx-dbar">
        {mode === "claimable" ? (
          <button type="button" className="fx-primary" onClick={handleClaim}>
            Claim this move <span className="amt">· ${total}</span>
          </button>
        ) : (
          <>
            <p className="fx-dnote">Starts in 2 days · confirmed on your calendar</p>
            <div className="fx-actrow">
              <button type="button" className="fx-sbtn">
                <MessageSquare className="h-4 w-4" /> Message
              </button>
              <button type="button" className="fx-sbtn">
                <Navigation className="h-4 w-4" /> Directions
              </button>
              <button
                type="button"
                className="fx-sbtn"
                onClick={() =>
                  job.media?.video &&
                  setLightbox({ kind: "video", video: job.media.video })
                }
              >
                <Play className="h-4 w-4" /> Walkthrough
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** @deprecated use JobDetailScreen */
export const JobClarityScreen = JobDetailScreen;

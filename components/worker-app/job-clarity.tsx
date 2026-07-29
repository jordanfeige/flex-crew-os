"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckSquare,
  Clock,
  MapPin,
  MessageSquare,
  Navigation,
  Play,
  Sparkles,
  Weight,
  Wrench,
} from "lucide-react";
import type { CapabilityJob, JobClarity } from "@/lib/capabilities";
import { CAPABILITY_LABEL, riskLabel, taskLabel } from "@/lib/capabilities";
import { FactRow, FactSectionHeader } from "@/components/worker/fact-row";
import {
  WalkthroughMedia,
  type LightboxItem,
} from "@/components/worker/media-lightbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type JobDetailMode = "claimable" | "confirmed";

type ResolvedClarity = JobClarity & {
  keyFacts: string[];
  access: string[];
  risks: Array<string | { label: string; sourceTimestamp?: number; sourcePhotoId?: string }>;
};

function resolveClarity(job: CapabilityJob): ResolvedClarity {
  const base: JobClarity = job.clarity ?? {
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
  match,
  onBack,
  onClaim,
}: {
  job: CapabilityJob;
  mode: JobDetailMode;
  match?: number;
  onBack: () => void;
  onClaim: () => void;
}) {
  const reduce = useReducedMotion();
  const c = resolveClarity(job);
  const total = c.pay.base + c.pay.mileage + c.pay.premium;
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);
  const [claimedFlash, setClaimedFlash] = useState(false);

  function openPhotoById(id?: string) {
    if (!job.media || !id) return;
    const photo = job.media.photos.find((p) => p.id === id);
    if (photo) setLightbox({ kind: "photo", photo });
    else if (job.media.video) setLightbox({ kind: "video", video: job.media.video });
  }

  function handleClaim() {
    setClaimedFlash(true);
    window.setTimeout(() => {
      onClaim();
    }, 1400);
  }

  if (claimedFlash) {
    return (
      <motion.div
        className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center text-white"
        style={{
          background: "linear-gradient(160deg, var(--flex) 0%, var(--flex-dark) 100%)",
        }}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white/20">
          <Check className="h-7 w-7" />
        </span>
        <p className="text-2xl font-semibold tracking-tight">Move claimed!</p>
        <p className="text-sm text-white/85">
          It&apos;s on your Home as Your next job.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"
          aria-label="Back"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight">AI Job Brief</p>
          <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
            From structured inputs
            {job.media ? " + optional video" : ""} · {c.confidencePct}% confidence
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3 pb-28">
        {/* Hero */}
        <div>
          <div className="flex flex-wrap items-center gap-1.5">
            {mode === "confirmed" ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-good-tint px-2 py-0.5 text-[10px] font-semibold text-good">
                <Check className="h-2.5 w-2.5" /> Confirmed
              </span>
            ) : (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  (match ?? 0) >= 100
                    ? "bg-good-tint text-good"
                    : "bg-warn-tint text-warn",
                )}
              >
                Match {match ?? 0}%
              </span>
            )}
          </div>
          <h2 className="mt-1.5 text-lg font-semibold tracking-tight">{job.title}</h2>
          <p className="text-xs text-muted-foreground">
            {job.city} · {job.slot}
          </p>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                You earn
              </p>
              <p className="text-[2rem] font-semibold leading-none tabular tracking-tight text-[var(--flex)]">
                ${total}
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                Confidence
              </p>
              <p className="text-lg font-semibold tabular text-muted-foreground">
                {c.confidencePct}%
              </p>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {c.estimatedHours} hrs est.
            </span>
            <span>Crew of {c.crewRequired}</span>
          </div>
          {job.requires.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {job.requires.map((req) => (
                <span
                  key={req}
                  className="rounded-md bg-[var(--flex-tint)] px-1.5 py-0.5 text-[10px] font-semibold text-[var(--flex)]"
                >
                  {CAPABILITY_LABEL[req]}
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {/* Source media — structured inputs + optional walkthrough */}
        {job.media ? (
          <section className="space-y-2">
            <FactSectionHeader
              icon={Play}
              title="Source media"
              count={job.media.photos.length + (job.media.video ? 1 : 0)}
            />
            <p className="text-[11px] leading-snug text-muted-foreground">
              Built from the customer&apos;s structured inputs and optional video —
              tap any clip or photo to verify.
            </p>
            <WalkthroughMedia
              media={job.media}
              openItem={lightbox}
              onOpen={setLightbox}
              onClose={() => setLightbox(null)}
            />
          </section>
        ) : (
          <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
            Brief generated from structured customer inputs (no walkthrough video
            attached).
          </p>
        )}

        {/* At a glance */}
        <section>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Executive summary
          </p>
          <div className="flex flex-wrap gap-1.5">
            {c.keyFacts.map((fact) => (
              <span
                key={fact}
                className="rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] font-medium"
              >
                {fact}
              </span>
            ))}
          </div>
        </section>

        <section>
          <FactSectionHeader icon={CheckSquare} title="Tasks" count={c.tasks.length} />
          {c.tasks.map((t) => {
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
          })}
        </section>

        <section>
          <FactSectionHeader icon={Wrench} title="Equipment checklist" count={c.equipment.length} />
          {c.equipment.map((e) => (
            <FactRow key={e} icon={Wrench} label={e} />
          ))}
        </section>

        <section>
          <FactSectionHeader
            icon={Weight}
            title="Heavy items"
            count={c.heavyItems.length}
            tone="amber"
          />
          {c.heavyItems.map((h) => (
            <FactRow key={h} icon={Weight} label={h} tone="amber" />
          ))}
        </section>

        <section>
          <FactSectionHeader
            icon={AlertTriangle}
            title="Risk flags"
            count={c.risks.length}
            tone="risk"
          />
          {c.risks.map((r) => {
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
          })}
        </section>

        {c.access.length ? (
          <section>
            <FactSectionHeader
              icon={MapPin}
              title="Access · stairs / elevator / parking"
              count={c.access.length}
            />
            {c.access.map((a) => (
              <FactRow key={a} icon={MapPin} label={a} />
            ))}
          </section>
        ) : null}
      </div>

      {/* Action bar by mode */}
      <div className="absolute inset-x-0 bottom-0 border-t border-border bg-card/95 p-3 backdrop-blur">
        {mode === "claimable" ? (
          <Button
            type="button"
            className="h-11 w-full text-sm font-semibold"
            onClick={handleClaim}
          >
            Claim this move · ${total}
          </Button>
        ) : (
          <div className="space-y-2">
            <p className="text-center text-[11px] text-muted-foreground">
              Starts in 2 days · confirmed on your calendar
            </p>
            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" className="h-9 gap-1 text-xs">
                <MessageSquare className="h-3.5 w-3.5" /> Message
              </Button>
              <Button type="button" variant="outline" className="h-9 gap-1 text-xs">
                <Navigation className="h-3.5 w-3.5" /> Directions
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-9 gap-1 text-xs"
                onClick={() =>
                  job.media?.video &&
                  setLightbox({ kind: "video", video: job.media.video })
                }
              >
                <Play className="h-3.5 w-3.5" /> Walkthrough
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** @deprecated use JobDetailScreen */
export const JobClarityScreen = JobDetailScreen;

"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckSquare,
  ChevronDown,
  Clock,
  MapPin,
  Sparkles,
  Users,
  Weight,
  Wrench,
} from "lucide-react";
import type { CapabilityJob, JobClarity } from "@/lib/capabilities";
import { riskLabel, taskLabel } from "@/lib/capabilities";
import { FactRow, FactSectionHeader } from "@/components/worker/fact-row";
import {
  WalkthroughMedia,
  type LightboxItem,
} from "@/components/worker/media-lightbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ResolvedClarity = JobClarity & {
  keyFacts: string[];
  access: string[];
  risks: Array<string | { label: string; sourceTimestamp?: number; sourcePhotoId?: string }>;
};

function resolveClarity(job: CapabilityJob): ResolvedClarity {
  const base: JobClarity = job.clarity ?? {
    overview: [
      `${job.title}`,
      `${job.city} · ${job.slot}`,
      "Standard access",
      "Crew staging at curb",
    ],
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

export function JobClarityScreen({
  job,
  onBack,
  onClaim,
}: {
  job: CapabilityJob;
  onBack: () => void;
  onClaim: () => void;
}) {
  const reduce = useReducedMotion();
  const c = resolveClarity(job);
  const total = c.pay.base + c.pay.mileage + c.pay.premium;
  const [payOpen, setPayOpen] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

  function openPhotoById(id?: string) {
    if (!job.media || !id) return;
    const photo = job.media.photos.find((p) => p.id === id);
    if (photo) setLightbox({ kind: "photo", photo });
    else if (job.media.video) setLightbox({ kind: "video", video: job.media.video });
  }

  function openTimestamp(ts?: number) {
    if (job.media?.video) {
      setLightbox({ kind: "video", video: job.media.video });
      void ts; // hook for seek-to-timestamp when a real player is wired
    }
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
          <p className="truncate text-sm font-semibold tracking-tight">Move Summary</p>
          <p className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Sparkles className="h-3 w-3 shrink-0" aria-hidden />
            <span>AI summary</span>
            <span aria-hidden>·</span>
            <span className="tabular">{c.confidencePct}% confidence</span>
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3 pb-28">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{job.title}</h2>
          <p className="text-xs text-muted-foreground">
            {job.city} · {job.slot}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-3.5 shadow-card">
          <button
            type="button"
            onClick={() => setPayOpen((o) => !o)}
            aria-expanded={payOpen}
            className="flex w-full items-start justify-between gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                You earn
              </p>
              <p className="mt-0.5 text-[2rem] font-semibold leading-none tabular tracking-tight text-good">
                ${total}
              </p>
            </div>
            <ChevronDown
              className={cn(
                "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                payOpen && "rotate-180",
              )}
              aria-hidden
            />
          </button>

          <AnimatePresence initial={false}>
            {payOpen ? (
              <motion.div
                initial={reduce ? false : { height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={reduce ? undefined : { height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
                  <PayLine label="Base" value={c.pay.base} />
                  <PayLine label="Mileage" value={c.pay.mileage} />
                  <PayLine label="Premium" value={c.pay.premium} />
                  <div className="flex justify-between pt-1 font-semibold">
                    <span>Total</span>
                    <span className="tabular text-good">${total}</span>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-2.5 py-2">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <span className="text-xs font-semibold tabular">{c.estimatedHours} hrs</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-2.5 py-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              <span className="text-xs font-semibold tabular">{c.crewRequired} crew</span>
            </div>
          </div>
        </div>

        {/* Overview — source media first */}
        <section className="space-y-3">
          <FactSectionHeader icon={Sparkles} title="Overview" count={c.keyFacts.length} />
          {job.media ? (
            <WalkthroughMedia
              media={job.media}
              openItem={lightbox}
              onOpen={setLightbox}
              onClose={() => setLightbox(null)}
            />
          ) : null}
          <div className="flex flex-wrap gap-1.5">
            {c.keyFacts.map((fact) => (
              <span
                key={fact}
                className="rounded-md border border-border bg-muted/50 px-2 py-1 text-[11px] font-medium text-foreground"
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
                  meta?.sourcePhotoId || meta?.sourceTimestamp != null
                    ? () => {
                        if (meta.sourcePhotoId) openPhotoById(meta.sourcePhotoId);
                        else openTimestamp(meta.sourceTimestamp);
                      }
                    : undefined
                }
              />
            );
          })}
        </section>

        <section>
          <FactSectionHeader icon={Wrench} title="Equipment" count={c.equipment.length} />
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
          <FactSectionHeader icon={MapPin} title="Access" count={c.access.length} />
          {c.access.map((a) => (
            <FactRow key={a} icon={MapPin} label={a} />
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
                    : meta?.sourceTimestamp != null
                      ? () => openTimestamp(meta.sourceTimestamp)
                      : undefined
                }
              />
            );
          })}
        </section>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-border bg-card/95 p-3 backdrop-blur">
        <Button type="button" className="h-11 w-full text-sm font-semibold" onClick={onClaim}>
          Claim this move · ${total}
        </Button>
      </div>
    </div>
  );
}

function PayLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <span>{label}</span>
      <span className="tabular text-foreground">${value}</span>
    </div>
  );
}

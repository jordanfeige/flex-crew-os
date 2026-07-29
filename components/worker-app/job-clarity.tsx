"use client";

import { useState } from "react";
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
import { cn } from "@/lib/utils";

export type JobDetailMode = "claimable" | "confirmed";

type ResolvedClarity = JobClarity & {
  keyFacts: string[];
  access: string[];
  risks: Array<string | { label: string; sourceTimestamp?: number; sourcePhotoId?: string }>;
};

type SectionKey = "tasks" | "equipment" | "heavy" | "risks" | "access";

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
  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    tasks: true,
    equipment: true,
    heavy: false,
    risks: false,
    access: true,
  });

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

  const matchStrong = (match ?? 0) >= 90;

  return (
    <div className="fx-detail">
      <div className="fx-dhead">
        <button type="button" className="fx-dback" onClick={onBack} aria-label="Back">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <div className="fx-dttl">Move Summary</div>
          <div className="fx-daitag">
            <span className="sp">✦</span>
            AI-generated from the customer&apos;s inputs.
          </div>
        </div>
      </div>

      <div className="fx-dbody">
        <div className="fx-dhero">
          {mode === "confirmed" ? (
            <span className="stat">✓ Confirmed</span>
          ) : (
            <span
              className={cn(
                "stat",
                matchStrong ? "match-ok" : "match-partial",
              )}
            >
              Match {match ?? 0}%
            </span>
          )}
          <div className="name" style={{ marginTop: 8 }}>
            {job.title}
          </div>
          <div className="sub">
            {job.city} · {job.slot}
          </div>
          <div className="row2">
            <div
              style={{
                fontSize: 12,
                color: "var(--muted)",
                display: "flex",
                flexDirection: "column",
                gap: 4,
                justifyContent: "flex-end",
              }}
            >
              <span className="fx-tabular">{c.estimatedHours} hrs est.</span>
              <span className="fx-tabular">Crew of {c.crewRequired}</span>
            </div>
            <div className="earnb">
              <div className="l">You earn</div>
              <div className="n">${total}</div>
            </div>
          </div>
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
              Source media
              <span className="count">
                {job.media.photos.length + (job.media.video ? 1 : 0)}
              </span>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--muted)", marginBottom: 10 }}>
              Built from the customer&apos;s structured inputs and optional video —
              tap any clip or photo to verify.
            </p>
            <WalkthroughMedia
              media={job.media}
              openItem={lightbox}
              onOpen={setLightbox}
              onClose={() => setLightbox(null)}
            />
          </div>
        ) : (
          <div className="fx-sec" style={{ fontSize: 12, color: "var(--muted)" }}>
            Brief generated from structured customer inputs (no walkthrough video
            attached).
          </div>
        )}

        <div className="fx-sec">
          <div className="fx-sec-h" style={{ cursor: "default" }}>
            Executive summary
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
            Claim this move <span style={{ opacity: 0.85 }}>· ${total}</span>
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

"use client";

import type { ComponentType, ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Package,
  Shield,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react";
import type { CapabilityJob } from "@/lib/capabilities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-primary" />
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
      </div>
      {children}
    </section>
  );
}

/** Default clarity when a job seed has no full payload (still showpiece-shaped). */
function clarityFor(job: CapabilityJob) {
  if (job.clarity) return job.clarity;
  return {
    overview: [
      `${job.title}`,
      `${job.city} · ${job.slot}`,
      "Standard access",
      "Crew staging at curb",
    ],
    tasks: ["Protect floors", "Load truck", "Secure cargo", "Unload at destination"],
    equipment: ["Dolly", "Pads", "Straps"],
    heavyItems: ["Listed at claim"],
    riskFlags: ["Confirm parking on arrival"],
    estimatedHours: 2.5,
    crewRequired: 2,
    confidencePct: 78,
    pay: {
      base: Math.round(job.payUsd * 0.78),
      mileage: Math.round(job.payUsd * 0.1),
      premium: Math.round(job.payUsd * 0.12),
    },
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
  const c = clarityFor(job);
  const total = c.pay.base + c.pay.mileage + c.pay.premium;

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
          <p className="truncate text-sm font-semibold">Move Summary</p>
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Sparkles className="h-3 w-3 text-primary" />
            AI generated from customer walkthrough
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 pb-28">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{job.title}</h2>
          <p className="text-xs text-muted-foreground">
            {job.city} · {job.slot}
          </p>
        </div>

        {/* Confidence meter */}
        <div className="rounded-2xl border border-border bg-gradient-to-br from-accent/80 to-card p-3.5 shadow-card">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Confidence
            </p>
            <p className="text-lg font-semibold tabular text-primary">{c.confidencePct}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${c.confidencePct}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 rounded-lg bg-card/80 px-2 py-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="tabular">{c.estimatedHours} hrs</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-card/80 px-2 py-1.5">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="tabular">{c.crewRequired} workers</span>
            </div>
          </div>
        </div>

        <Section icon={Package} title="Overview">
          <ul className="space-y-1">
            {c.overview.map((line) => (
              <li key={line} className="text-sm leading-snug">
                {line}
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Wrench} title="Tasks">
          <ul className="space-y-1.5">
            {c.tasks.map((t) => (
              <li
                key={t}
                className="flex items-start gap-2 text-sm leading-snug before:mt-2 before:h-1 before:w-1 before:shrink-0 before:rounded-full before:bg-primary before:content-['']"
              >
                {t}
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Wrench} title="Equipment needed">
          <div className="flex flex-wrap gap-1.5">
            {c.equipment.map((e) => (
              <span
                key={e}
                className="rounded-md border border-border bg-muted/50 px-2 py-1 text-xs font-medium"
              >
                {e}
              </span>
            ))}
          </div>
        </Section>

        <Section icon={Shield} title="Heavy items">
          <div className="flex flex-wrap gap-1.5">
            {c.heavyItems.map((h) => (
              <span
                key={h}
                className="rounded-md bg-warn-tint px-2 py-1 text-xs font-semibold text-warn"
              >
                {h}
              </span>
            ))}
          </div>
        </Section>

        <Section icon={AlertTriangle} title="Risk flags">
          <ul className="space-y-1">
            {c.riskFlags.map((r) => (
              <li key={r} className="text-sm text-critical">
                {r}
              </li>
            ))}
          </ul>
        </Section>

        <Section icon={Package} title="Pay breakdown">
          <div className="rounded-xl border border-border bg-card p-3 text-sm shadow-card">
            <Row label="Base" value={c.pay.base} />
            <Row label="Mileage" value={c.pay.mileage} />
            <Row label="Premium" value={c.pay.premium} />
            <div className="mt-2 flex justify-between border-t border-border pt-2 font-semibold">
              <span>Total</span>
              <span className="tabular text-good">${total}</span>
            </div>
          </div>
        </Section>
      </div>

      <div className="absolute inset-x-0 bottom-0 border-t border-border bg-card/95 p-3 backdrop-blur">
        <Button type="button" className="h-11 w-full text-sm font-semibold" onClick={onClaim}>
          Claim · ${total}
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className={cn("flex justify-between py-0.5 text-muted-foreground")}>
      <span>{label}</span>
      <span className="tabular text-foreground">${value}</span>
    </div>
  );
}

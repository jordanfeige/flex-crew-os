"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  CAPABILITY_LABEL,
  SERVICE_LABEL,
  SERVICES,
  jobsForService,
  matchScore,
  type Capability,
  type CapabilityJob,
  type CapabilityWorker,
  type Service,
} from "@/lib/capabilities";
import type { CapabilityReliabilityBreakdown } from "@/lib/reviews";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function MatchBadge({ pct }: { pct: number }) {
  const tone =
    pct >= 90 ? "text-good" : pct >= 70 ? "text-primary" : "text-warn";
  return (
    <span className={cn("text-sm font-semibold tabular", tone)}>
      Match {pct}%
    </span>
  );
}

export function CapabilityEngineSection({
  worker,
  jobs,
  reliability,
}: {
  worker: CapabilityWorker;
  jobs: CapabilityJob[];
  reliability: CapabilityReliabilityBreakdown;
}) {
  const reduce = useReducedMotion();
  const [service, setService] = useState<Service>("moving");

  const feed = useMemo(
    () => jobsForService(service, jobs).slice(0, 3),
    [service, jobs],
  );

  const matchingCaps = useMemo(() => {
    const required = new Set(feed.flatMap((j) => j.requires));
    return worker.capabilities.filter((c) => required.has(c));
  }, [feed, worker.capabilities]);

  return (
    <Card id="capability-engine" className="scroll-mt-4 shadow-elevated">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Capability Engine</CardTitle>
          <Badge variant="engine">Configuration</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Same worker, same capabilities — service is configuration. Matching is set
          overlap with the Experience column.
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Service"
        >
          {SERVICES.map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={service === s}
              onClick={() => setService(s)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                service === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {SERVICE_LABEL[s]}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={service}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            <div className="rounded-xl border border-border bg-muted/30 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {worker.name.split(" ")[0]} · matching capabilities for{" "}
                {SERVICE_LABEL[service]}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {matchingCaps.length > 0 ? (
                  matchingCaps.map((c) => (
                    <span
                      key={c}
                      className="rounded-md bg-good-tint px-2 py-1 text-[11px] font-medium text-good"
                    >
                      {CAPABILITY_LABEL[c]}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-warn">
                    No overlapping capabilities — low match expected
                  </span>
                )}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                {SERVICE_LABEL[service]} reliability{" "}
                <span className="font-semibold tabular text-foreground">
                  {reliability.byService[service]}
                </span>
                <span className="text-muted-foreground">
                  {" "}
                  · Overall {reliability.overall}
                </span>
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {feed.map((job) => (
                <JobMatchCard key={job.id} job={job} worker={worker} />
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function JobMatchCard({
  job,
  worker,
}: {
  job: CapabilityJob;
  worker: CapabilityWorker;
}) {
  const pct = matchScore(worker, job);
  const have = new Set(worker.capabilities);
  return (
    <div className="rounded-xl border border-border bg-card p-3.5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold tracking-tight">{job.title}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {job.city} · {job.slot} · ${job.payUsd}
          </p>
        </div>
        <MatchBadge pct={pct} />
      </div>
      <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        Requires
      </p>
      <ul className="mt-1 space-y-1">
        {job.requires.map((c: Capability) => (
          <li
            key={c}
            className={cn(
              "flex items-center gap-1.5 text-xs",
              have.has(c) ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "inline-block h-1.5 w-1.5 rounded-full",
                have.has(c) ? "bg-good" : "bg-border",
              )}
              aria-hidden
            />
            {CAPABILITY_LABEL[c]}
            {!have.has(c) ? (
              <span className="text-[10px] text-warn">missing</span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

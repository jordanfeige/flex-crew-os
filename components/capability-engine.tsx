"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ALL_CAPABILITIES,
  CAPABILITY_LABEL,
  SERVICE_LABEL,
  type Capability,
  type CapabilityJob,
  type Service,
} from "@/lib/capabilities";
import {
  defaultServiceConfigs,
  supplyQualifyPct,
  type ServiceConfig,
} from "@/lib/copilot";
import type { WorkerProfile } from "@/lib/worker";
import { matchScore } from "@/lib/worker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * Ops console — Capability Engine.
 * Same WorkerProfile + matchScore as the worker app; service is configuration.
 */
export function CapabilityEngineSection({
  profiles,
  jobs,
  focusWorkerId,
}: {
  profiles: WorkerProfile[];
  jobs: CapabilityJob[];
  focusWorkerId?: string;
}) {
  const reduce = useReducedMotion();
  const [configs, setConfigs] = useState<ServiceConfig[]>(() =>
    defaultServiceConfigs(),
  );
  const [serviceId, setServiceId] = useState<string>("moving");
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newCaps, setNewCaps] = useState<Capability[]>([]);

  const active = configs.find((c) => c.id === serviceId) ?? configs[0];
  const qualifyPct = useMemo(() => {
    // Treat custom services like Service when id matches known; else compute manually
    if (active.id in SERVICE_LABEL) {
      return supplyQualifyPct(profiles, active.id as Service);
    }
    const ok = profiles.filter((p) =>
      active.requiredCapabilities.every((c) =>
        p.earnedCapabilityIds.includes(c),
      ),
    ).length;
    return Math.round((ok / Math.max(1, profiles.length)) * 100);
  }, [profiles, active]);

  const feed = useMemo(() => {
    const byService = jobs.filter((j) => j.service === active.id);
    const pool = byService.length ? byService : jobs;
    return pool.slice(0, 4);
  }, [jobs, active.id]);

  const rankedWorkers = useMemo(() => {
    return profiles
      .map((p) => {
        const scores = feed.map((j) => matchScore(p, j).score);
        const avg =
          scores.length === 0
            ? 0
            : Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        return { profile: p, avg };
      })
      .sort((a, b) => b.avg - a.avg);
  }, [profiles, feed]);

  function addService() {
    if (!newLabel.trim() || newCaps.length === 0) return;
    const id = newLabel.trim().toLowerCase().replace(/\s+/g, "_");
    setConfigs((prev) => [
      ...prev,
      {
        id,
        label: newLabel.trim(),
        requiredCapabilities: [...newCaps],
      },
    ]);
    setServiceId(id);
    setAdding(false);
    setNewLabel("");
    setNewCaps([]);
  }

  return (
    <Card
      id="capability-engine"
      className="relative isolate scroll-mt-4 overflow-hidden shadow-elevated"
    >
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Capability Engine</CardTitle>
          <Badge variant="engine">Ops · configuration</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          New services are configuration, not new products. Same worker profiles and
          matchScore() as the worker app.
        </p>
        <div
          className="flex flex-wrap gap-2"
          role="radiogroup"
          aria-label="Service"
        >
          {configs.map((c) => (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={serviceId === c.id}
              onClick={() => setServiceId(c.id)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                serviceId === c.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {c.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAdding((a) => !a)}
            className="rounded-full border border-dashed border-border px-3.5 py-1.5 text-sm font-medium text-[var(--flex)] hover:bg-[var(--flex-tint)]"
          >
            + Add service
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {adding ? (
          <div className="space-y-3 rounded-xl border border-[var(--flex)]/25 bg-[var(--flex-tint)]/50 p-3">
            <p className="text-sm font-semibold">Add service = config object</p>
            <input
              className="h-9 w-full rounded-lg border border-border bg-card px-3 text-sm"
              placeholder="Service label (e.g. Pet sitting)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
            />
            <div className="flex flex-wrap gap-1.5">
              {ALL_CAPABILITIES.map((cap) => {
                const on = newCaps.includes(cap);
                return (
                  <button
                    key={cap}
                    type="button"
                    onClick={() =>
                      setNewCaps((prev) =>
                        on ? prev.filter((c) => c !== cap) : [...prev, cap],
                      )
                    }
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-medium border",
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {CAPABILITY_LABEL[cap]}
                  </button>
                );
              })}
            </div>
            <Button type="button" size="sm" onClick={addService}>
              Save config · score supply
            </Button>
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={active.id}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Required capabilities
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {active.requiredCapabilities.map((c) => (
                    <span
                      key={c}
                      className="rounded-md bg-good-tint px-2 py-1 text-[11px] font-medium text-good"
                    >
                      {CAPABILITY_LABEL[c]}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-3 shadow-card">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  % of supply that qualifies · this market
                </p>
                <p className="mt-1 text-3xl font-semibold tabular text-[var(--flex)]">
                  {qualifyPct}%
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {profiles.filter((p) =>
                    active.requiredCapabilities.every((c) =>
                      p.earnedCapabilityIds.includes(c),
                    ),
                  ).length}
                  /{profiles.length} workers earn the full set
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Rematch · same profiles against {active.label}
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {rankedWorkers.map(({ profile, avg }) => (
                  <div
                    key={profile.id}
                    className={cn(
                      "rounded-xl border border-border bg-card p-3 shadow-card",
                      focusWorkerId === profile.id &&
                        "border-primary/40 shadow-elevated",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{profile.name}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {profile.tier} · reliability {profile.reliability}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "text-sm font-semibold tabular",
                          avg >= 90
                            ? "text-good"
                            : avg >= 70
                              ? "text-primary"
                              : "text-warn",
                        )}
                      >
                        {avg}%
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      Avg match on {feed.length} {active.label.toLowerCase()} job
                      {feed.length === 1 ? "" : "s"}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Job feed · explainable match
              </p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {feed.map((job) => {
                  const focus =
                    profiles.find((p) => p.id === focusWorkerId) ?? profiles[0];
                  const m = matchScore(focus, job);
                  return (
                    <div
                      key={job.id}
                      className="rounded-xl border border-border bg-card p-3.5 shadow-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold tracking-tight">
                            {job.title}
                          </p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {job.city} · {job.slot}
                          </p>
                        </div>
                        <span className="text-sm font-semibold tabular text-primary">
                          {m.score}%
                        </span>
                      </div>
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        Top reason: {m.reasons[0]?.label} (+
                        {m.reasons[0]?.contribution})
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

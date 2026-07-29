"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import type { MarketplacePayload } from "@/lib/marketplace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function healthStatus(v: number) {
  if (v >= 75) return { color: "var(--good)", label: "Healthy" };
  if (v >= 55) return { color: "var(--warn)", label: "Watch" };
  return { color: "var(--critical)", label: "At risk" };
}

function HeroGauge({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const v = Math.min(100, Math.max(0, value));
  const r = 70;
  const cx = 100;
  const cy = 88;
  const track = `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`;
  const length = Math.PI * r;
  const filled = (v / 100) * length;
  const status = healthStatus(v);

  return (
    <div className="relative mx-auto h-[108px] w-[200px] sm:mx-0">
      <svg viewBox="0 0 200 108" className="absolute inset-0 h-full w-full" aria-hidden>
        <path
          d={track}
          fill="none"
          stroke="var(--border)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <motion.path
          key={v}
          d={track}
          fill="none"
          stroke={status.color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${length}`}
          initial={reduce ? false : { strokeDasharray: `0 ${length}` }}
          animate={{ strokeDasharray: `${filled} ${length}` }}
          transition={
            reduce ? { duration: 0 } : { type: "spring", stiffness: 110, damping: 22 }
          }
        />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center">
        <motion.p
          key={value}
          initial={reduce ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[48px] font-semibold leading-none tracking-tight tabular"
        >
          {value}
          <span className="ml-0.5 text-lg font-medium text-muted-foreground">/100</span>
        </motion.p>
      </div>
    </div>
  );
}

export function MarketplaceHero({
  market,
  onSeeWhy,
}: {
  market: MarketplacePayload;
  onSeeWhy: () => void;
}) {
  const reduce = useReducedMotion();
  const status = healthStatus(market.supplyHealth);
  const delta = market.healthDelta;
  const driverPts = market.primaryDriver.pts;
  const signed =
    driverPts > 0 ? `+${driverPts}` : `${driverPts}`;

  const shortages = market.shortages
    .filter((s) => s.gap < 0)
    .sort((a, b) => a.gap - b.gap);

  return (
    <Card
      id="marketplace-hero"
      className="scroll-mt-4 overflow-hidden border-border shadow-elevated"
    >
      <CardContent className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-8 lg:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Marketplace health
              </p>
              <Badge
                variant="engine"
                className="normal-case tracking-normal"
                style={{ color: status.color }}
              >
                {status.label}
              </Badge>
            </div>
            <HeroGauge value={market.supplyHealth} />
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <ArrowDownRight
                className={cn(
                  "h-4 w-4",
                  delta > 0 ? "text-critical" : "text-good rotate-180",
                )}
                aria-hidden
              />
              <span className="tabular">
                {delta > 0 ? "▼" : "▲"} {delta > 0 ? "down" : "up"}{" "}
                <span className="font-semibold text-foreground">{Math.abs(delta)}</span> this
                week
              </span>
            </p>
            <div className="rounded-lg border border-[var(--flex)]/20 bg-[var(--flex-bg)] px-3 py-2.5">
              <p className="text-sm leading-snug">
                <span className="font-medium text-muted-foreground">Primary driver: </span>
                <span className="font-medium text-foreground">
                  {market.primaryDriver.label}
                </span>{" "}
                <span className="tabular text-muted-foreground">({signed} pts)</span>
              </p>
              <Button
                type="button"
                variant="link"
                className="mt-1 h-auto gap-1 px-0 text-sm"
                onClick={onSeeWhy}
              >
                see why
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Predicted shortages
          </p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {shortages.map((s, i) => (
              <motion.div
                key={`${s.city}-${s.slot}`}
                initial={reduce ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : i * 0.05 }}
                className="rounded-xl border border-critical/15 bg-critical-tint/40 px-3.5 py-3"
              >
                <p className="text-sm font-semibold tracking-tight">
                  {s.city} · {s.slot}
                </p>
                <p className="mt-1 text-lg font-semibold tabular text-critical">
                  {s.gap} movers
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  Demand {s.demand} · supply {s.supply}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import type { CopilotRecommendation } from "@/lib/copilot";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Ops Marketplace Copilot — actionable recommendations with impact + cited signals.
 * Consumes the same reliability/capability layer as the worker app.
 */
export function MarketplaceCopilot({
  recommendations,
  onSeeWorker,
}: {
  recommendations: CopilotRecommendation[];
  onSeeWorker?: (workerId: string) => void;
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>Marketplace Copilot</CardTitle>
          <Badge variant="engine">Ops</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Highest-priority issues with concrete actions — not a dashboard. Each
          rec cites the signal behind it.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {recommendations.map((rec, i) => (
          <div
            key={rec.id}
            className="rounded-xl border border-border bg-card p-3 shadow-card"
          >
            <div className="flex items-start gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--flex)] text-[11px] font-semibold text-white">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold tracking-tight">{rec.issue}</p>
                <p className="mt-1 flex items-start gap-1.5 text-xs text-foreground">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--flex)]" />
                  <span>{rec.action}</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {rec.impact.fillRate ? (
                    <ImpactChip label={rec.impact.fillRate} />
                  ) : null}
                  {rec.impact.reliability ? (
                    <ImpactChip label={rec.impact.reliability} />
                  ) : null}
                  {rec.impact.activation ? (
                    <ImpactChip label={rec.impact.activation} />
                  ) : null}
                  {rec.impact.margin ? (
                    <ImpactChip label={rec.impact.margin} />
                  ) : null}
                </div>
                <p className="mt-2 flex items-start gap-1 text-[11px] text-muted-foreground">
                  <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-[var(--flex)]" />
                  <span>
                    <span className="font-semibold text-foreground">Signal · </span>
                    {rec.signal}
                  </span>
                </p>
                {rec.relatedWorkerId && onSeeWorker ? (
                  <button
                    type="button"
                    className="mt-1.5 text-[11px] font-semibold text-[var(--flex)]"
                    onClick={() => onSeeWorker(rec.relatedWorkerId!)}
                  >
                    Open worker profile →
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ImpactChip({ label }: { label: string }) {
  return (
    <span className="rounded-md bg-good-tint px-2 py-0.5 text-[10px] font-semibold text-good">
      {label}
    </span>
  );
}

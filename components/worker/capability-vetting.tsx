"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, X } from "lucide-react";
import type { Capability } from "@/lib/capabilities";
import { CAPABILITY_LABEL } from "@/lib/capabilities";
import { coachingModuleFor } from "@/lib/coaching";
import type { WorkerProfile } from "@/lib/worker";
import { Button } from "@/components/ui/button";

/** Worker-facing modular vetting — not the ops Capability Engine. */
export function CapabilityVettingSheet({
  open,
  profile,
  onClose,
  onEarn,
}: {
  open: boolean;
  profile: WorkerProfile;
  onClose: () => void;
  onEarn: (cap: Capability) => void;
}) {
  const reduce = useReducedMotion();
  const locked = profile.capabilities.filter((c) => !c.earned);
  const [picked, setPicked] = useState<Capability | null>(null);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const coach = picked ? coachingModuleFor(picked) : null;

  function finish() {
    if (!picked) return;
    onEarn(picked);
    setDone(true);
    window.setTimeout(() => {
      setDone(false);
      setPicked(null);
      onClose();
    }, 1200);
  }

  return (
    <AnimatePresence>
      <motion.div
        className="absolute inset-0 z-40 flex flex-col bg-card"
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold tracking-tight">Add a capability</p>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {done && picked ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-good-tint text-good">
              <Check className="h-6 w-6" />
            </span>
            <p className="text-lg font-semibold">{CAPABILITY_LABEL[picked]} earned</p>
            <p className="text-xs text-muted-foreground">
              Added to your shared profile — matching updates instantly
            </p>
          </div>
        ) : (
          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Modular vetting · you only see capabilities you opt into. Same object
              powers Job Briefs, matching, and ops.
            </p>
            <div className="space-y-1.5">
              {locked.map((cap) => (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => setPicked(cap.id)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left ${
                    picked === cap.id
                      ? "border-[var(--flex)] bg-[var(--flex-tint)]"
                      : "border-border bg-card"
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold">{cap.label}</p>
                    <p className="text-[11px] text-muted-foreground">
                      Unlocks {cap.unlocksJobTypes[0] ?? "new job types"}
                    </p>
                  </div>
                  <span className="text-[10px] font-semibold text-[var(--flex)]">
                    Select
                  </span>
                </button>
              ))}
            </div>

            {picked && coach ? (
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Vetting step
                </p>
                <p className="mt-1 text-sm font-semibold">{coach.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{coach.summary}</p>
                <Button type="button" className="mt-3 w-full" onClick={finish}>
                  Complete vetting · earn {CAPABILITY_LABEL[picked]}
                </Button>
              </div>
            ) : null}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CAPABILITY_LABEL,
  type Capability,
} from "@/lib/capabilities";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

const STARTING_CAPS: Capability[] = [
  "heavy_lifting",
  "furniture_assembly",
  "packing",
  "driving",
  "deep_cleaning",
  "tv_mounting",
];

type Step = "welcome" | "capabilities" | "vetting" | "onboarding" | "activated";

const STEPS: Step[] = ["welcome", "capabilities", "vetting", "onboarding", "activated"];

export function ActivationFlow({
  initialCaps,
  onComplete,
}: {
  initialCaps: Capability[];
  onComplete: (caps: Capability[]) => void;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = useState<Step>("welcome");
  const [caps, setCaps] = useState<Capability[]>(() =>
    initialCaps.length ? initialCaps.slice(0, 3) : ["heavy_lifting", "packing"],
  );
  const [bgStatus, setBgStatus] = useState<"idle" | "processing" | "cleared">("idle");
  const [idOk, setIdOk] = useState(false);

  const stepIndex = STEPS.indexOf(step);
  const needsVehicle = caps.includes("driving");

  useEffect(() => {
    if (step !== "vetting") return;
    setIdOk(true);
    setBgStatus("processing");
    const t = window.setTimeout(() => setBgStatus("cleared"), 2000);
    return () => window.clearTimeout(t);
  }, [step]);

  function toggleCap(c: Capability) {
    setCaps((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  function next() {
    const i = STEPS.indexOf(step);
    if (i < STEPS.length - 1) setStep(STEPS[i + 1]);
  }

  return (
    <div className="flex flex-1 flex-col px-4 pb-5 pt-2">
      <div className="mb-4 flex items-center gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={cn(
              "h-1 flex-1 rounded-full transition-colors",
              i <= stepIndex ? "bg-primary" : "bg-muted",
            )}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduce ? undefined : { opacity: 0, y: -6 }}
          className="flex flex-1 flex-col"
        >
          {step === "welcome" ? (
            <div className="flex flex-1 flex-col justify-center gap-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                Flex Crew
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">
                Get paid. Get a workout.
              </h2>
              <p className="text-sm text-muted-foreground">
                Prove out on real moves. Capabilities unlock more work — same account.
              </p>
              <Button type="button" className="mt-4 w-full" onClick={next}>
                Start
              </Button>
            </div>
          ) : null}

          {step === "capabilities" ? (
            <div className="flex flex-1 flex-col gap-3">
              <h2 className="text-xl font-semibold tracking-tight">Your capabilities</h2>
              <p className="text-sm text-muted-foreground">
                Pick your starting slice of the Capability Engine.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {STARTING_CAPS.map((c) => {
                  const on = caps.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCap(c)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors",
                        on
                          ? "border-primary bg-accent text-accent-foreground"
                          : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {CAPABILITY_LABEL[c]}
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Coming soon, same account: Cleaning · Delivery · Install.
              </p>
              <Button
                type="button"
                className="mt-auto w-full"
                disabled={caps.length === 0}
                onClick={next}
              >
                Continue
              </Button>
            </div>
          ) : null}

          {step === "vetting" ? (
            <div className="flex flex-1 flex-col gap-3">
              <h2 className="text-xl font-semibold tracking-tight">Vetting</h2>
              <VetRow
                label="Identity · Persona"
                status={idOk ? "ok" : "wait"}
                detail="Instant ✓"
              />
              <VetRow
                label="Background · Checker"
                status={bgStatus === "cleared" ? "ok" : "wait"}
                detail={
                  bgStatus === "processing"
                    ? "Processing…"
                    : bgStatus === "cleared"
                      ? "Cleared ✓"
                      : "Queued"
                }
              />
              {needsVehicle ? (
                <VetRow label="Vehicle · Yoshi" status="ok" detail="Driving capability" />
              ) : (
                <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Vehicle check skipped — no driving capability selected.
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Close the app — we&apos;ll notify you when it clears.
              </p>
              <Button
                type="button"
                className="mt-auto w-full"
                disabled={bgStatus !== "cleared"}
                onClick={next}
              >
                Continue
              </Button>
            </div>
          ) : null}

          {step === "onboarding" ? (
            <div className="flex flex-1 flex-col gap-3">
              <h2 className="text-xl font-semibold tracking-tight">Onboarding</h2>
              <div className="rounded-xl border border-border bg-card p-4 shadow-card">
                <p className="text-sm font-semibold">How a Flex move works</p>
                <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                  <li>1. Claim a clear job summary — know the heavy items first</li>
                  <li>2. Show up on time with the listed equipment</li>
                  <li>3. Finish + rate — capability tags feed your reliability</li>
                </ul>
              </div>
              <Button type="button" className="mt-auto w-full" onClick={next}>
                Got it
              </Button>
            </div>
          ) : null}

          {step === "activated" ? (
            <div className="flex flex-1 flex-col justify-center gap-4 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-good-tint text-good">
                <Check className="h-7 w-7" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                You&apos;re verified
              </h2>
              <p className="text-sm text-muted-foreground">
                …but you&apos;re not truly active until your first job.
              </p>
              <p className="text-[11px] font-medium text-muted-foreground">
                activation = first job completed
              </p>
              <Button
                type="button"
                className="mt-2 w-full"
                onClick={() => onComplete(caps)}
              >
                Go to home
              </Button>
            </div>
          ) : null}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function VetRow({
  label,
  status,
  detail,
}: {
  label: string;
  status: "ok" | "wait";
  detail: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-3 py-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      {status === "ok" ? (
        <Check className="h-4 w-4 text-good" />
      ) : (
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
      )}
    </div>
  );
}

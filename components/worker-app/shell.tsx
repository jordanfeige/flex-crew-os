"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Capability, CapabilityJob } from "@/lib/capabilities";
import { CAPABILITY_JOBS } from "@/data/reviews";
import type { Review } from "@/lib/reviews";
import {
  evaluate,
  evaluateCapabilityReliability,
  type Signals,
} from "@/lib/engine";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivationFlow } from "@/components/worker-app/activation";
import { WorkerHome } from "@/components/worker-app/home";
import { JobClarityScreen } from "@/components/worker-app/job-clarity";
import { RatingModal } from "@/components/worker-app/rating-modal";
import { cn } from "@/lib/utils";

export type WorkerAppPhase = "activation" | "home" | "clarity";

export function WorkerAppShell({
  workerId,
  workerName,
  signals,
  capabilities,
  reviews,
  onAppendReview,
  onActivateFirstJob,
  onCapabilitiesCommit,
}: {
  workerId: string;
  workerName: string;
  signals: Signals;
  capabilities: Capability[];
  reviews: Review[];
  onAppendReview: (review: Review) => void;
  onActivateFirstJob: (payUsd: number) => void;
  onCapabilitiesCommit: (caps: Capability[]) => void;
}) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<WorkerAppPhase>("activation");
  const [activated, setActivated] = useState(false);
  const [firstJobDone, setFirstJobDone] = useState(false);
  const [earningsWeek, setEarningsWeek] = useState(0);
  const [goalWeek] = useState(420);
  const [pickedCaps, setPickedCaps] = useState<Capability[]>(capabilities);
  const [selectedJob, setSelectedJob] = useState<CapabilityJob | null>(null);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [pendingJob, setPendingJob] = useState<CapabilityJob | null>(null);
  const [tab, setTab] = useState<"home" | "jobs" | "profile">("home");

  const result = useMemo(() => evaluate(signals), [signals]);
  const capRel = useMemo(
    () => evaluateCapabilityReliability(workerId, pickedCaps, reviews),
    [workerId, pickedCaps, reviews],
  );

  const jobs = useMemo(
    () => CAPABILITY_JOBS.filter((j) => j.service === "moving").slice(0, 3),
    [],
  );

  function finishActivation(caps: Capability[]) {
    setPickedCaps(caps);
    onCapabilitiesCommit(caps);
    setActivated(true);
    setPhase("home");
  }

  function openJob(job: CapabilityJob) {
    setSelectedJob(job);
    setPhase("clarity");
  }

  function claimJob(job: CapabilityJob) {
    const pay = job.clarity
      ? job.clarity.pay.base + job.clarity.pay.mileage + job.clarity.pay.premium
      : job.payUsd;
    setEarningsWeek((e) => e + pay);
    if (!firstJobDone) {
      setFirstJobDone(true);
      onActivateFirstJob(pay);
    }
    setPendingJob(job);
    setSelectedJob(null);
    setPhase("home");
    setRatingOpen(true);
  }

  return (
    <Card id="worker-app" className="scroll-mt-4 shadow-elevated">
      <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>Worker app</CardTitle>
          <Badge variant="live">Job Clarity</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Mobile frame · activation → home → clarity
        </p>
      </CardHeader>
      <CardContent className="flex justify-center pb-6">
        <div
          className={cn(
            "relative w-full max-w-[390px] overflow-hidden rounded-[2rem] border-[10px] border-[#1a1f1c] bg-background shadow-elevated",
            "min-h-[720px]",
          )}
        >
          {/* Notch */}
          <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-6 w-28 -translate-x-1/2 rounded-b-2xl bg-[#1a1f1c]" />

          <div className="relative flex h-full min-h-[700px] flex-col pt-7">
            <AnimatePresence mode="wait">
              {phase === "activation" ? (
                <motion.div
                  key="activation"
                  initial={reduce ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? undefined : { opacity: 0, x: -12 }}
                  className="flex flex-1 flex-col"
                >
                  <ActivationFlow
                    initialCaps={capabilities}
                    onComplete={finishActivation}
                  />
                </motion.div>
              ) : null}

              {phase === "home" ? (
                <motion.div
                  key="home"
                  initial={reduce ? false : { opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? undefined : { opacity: 0, x: -12 }}
                  className="flex flex-1 flex-col"
                >
                  <WorkerHome
                    workerName={workerName}
                    signals={signals}
                    result={result}
                    capabilityReliability={capRel}
                    earningsWeek={earningsWeek}
                    goalWeek={goalWeek}
                    firstJobDone={firstJobDone}
                    activated={activated}
                    jobs={jobs}
                    capabilities={pickedCaps}
                    tab={tab}
                    onTabChange={setTab}
                    onOpenJob={openJob}
                    onRestartActivation={() => {
                      setPhase("activation");
                      setActivated(false);
                      setFirstJobDone(false);
                      setEarningsWeek(0);
                    }}
                  />
                </motion.div>
              ) : null}

              {phase === "clarity" && selectedJob ? (
                <motion.div
                  key="clarity"
                  initial={reduce ? false : { opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={reduce ? undefined : { opacity: 0, x: -12 }}
                  className="flex flex-1 flex-col"
                >
                  <JobClarityScreen
                    job={selectedJob}
                    onBack={() => {
                      setSelectedJob(null);
                      setPhase("home");
                    }}
                    onClaim={() => claimJob(selectedJob)}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <RatingModal
          open={ratingOpen}
          job={pendingJob}
          workerId={workerId}
          onClose={() => {
            setRatingOpen(false);
            setPendingJob(null);
          }}
          onSubmit={(review) => {
            onAppendReview(review);
            setRatingOpen(false);
            setPendingJob(null);
          }}
        />
      </CardContent>
    </Card>
  );
}

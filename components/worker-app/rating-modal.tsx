"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Star } from "lucide-react";
import {
  CAPABILITY_LABEL,
  type Capability,
} from "@/lib/capabilities";
import type { CapabilityJob } from "@/lib/capabilities";
import type { Review } from "@/lib/reviews";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TAG_OPTIONS: Capability[] = [
  "heavy_lifting",
  "packing",
  "furniture_assembly",
  "driving",
  "deep_cleaning",
  "tv_mounting",
];

export function RatingModal({
  open,
  job,
  workerId,
  onClose,
  onSubmit,
}: {
  open: boolean;
  job: CapabilityJob | null;
  workerId: string;
  onClose: () => void;
  onSubmit: (review: Review) => void;
}) {
  const reduce = useReducedMotion();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [tags, setTags] = useState<Capability[]>(["packing"]);
  const [role, setRole] = useState<"customer" | "worker">("customer");

  function toggleTag(c: Capability) {
    setTags((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
    );
  }

  function submit() {
    if (!job) return;
    const review: Review = {
      id: `live-${Date.now()}`,
      jobId: job.id,
      subjectWorkerId: workerId,
      authorType: role,
      authorName: role === "customer" ? "Customer" : "Co-flexor",
      rating,
      comment: comment.trim() || (rating >= 4 ? "Great work" : "Needs improvement"),
      capabilityTags: tags.length ? tags : undefined,
      ts: new Date().toISOString(),
    };
    onSubmit(review);
    setComment("");
    setRating(5);
    setTags(["packing"]);
  }

  return (
    <AnimatePresence>
      {open && job ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="rating-title"
            initial={reduce ? false : { y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={reduce ? undefined : { y: 16, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-border bg-card p-4 shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="rating-title" className="text-base font-semibold tracking-tight">
              Rate this job
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">{job.title}</p>

            <div className="mt-3 flex gap-2">
              {(
                [
                  ["customer", "Customer → worker"],
                  ["worker", "Worker ↔ peer"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setRole(id)}
                  className={cn(
                    "rounded-full px-2.5 py-1 text-[11px] font-medium",
                    role === id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-4 flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-label={`${n} stars`}
                  onClick={() => setRating(n)}
                  className="p-0.5"
                >
                  <Star
                    className={cn(
                      "h-7 w-7",
                      n <= rating
                        ? "fill-[var(--warn)] text-[var(--warn)]"
                        : "text-border",
                    )}
                  />
                </button>
              ))}
            </div>

            <label className="mt-3 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Comment
              <textarea
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder='e.g. "great packing"'
              />
            </label>

            <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Capability tags
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map((c) => {
                const on = tags.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleTag(c)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium",
                      on
                        ? "border-primary bg-accent text-accent-foreground"
                        : "border-border text-muted-foreground",
                    )}
                  >
                    {CAPABILITY_LABEL[c]}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Skip
              </Button>
              <Button type="button" className="flex-1" onClick={submit}>
                Submit
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

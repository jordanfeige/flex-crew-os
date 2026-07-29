"use client";

import { motion, useReducedMotion, AnimatePresence } from "framer-motion";

/** Canonical reliability / tier progress ring — one component for landing + engagement. */
export function ProgressRing({
  value,
  color,
  label,
  sub,
  size = 120,
}: {
  value: number;
  color: string;
  label: string;
  sub: string;
  size?: 96 | 104 | 120;
}) {
  const reduce = useReducedMotion();
  const r = size === 120 ? 48 : size === 104 ? 46 : 36;
  const stroke = size === 120 ? 9 : 8;
  const c = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value)) / 100;
  const dash = c * pct;
  const vb = size;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox={`0 0 ${vb} ${vb}`}
        className="h-full w-full -rotate-90"
        aria-hidden
      >
        <circle
          cx={vb / 2}
          cy={vb / 2}
          r={r}
          fill="none"
          stroke="#eceef1"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={vb / 2}
          cy={vb / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          initial={false}
          animate={{ strokeDasharray: `${dash} ${c - dash}` }}
          transition={
            reduce ? { duration: 0 } : { type: "spring", stiffness: 120, damping: 20 }
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.span
            key={label}
            initial={reduce ? false : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -4 }}
            className={
              size === 120
                ? "text-2xl font-semibold tabular tracking-tight"
                : "text-[26px] font-extrabold tabular leading-none tracking-tight"
            }
          >
            {label}
          </motion.span>
        </AnimatePresence>
        <span
          className={
            size === 120
              ? "mt-0.5 max-w-[4.5rem] text-[10px] leading-tight text-muted-foreground"
              : "mt-0.5 max-w-[4rem] text-[10px] leading-tight text-muted-foreground"
          }
        >
          {sub}
        </span>
      </div>
    </div>
  );
}

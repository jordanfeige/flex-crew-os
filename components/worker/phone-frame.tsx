"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Prototype phone chrome — 390×820, notch, dual box-shadow. */
export function PhoneFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("fx-phone", className)}>
      <div className="fx-notch" aria-hidden />
      {children}
    </div>
  );
}

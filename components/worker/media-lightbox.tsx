"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Play, X } from "lucide-react";
import type { JobMedia, JobMediaPhoto, JobMediaVideo } from "@/lib/capabilities";
import { cn } from "@/lib/utils";

export type LightboxItem =
  | { kind: "video"; video: JobMediaVideo }
  | { kind: "photo"; photo: JobMediaPhoto };

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Optional walkthrough attachment strip + lightbox (display-only). */
export function WalkthroughMedia({
  media,
  openItem,
  onOpen,
  onClose,
}: {
  media: JobMedia;
  openItem: LightboxItem | null;
  onOpen: (item: LightboxItem) => void;
  onClose: () => void;
}) {
  const photos = media.photos;
  const shown = photos.slice(0, 3);
  const more = Math.max(0, photos.length - shown.length);

  return (
    <>
      <div className="rounded-xl border border-border bg-muted/40 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Optional walkthrough media
        </p>

        {media.video ? (
          <button
            type="button"
            onClick={() => onOpen({ kind: "video", video: media.video! })}
            className="relative mt-2 aspect-video w-full overflow-hidden rounded-lg border border-border bg-card"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={media.video.poster}
              alt="Walkthrough video"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-black/25">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-card/95 text-primary shadow-card">
                <Play className="h-4 w-4 fill-current" />
              </span>
            </span>
            <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold tabular text-white">
              {formatDuration(media.video.durationSec)}
            </span>
          </button>
        ) : null}

        {photos.length > 0 ? (
          <div className="mt-2 flex gap-1.5">
            {shown.map((photo) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => onOpen({ kind: "photo", photo })}
                className="relative h-14 flex-1 overflow-hidden rounded-md border border-border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
            {more > 0 ? (
              <button
                type="button"
                onClick={() => onOpen({ kind: "photo", photo: photos[3] ?? photos[0] })}
                className="grid h-14 w-14 shrink-0 place-items-center rounded-md border border-border bg-card text-xs font-semibold text-muted-foreground"
              >
                +{more}
              </button>
            ) : null}
          </div>
        ) : null}

        <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
          Customer walkthrough attached for reference. It is not used to
          generate the text brief today.
        </p>
      </div>

      <MediaLightbox item={openItem} onClose={onClose} />
    </>
  );
}

function MediaLightbox({
  item,
  onClose,
}: {
  item: LightboxItem | null;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();

  return (
    <AnimatePresence>
      {item ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal
            aria-label="Walkthrough media"
            initial={reduce ? false : { scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={reduce ? undefined : { scale: 0.98, opacity: 0 }}
            className={cn(
              "relative w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-card shadow-elevated",
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center rounded-lg bg-card/90 hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {item.kind === "video" ? (
              <div>
                <div className="relative aspect-video bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.video.poster}
                    alt="Walkthrough"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-elevated">
                      <Play className="h-5 w-5 fill-current" />
                    </span>
                  </span>
                  <span className="absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold tabular text-white">
                    {formatDuration(item.video.durationSec)}
                  </span>
                </div>
                <p className="px-4 py-3 text-sm text-muted-foreground">
                  Customer walkthrough · display-only attachment. Vision
                  extraction is the next step.
                </p>
              </div>
            ) : (
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.photo.url}
                  alt={item.photo.caption}
                  className="max-h-[70vh] w-full object-contain bg-muted"
                />
                <p className="px-4 py-3 text-sm font-medium">{item.photo.caption}</p>
              </div>
            )}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

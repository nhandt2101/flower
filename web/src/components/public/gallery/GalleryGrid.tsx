"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ImageFrame } from "../ui/ImageFrame";

// Placeholder tiles with varied aspect ratios for a Pinterest-style waterfall.
// Replace with the shop's real photos (served from CloudFront/S3) later.
const TILES = [
  "aspect-[3/4]",
  "aspect-[1/1]",
  "aspect-[3/5]",
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-[4/5]",
  "aspect-[1/1]",
  "aspect-[2/3]",
  "aspect-[4/3]",
  "aspect-[3/4]",
  "aspect-[3/5]",
  "aspect-[4/5]",
  "aspect-[1/1]",
  "aspect-[4/3]",
  "aspect-[2/3]",
];

export function GalleryGrid() {
  const t = useTranslations("galleryPage");
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const show = useCallback(
    (next: number) => setOpen((i) => ((i ?? 0) + next + TILES.length) % TILES.length),
    [],
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") show(1);
      if (e.key === "ArrowLeft") show(-1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close, show]);

  return (
    <>
      <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
        {TILES.map((aspect, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`${t("imageLabel")} ${i + 1}`}
            className="block w-full break-inside-avoid rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ImageFrame label={t("imageLabel")} aspect={aspect} hover flat />
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={close}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/80 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={close}
            aria-label={t("close")}
            className="absolute right-5 top-5 text-2xl text-background/80 hover:text-background"
          >
            ✕
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              show(-1);
            }}
            aria-label={t("prev")}
            className="absolute left-4 text-3xl text-background/70 hover:text-background md:left-10"
          >
            ‹
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl"
          >
            <ImageFrame label={t("imageLabel")} aspect="aspect-[4/3]" />
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              show(1);
            }}
            aria-label={t("next")}
            className="absolute right-4 text-3xl text-background/70 hover:text-background md:right-10"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ImageFrame } from "../ui/ImageFrame";

// Placeholder tiles with varied aspect ratios for a Pinterest-style waterfall.
// Replace with the shop's real photos: each tile becomes a GalleryImage
// ({ url, thumbUrl, alt }) — grid uses thumbUrl, the lightbox uses url.
type Tile = { aspect: string; url?: string; alt?: string };

const TILES: Tile[] = [
  "aspect-[3/4]", "aspect-[1/1]", "aspect-[3/5]", "aspect-[4/3]", "aspect-[3/4]",
  "aspect-[4/5]", "aspect-[1/1]", "aspect-[2/3]", "aspect-[4/3]", "aspect-[3/4]",
  "aspect-[3/5]", "aspect-[4/5]", "aspect-[1/1]", "aspect-[4/3]", "aspect-[2/3]",
].map((aspect) => ({ aspect }));

async function downloadImage(url: string, filename: string) {
  try {
    // fetch→blob works cross-origin when CloudFront allows CORS, and forces a
    // real download regardless of Content-Disposition.
    const res = await fetch(url);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    triggerDownload(href, filename);
    URL.revokeObjectURL(href);
  } catch {
    triggerDownload(url, filename); // fallback: let the browser handle it
  }
}

function triggerDownload(href: string, filename: string) {
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function GalleryGrid() {
  const t = useTranslations("galleryPage");
  const [open, setOpen] = useState<number | null>(null);

  const close = useCallback(() => setOpen(null), []);
  const show = useCallback(
    (next: number) =>
      setOpen((i) => ((i ?? 0) + next + TILES.length) % TILES.length),
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

  const current = open !== null ? TILES[open] : null;

  return (
    <>
      <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
        {TILES.map((tile, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpen(i)}
            aria-label={`${t("imageLabel")} ${i + 1}`}
            className="block w-full break-inside-avoid rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <ImageFrame label={t("imageLabel")} aspect={tile.aspect} hover flat />
          </button>
        ))}
      </div>

      {open !== null && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t("imageLabel")}
          onClick={close}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/90 p-4 backdrop-blur-sm sm:p-8"
        >
          {/* Top toolbar: counter + save + close */}
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4">
            <span className="text-sm tabular-nums tracking-wide text-background/70">
              {open + 1} / {TILES.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (current.url) {
                    void downloadImage(current.url, `bild-${open + 1}.webp`);
                  }
                }}
                aria-label={t("save")}
                title={t("save")}
                className="flex h-10 w-10 items-center justify-center rounded-full text-background/80 transition-colors hover:bg-background/10 hover:text-background"
              >
                <DownloadIcon />
              </button>
              <button
                type="button"
                onClick={close}
                aria-label={t("close")}
                title={t("close")}
                className="flex h-10 w-10 items-center justify-center rounded-full text-background/80 transition-colors hover:bg-background/10 hover:text-background"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* Prev */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              show(-1);
            }}
            aria-label={t("prev")}
            className="absolute left-2 flex h-12 w-12 items-center justify-center rounded-full text-3xl text-background/70 transition-colors hover:bg-background/10 hover:text-background md:left-6"
          >
            ‹
          </button>

          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[82vh] w-full max-w-3xl"
          >
            <ImageFrame label={t("imageLabel")} aspect="aspect-[4/3]" />
          </div>

          {/* Next */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              show(1);
            }}
            aria-label={t("next")}
            className="absolute right-2 flex h-12 w-12 items-center justify-center rounded-full text-3xl text-background/70 transition-colors hover:bg-background/10 hover:text-background md:right-6"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}

function DownloadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 10 5 5 5-5" />
      <path d="M5 21h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

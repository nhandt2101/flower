"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { listImages } from "@/lib/api/images";
import type { Cursor, GalleryImage, ImageCategory } from "@/lib/api/types";
import { Reveal } from "../ui/Reveal";
import { GalleryPhoto } from "./GalleryPhoto";

const CATEGORIES = ["wedding", "birthday", "funeral"] as const;
type Filter = "all" | (typeof CATEGORIES)[number];
const PAGE_SIZE = 24;

async function downloadImage(url: string, filename: string) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const href = URL.createObjectURL(blob);
    triggerDownload(href, filename);
    URL.revokeObjectURL(href);
  } catch {
    triggerDownload(url, filename);
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
  const to = useTranslations("occasions");
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<GalleryImage[]>([]);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [dir, setDir] = useState<1 | -1>(1);

  const loadPage = useCallback(async (selected: Filter, nextCursor?: string) => {
    if (nextCursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const data = await listImages({
        cursor: nextCursor,
        limit: PAGE_SIZE,
        category: selected === "all" ? undefined : (selected as ImageCategory),
      });
      setItems((current) => (nextCursor ? [...current, ...data.items] : data.items));
      setCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load gallery images.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadPage(filter));
  }, [filter, loadPage]);

  const openAt = useCallback((i: number) => {
    setDir(1);
    setOpen(i);
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const close = useCallback(() => {
    setVisible(false);
    window.setTimeout(() => setOpen(null), 220);
  }, []);

  const show = useCallback(
    (next: 1 | -1) => {
      setDir(next);
      setOpen((i) => ((i ?? 0) + next + items.length) % items.length);
    },
    [items.length],
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

  const selectFilter = (nextFilter: Filter) => {
    setOpen(null);
    setVisible(false);
    setCursor(null);
    setItems([]);
    setFilter(nextFilter);
  };

  const tabs: { key: Filter; label: string }[] = useMemo(
    () => [
      { key: "all", label: t("all") },
      ...CATEGORIES.map((category) => ({
        key: category,
        label: to(`items.${category}.label`),
      })),
    ],
    [t, to],
  );

  const current = open !== null ? items[open] : null;

  return (
    <>
      <div className="mb-10 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => selectFilter(tab.key)}
              aria-pressed={active}
              className={`rounded-full border px-4 py-1.5 text-sm tracking-wide transition-colors ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-silver text-muted hover:border-accent hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-muted">{t("loading")}</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <div className="min-h-44 border-t border-silver pt-3">
          <p className="text-2xl text-muted">
            {error ? t("fallback") : t("empty")}
          </p>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <>
          <div className="columns-2 gap-4 md:columns-3 lg:columns-4 [&>*]:mb-4">
            {items.map((image, i) => (
              <Reveal
                key={image.id}
                className="break-inside-avoid"
                delay={(i % 8) * 70}
              >
                <button
                  type="button"
                  onClick={() => openAt(i)}
                  aria-label={image.alt || `${t("imageLabel")} ${i + 1}`}
                  className="block w-full rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  <GalleryPhoto
                    image={image}
                    label={`${t("imageLabel")} ${i + 1}`}
                    index={i}
                    flat
                  />
                </button>
              </Reveal>
            ))}
          </div>

          {cursor ? (
            <button
              type="button"
              onClick={() => void loadPage(filter, cursor)}
              disabled={loadingMore}
              className="mt-10 w-full rounded-sm border border-silver px-7 py-3 text-sm tracking-wide text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
            >
              {loadingMore ? t("loading") : t("loadMore", { count: PAGE_SIZE })}
            </button>
          ) : null}
        </>
      ) : null}

      {open !== null && current && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={current.alt || t("imageLabel")}
          onClick={close}
          className={`lb-overlay fixed inset-0 z-[60] flex items-center justify-center bg-foreground/90 p-4 backdrop-blur-sm sm:p-8 ${
            visible ? "is-open" : ""
          }`}
        >
          <div className="absolute inset-x-0 top-0 flex items-center justify-between px-5 py-4">
            <span className="text-sm tabular-nums tracking-wide text-background/70">
              {open + 1} / {items.length}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  void downloadImage(current.url, `bild-${open + 1}.webp`);
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

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              show(-1);
            }}
            aria-label={t("prev")}
            className="absolute left-2 flex h-12 w-12 items-center justify-center rounded-full text-3xl text-background/70 transition-colors hover:bg-background/10 hover:text-background md:left-6"
          >
            ‹
          </button>

          <div
            onClick={(event) => event.stopPropagation()}
            className="lb-panel max-h-[82vh] w-full max-w-5xl"
          >
            <div
              key={current.id}
              className={`lb-slide ${dir > 0 ? "from-right" : "from-left"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={current.url}
                alt={current.alt || t("imageLabel")}
                className="mx-auto max-h-[82vh] w-auto max-w-full rounded-sm object-contain"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
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

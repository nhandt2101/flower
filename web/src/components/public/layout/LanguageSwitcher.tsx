"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LANGS: Record<string, { label: string; short: string }> = {
  de: { label: "Deutsch", short: "DE" },
  en: { label: "English", short: "EN" },
  vi: { label: "Tiếng Việt", short: "VI" },
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const switchTo = (loc: string) => {
    setOpen(false);
    if (loc === locale) return;
    startTransition(() => {
      // scroll: false keeps the reader where they are on the page.
      router.replace(pathname, { locale: loc, scroll: false });
    });
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-pending={isPending ? "" : undefined}
        className="inline-flex items-center gap-1.5 rounded-full border border-silver-soft bg-surface/60 px-3 py-1.5 text-xs tracking-[0.08em] text-foreground backdrop-blur transition-colors hover:border-accent data-[pending]:opacity-60"
      >
        <Flag locale={locale} />
        <span className="font-medium">{LANGS[locale].short}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-md border border-silver-soft bg-surface py-1 shadow-lg shadow-foreground/5"
        >
          {routing.locales.map((loc) => {
            const active = loc === locale;
            return (
              <li key={loc} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => switchTo(loc)}
                  className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-sm transition-colors ${
                    active
                      ? "bg-silver-soft/60 text-foreground"
                      : "text-muted hover:bg-silver-soft/40 hover:text-foreground"
                  }`}
                >
                  <Flag locale={loc} />
                  <span className="flex-1 text-left">{LANGS[loc].label}</span>
                  {active && <Check />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function Check() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
      className="text-accent"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/** Small rounded SVG flags — render reliably across platforms (unlike emoji). */
function Flag({ locale }: { locale: string }) {
  const cls = "h-[14px] w-5 shrink-0 overflow-hidden rounded-[2px] ring-1 ring-black/5";
  if (locale === "de") {
    return (
      <svg viewBox="0 0 20 14" className={cls} aria-hidden="true">
        <rect width="20" height="14" fill="#000" />
        <rect y="4.67" width="20" height="4.67" fill="#DD0000" />
        <rect y="9.33" width="20" height="4.67" fill="#FFCE00" />
      </svg>
    );
  }
  if (locale === "vi") {
    return (
      <svg viewBox="0 0 20 14" className={cls} aria-hidden="true">
        <rect width="20" height="14" fill="#DA251D" />
        <path
          d="M10,3 L10.94,5.71 L13.80,5.76 L11.52,7.49 L12.35,10.24 L10,8.6 L7.65,10.24 L8.48,7.49 L6.20,5.76 L9.06,5.71 Z"
          fill="#FFFF00"
        />
      </svg>
    );
  }
  // en → Union Jack (simplified)
  return (
    <svg viewBox="0 0 20 14" className={cls} aria-hidden="true">
      <rect width="20" height="14" fill="#012169" />
      <path d="M0,0 20,14 M20,0 0,14" stroke="#fff" strokeWidth="2.8" />
      <path d="M0,0 20,14 M20,0 0,14" stroke="#C8102E" strokeWidth="1.4" />
      <path d="M10,0 V14 M0,7 H20" stroke="#fff" strokeWidth="4" />
      <path d="M10,0 V14 M0,7 H20" stroke="#C8102E" strokeWidth="2.4" />
    </svg>
  );
}

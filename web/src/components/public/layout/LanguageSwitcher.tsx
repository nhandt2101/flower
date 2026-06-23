"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LABELS: Record<string, string> = {
  de: "DE",
  en: "EN",
  vi: "VI",
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchTo = (loc: string) => {
    if (loc === locale) return;
    startTransition(() => {
      // scroll: false keeps the reader where they are on the page.
      router.replace(pathname, { locale: loc, scroll: false });
    });
  };

  return (
    <div
      role="group"
      aria-label="Language"
      data-pending={isPending ? "" : undefined}
      className="relative inline-flex items-center rounded-full border border-silver-soft bg-surface/60 p-0.5 backdrop-blur transition-opacity data-[pending]:opacity-60"
    >
      {routing.locales.map((loc) => {
        const active = loc === locale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            aria-current={active ? "true" : undefined}
            className={`relative rounded-full px-2.5 py-1 text-[0.7rem] font-medium tracking-[0.12em] transition-colors ${
              active
                ? "bg-foreground text-background"
                : "text-muted hover:text-foreground"
            }`}
          >
            {LABELS[loc]}
          </button>
        );
      })}
    </div>
  );
}

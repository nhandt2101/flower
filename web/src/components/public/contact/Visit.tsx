"use client";

import { useTranslations } from "next-intl";
import { useShopSettings } from "@/hooks/useShopSettings";
import { Reveal } from "../ui/Reveal";
import { MapEmbed } from "./MapEmbed";

export function Visit() {
  const t = useTranslations("visit");
  const settings = useShopSettings({
    storeName: "Tường Vi Flower",
    phone: t("hotline"),
    address: t("address"),
    googleMapsUrl: "https://www.google.com/maps",
    openingHours: t("hours"),
    locale: "vi",
  });

  return (
    <section
      id="visit"
      className="border-t border-silver-soft bg-surface scroll-mt-20"
    >
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="grid gap-12 md:grid-cols-2 md:gap-16">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">
              {t("eyebrow")}
            </p>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
              {t("title")}
            </h2>

            <dl className="mt-8 space-y-6 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.15em] text-muted">
                  {t("addressLabel")}
                </dt>
                <dd className="mt-1 text-base text-foreground">
                  {settings.address}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.15em] text-muted">
                  {t("hotlineLabel")}
                </dt>
                <dd className="mt-1 whitespace-pre-line text-base text-foreground">
                  {settings.phone}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.15em] text-muted">
                  {t("hoursLabel")}
                </dt>
                <dd className="mt-1 whitespace-pre-line text-base text-foreground">
                  {settings.openingHours}
                </dd>
              </div>
            </dl>

            <a
              href={settings.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-sm bg-foreground px-7 py-3 text-sm tracking-wide text-background transition-colors hover:bg-accent-hover"
            >
              {t("cta")}
            </a>
          </Reveal>

          <Reveal delay={120}>
            <MapEmbed query={settings.address} title={t("mapLabel")} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useTranslations } from "next-intl";
import { useShopSettings } from "@/hooks/useShopSettings";
import { Reveal } from "@/components/public/ui/Reveal";
import { MapEmbed } from "./MapEmbed";

export function ContactDetails() {
  const t = useTranslations("contactPage");
  const settings = useShopSettings({
    storeName: "Tường Vi Flower",
    phone: t("hotline"),
    address: t("address"),
    googleMapsUrl: "https://www.google.com/maps",
    openingHours: t("hours"),
    locale: "vi",
  });

  return (
    <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-16">
      <Reveal>
        <dl className="space-y-8">
          <Detail label={t("addressLabel")} value={settings.address} />
          <Detail label={t("hotlineLabel")} value={settings.phone} />
          <Detail label={t("hoursLabel")} value={settings.openingHours} multiline />
        </dl>

        <a
          href={settings.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-10 inline-block rounded-sm bg-foreground px-7 py-3 text-sm tracking-wide text-background transition-colors hover:bg-accent-hover"
        >
          {t("cta")}
        </a>
      </Reveal>

      <Reveal delay={120}>
        <MapEmbed query={settings.address} title={t("mapLabel")} />
      </Reveal>
    </div>
  );
}

function Detail({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.15em] text-muted">{label}</dt>
      <dd
        className={`mt-1.5 text-base text-foreground ${
          multiline ? "whitespace-pre-line" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

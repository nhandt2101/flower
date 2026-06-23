import { useTranslations, useLocale } from "next-intl";
import { Reveal } from "../ui/Reveal";

export function Visit() {
  const t = useTranslations("visit");
  const locale = useLocale();

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
                  {t("address")}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.15em] text-muted">
                  {t("hotlineLabel")}
                </dt>
                <dd className="mt-1 text-base text-foreground">
                  {t("hotline")}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.15em] text-muted">
                  {t("hoursLabel")}
                </dt>
                <dd className="mt-1 whitespace-pre-line text-base text-foreground">
                  {t("hours")}
                </dd>
              </div>
            </dl>

            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-sm bg-foreground px-7 py-3 text-sm tracking-wide text-background transition-colors hover:bg-accent-hover"
            >
              {t("cta")}
            </a>
          </Reveal>

          <Reveal delay={120}>
            {/*
              Keyless Google Maps embed (output=embed). Before launch, replace
              `mapQuery` with the shop's real address, or paste the iframe from
              Google Maps → Share → Embed a map.
            */}
            <div className="rounded-sm bg-surface p-2 ring-1 ring-silver">
              <iframe
                title={t("mapLabel")}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  t("address"),
                )}&hl=${locale}&z=15&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-[4/3] w-full rounded-sm border-0 grayscale-[0.2]"
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

import { useTranslations } from "next-intl";
import { Reveal } from "../ui/Reveal";
import { MapEmbed } from "./MapEmbed";

export function Visit() {
  const t = useTranslations("visit");

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
            <MapEmbed query={t("address")} title={t("mapLabel")} />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

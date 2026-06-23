import { useTranslations } from "next-intl";
import { Reveal } from "../ui/Reveal";
import { ImageFrame } from "../ui/ImageFrame";

export function About() {
  const t = useTranslations("about");

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
        <Reveal className="md:order-2">
          <ImageFrame label={t("imageLabel")} aspect="aspect-[4/3]" />
        </Reveal>

        <Reveal delay={120} className="md:order-1">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
            {t("title")}
          </h2>
          <p className="mt-6 text-base leading-relaxed text-muted">
            {t("body")}
          </p>

          <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-silver-soft pt-6 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted">
                {t("addressLabel")}
              </dt>
              <dd className="mt-1 text-foreground">{t("address")}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted">
                {t("hotlineLabel")}
              </dt>
              <dd className="mt-1 text-foreground">{t("hotline")}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-[0.15em] text-muted">
                {t("hoursLabel")}
              </dt>
              <dd className="mt-1 text-foreground">{t("hours")}</dd>
            </div>
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

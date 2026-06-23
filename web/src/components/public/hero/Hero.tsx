import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ImageFrame } from "../ui/ImageFrame";

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section className="mx-auto max-w-6xl px-6 pt-36 pb-20 md:pt-44 md:pb-28">
      <div className="grid items-center gap-12 md:grid-cols-[1fr_1.25fr] md:gap-16">
        <div className="reveal is-visible">
          <p className="mb-5 text-xs uppercase tracking-[0.25em] text-accent">
            {t("eyebrow")}
          </p>
          <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl md:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted">
            {t("subtitle")}
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <Link
              href="/gallery"
              className="rounded-sm bg-foreground px-7 py-3 text-sm tracking-wide text-background transition-colors hover:bg-accent-hover"
            >
              {t("ctaPrimary")}
            </Link>
            <a
              href="#visit"
              className="text-sm tracking-wide text-foreground transition-colors hover:text-accent"
            >
              {t("ctaSecondary")} →
            </a>
          </div>
        </div>

        <div className="reveal is-visible" style={{ transitionDelay: "150ms" }}>
          <ImageFrame label={t("imageLabel")} aspect="aspect-[3/2]" />
        </div>
      </div>
    </section>
  );
}

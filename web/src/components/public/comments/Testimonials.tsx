import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Reveal } from "../ui/Reveal";

const KEYS = ["a", "b", "c"] as const;

export function Testimonials() {
  const t = useTranslations("testimonials");

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      <Reveal>
        <p className="text-xs uppercase tracking-[0.25em] text-accent">
          {t("eyebrow")}
        </p>
        <h2 className="mt-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
          {t("title")}
        </h2>
      </Reveal>

      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {KEYS.map((key, i) => (
          <Reveal key={key} delay={i * 120}>
            <figure className="rounded-sm border border-silver-soft bg-surface p-7">
              <blockquote className="font-serif text-lg leading-relaxed text-foreground">
                “{t(`items.${key}.quote`)}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-silver-soft text-xs font-medium text-muted">
                  {t(`items.${key}.name`).charAt(0)}
                </span>
                <span className="text-sm text-foreground">
                  {t(`items.${key}.name`)}
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-12 text-right">
        <Link
          href="/comments"
          className="text-sm tracking-wide text-foreground transition-colors hover:text-accent"
        >
          {t("cta")} →
        </Link>
      </Reveal>
    </section>
  );
}

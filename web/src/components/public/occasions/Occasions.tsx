import { useTranslations } from "next-intl";
import { Reveal } from "../ui/Reveal";
import { ImageFrame } from "../ui/ImageFrame";

const KEYS = ["wedding", "birthday", "funeral"] as const;

export function Occasions() {
  const t = useTranslations("occasions");

  return (
    <section className="border-t border-silver-soft bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.25em] text-accent">
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 max-w-xl font-serif text-3xl leading-tight text-foreground md:text-4xl">
            {t("title")}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {KEYS.map((key, i) => (
            <Reveal key={key} delay={i * 120}>
              <article>
                <ImageFrame label={t(`items.${key}.label`)} hover />
                <h3 className="mt-5 font-serif text-2xl text-foreground">
                  {t(`items.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {t(`items.${key}.description`)}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

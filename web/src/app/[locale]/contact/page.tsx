import { useTranslations } from "next-intl";
import { PageShell } from "@/components/public/ui/PageShell";
import { PageIntro } from "@/components/public/ui/PageIntro";
import { Reveal } from "@/components/public/ui/Reveal";
import { MapEmbed } from "@/components/public/contact/MapEmbed";

export default function ContactPage() {
  const t = useTranslations("contactPage");

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <PageIntro
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="mt-14 grid gap-12 md:grid-cols-2 md:gap-16">
          <Reveal>
            <dl className="space-y-8">
              <Detail label={t("addressLabel")} value={t("address")} />
              <Detail label={t("hotlineLabel")} value={t("hotline")} />
              <Detail label={t("hoursLabel")} value={t("hours")} multiline />
            </dl>

            <a
              href="https://www.google.com/maps"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-block rounded-sm bg-foreground px-7 py-3 text-sm tracking-wide text-background transition-colors hover:bg-accent-hover"
            >
              {t("cta")}
            </a>
          </Reveal>

          <Reveal delay={120}>
            <MapEmbed query={t("address")} title={t("mapLabel")} />
          </Reveal>
        </div>
      </section>
    </PageShell>
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

import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ContactDetails } from "@/components/public/contact/ContactDetails";
import { PageIntro } from "@/components/public/ui/PageIntro";
import { PageShell } from "@/components/public/ui/PageShell";
import { buildAlternates } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("contact.title"),
    description: t("contact.description"),
    alternates: buildAlternates(locale, "/contact"),
  };
}

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
        <ContactDetails />
      </section>
    </PageShell>
  );
}

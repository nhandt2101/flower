import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PageShell } from "@/components/public/ui/PageShell";
import { PageIntro } from "@/components/public/ui/PageIntro";
import { GalleryGrid } from "@/components/public/gallery/GalleryGrid";
import { buildAlternates } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("gallery.title"),
    description: t("gallery.description"),
    alternates: buildAlternates(locale, "/gallery"),
  };
}

export default function GalleryPage() {
  const t = useTranslations("galleryPage");

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <PageIntro
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />
        <div className="mt-14">
          <GalleryGrid />
        </div>
      </section>
    </PageShell>
  );
}

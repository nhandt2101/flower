import { useTranslations } from "next-intl";
import { PageShell } from "@/components/public/ui/PageShell";
import { PageIntro } from "@/components/public/ui/PageIntro";
import { GalleryGrid } from "@/components/public/gallery/GalleryGrid";

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

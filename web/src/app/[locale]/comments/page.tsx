import { useTranslations } from "next-intl";
import { PageShell } from "@/components/public/ui/PageShell";
import { PageIntro } from "@/components/public/ui/PageIntro";
import { CommentList } from "@/components/public/comments/CommentList";
import { CommentForm } from "@/components/public/comments/CommentForm";

export default function CommentsPage() {
  const t = useTranslations("commentsPage");

  return (
    <PageShell>
      <section className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <PageIntro
          eyebrow={t("eyebrow")}
          title={t("title")}
          subtitle={t("subtitle")}
        />

        <div className="mt-14 grid gap-12 md:grid-cols-[1.3fr_1fr] md:gap-16">
          <div>
            <CommentList />
          </div>
          <aside className="md:sticky md:top-28 md:self-start">
            <h2 className="mb-5 font-serif text-2xl text-foreground">
              {t("formHeading")}
            </h2>
            <CommentForm />
          </aside>
        </div>
      </section>
    </PageShell>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { listComments } from "@/lib/api/comments";
import type { Cursor, PublicComment } from "@/lib/api/types";
import { Reveal } from "../ui/Reveal";

const PAGE_SIZE = 6;

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(date);
}

export function CommentList() {
  const t = useTranslations("commentsPage.list");
  const locale = useLocale();
  const [items, setItems] = useState<PublicComment[]>([]);
  const [cursor, setCursor] = useState<Cursor>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (nextCursor?: string) => {
    if (nextCursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const data = await listComments({ cursor: nextCursor, limit: PAGE_SIZE });
      setItems((current) => (nextCursor ? [...current, ...data.items] : data.items));
      setCursor(data.nextCursor);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load comments.");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => loadPage());
  }, [loadPage]);

  return (
    <div>
      <p className="mb-8 text-sm text-muted">
        {loading ? t("loading") : t("count", { count: items.length })}
      </p>

      {error ? <p className="mb-8 rounded-sm bg-rose-100 px-4 py-3 text-sm text-rose-700">{error}</p> : null}

      <div className="space-y-8">
        {items.map((comment, i) => (
          <Reveal key={comment.id} delay={(i % PAGE_SIZE) * 80}>
            <article className="border-b border-silver-soft pb-8">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-silver-soft text-xs font-medium text-muted">
                  {comment.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{comment.name}</p>
                  <p className="text-xs text-muted">{formatDate(comment.createdAt, locale)}</p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                {comment.content}
              </p>

              {comment.reply ? (
                <div className="mt-4 border-l-2 border-accent/40 pl-4">
                  <p className="text-xs uppercase tracking-[0.15em] text-accent">
                    {t("shopReply")}
                  </p>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">
                    {comment.reply.content}
                  </p>
                </div>
              ) : null}
            </article>
          </Reveal>
        ))}
      </div>

      {cursor ? (
        <button
          type="button"
          onClick={() => void loadPage(cursor)}
          disabled={loadingMore}
          className="mt-10 w-full rounded-sm border border-silver px-7 py-3 text-sm tracking-wide text-foreground transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
        >
          {loadingMore ? t("loading") : t("loadMore", { count: PAGE_SIZE })}
        </button>
      ) : null}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { listComments } from "@/lib/api/comments";
import type { PublicComment } from "@/lib/api/types";
import { Reveal } from "../ui/Reveal";

const SAMPLE = ["a", "b", "c", "d", "e", "f"] as const;
const PAGE_SIZE = 3;

export function CommentList() {
  const t = useTranslations("commentsPage.list");
  const locale = useLocale();
  const [items, setItems] = useState<PublicComment[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    listComments({ limit: PAGE_SIZE })
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setNextCursor(page.nextCursor);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
        setNextCursor(null);
        setFailed(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadMore = async () => {
    if (!nextCursor) return;
    setLoadingMore(true);
    try {
      const page = await listComments({ cursor: nextCursor, limit: PAGE_SIZE });
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      setLoadingMore(false);
    }
  };

  const shown = failed && items.length === 0 ? SAMPLE : items;
  const count = failed && items.length === 0 ? SAMPLE.length : items.length;
  const remaining = failed && items.length === 0 ? 0 : nextCursor ? PAGE_SIZE : 0;

  return (
    <div>
      <p className="mb-8 text-sm text-muted">
        {loading ? t("loading") : t("count", { count })}
      </p>

      <div className="space-y-8">
        {shown.map((item, i) => {
          let key: string;
          let name: string;
          let content: string;
          let date: string;
          let reply: string | undefined;

          if (typeof item === "string") {
            key = item;
            name = t(`items.${item}.name`);
            content = t(`items.${item}.text`);
            date = t(`items.${item}.date`);
            reply = t(`items.${item}.reply`);
          } else {
            key = item.id;
            name = item.name;
            content = item.content;
            date = formatDate(item.createdAt, locale);
            reply = item.reply?.content;
          }

          return (
            <Reveal key={key} delay={(i % PAGE_SIZE) * 80}>
              <article className="border-b border-silver-soft pb-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-silver-soft text-xs font-medium text-muted">
                    {name.charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {name}
                    </p>
                    <p className="text-xs text-muted">
                      {date}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                  {content}
                </p>

                {reply ? (
                  <div className="mt-4 border-l-2 border-accent/40 pl-4">
                    <p className="text-xs uppercase tracking-[0.15em] text-accent">
                      {t("shopReply")}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">
                      {reply}
                    </p>
                  </div>
                ) : null}
              </article>
            </Reveal>
          );
        })}
      </div>

      {remaining > 0 && (
        <button
          type="button"
          onClick={() => void loadMore()}
          disabled={loadingMore}
          className="mt-10 w-full rounded-sm border border-silver px-7 py-3 text-sm tracking-wide text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          {loadingMore ? t("loading") : t("loadMore", { count: PAGE_SIZE })}
        </button>
      )}
    </div>
  );
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(date);
}

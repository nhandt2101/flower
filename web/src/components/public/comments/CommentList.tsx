"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Reveal } from "../ui/Reveal";

// Placeholder comments. Real data will come from DynamoDB via the API, which
// should return pages — swap `SAMPLE`/`visible` for a fetch + cursor later.
const SAMPLE = ["a", "b", "c", "d", "e", "f"] as const;
const PAGE_SIZE = 3;

export function CommentList() {
  const t = useTranslations("commentsPage.list");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const shown = SAMPLE.slice(0, visible);
  const remaining = SAMPLE.length - visible;

  return (
    <div>
      <p className="mb-8 text-sm text-muted">
        {t("count", { count: SAMPLE.length })}
      </p>

      <div className="space-y-8">
        {shown.map((key, i) => {
          const reply = t(`items.${key}.reply`);
          return (
            <Reveal key={key} delay={(i % PAGE_SIZE) * 80}>
              <article className="border-b border-silver-soft pb-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-silver-soft text-xs font-medium text-muted">
                    {t(`items.${key}.name`).charAt(0)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t(`items.${key}.name`)}
                    </p>
                    <p className="text-xs text-muted">
                      {t(`items.${key}.date`)}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-foreground/90">
                  {t(`items.${key}.text`)}
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
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="mt-10 w-full rounded-sm border border-silver px-7 py-3 text-sm tracking-wide text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          {t("loadMore", { count: Math.min(remaining, PAGE_SIZE) })}
        </button>
      )}
    </div>
  );
}

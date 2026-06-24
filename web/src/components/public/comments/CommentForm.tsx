"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type Status = "idle" | "submitting" | "done";

export function CommentForm() {
  const t = useTranslations("commentsPage.form");
  const [status, setStatus] = useState<Status>("idle");

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: POST to Lambda (verify CAPTCHA → write to DynamoDB).
    // For now this is a front-end-only placeholder.
    setStatus("submitting");
    setTimeout(() => setStatus("done"), 600);
  };

  if (status === "done") {
    return (
      <div className="rounded-sm border border-silver-soft bg-surface p-8 text-center">
        <p className="font-serif text-2xl text-foreground">{t("thanksTitle")}</p>
        <p className="mt-2 text-sm text-muted">{t("thanksBody")}</p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-sm tracking-wide text-foreground hover:text-accent"
        >
          {t("again")} →
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-sm border border-silver-soft bg-surface p-7 md:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("name")} htmlFor="c-name">
          <input
            id="c-name"
            name="name"
            type="text"
            required
            className="input"
          />
        </Field>
        <Field label={t("email")} htmlFor="c-email" hint={t("emailHint")}>
          <input
            id="c-email"
            name="email"
            type="email"
            required
            className="input"
          />
        </Field>
      </div>

      <div className="mt-5">
        <Field label={t("message")} htmlFor="c-message">
          <textarea
            id="c-message"
            name="message"
            rows={4}
            required
            className="input resize-none"
          />
        </Field>
      </div>

      {/* CAPTCHA placeholder — wire to hCaptcha/Turnstile, verified by Lambda. */}
      <div className="mt-5 flex h-16 items-center justify-center rounded-sm border border-dashed border-silver text-xs uppercase tracking-[0.18em] text-muted">
        {t("captcha")}
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-6 rounded-sm bg-foreground px-7 py-3 text-sm tracking-wide text-background transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>

      <style>{`
        .input {
          width: 100%;
          border: 1px solid var(--silver);
          border-radius: 2px;
          background: var(--background);
          padding: 0.6rem 0.8rem;
          font-size: 0.9rem;
          color: var(--foreground);
          outline: none;
          transition: border-color 0.2s ease;
        }
        .input:focus { border-color: var(--accent); }
      `}</style>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block">
      <span className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-muted">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

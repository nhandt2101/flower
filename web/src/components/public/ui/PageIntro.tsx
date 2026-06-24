import { Reveal } from "./Reveal";

type PageIntroProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
};

/** Eyebrow + serif title + optional subtitle, used at the top of sub-pages. */
export function PageIntro({ eyebrow, title, subtitle }: PageIntroProps) {
  return (
    <Reveal>
      <p className="text-xs uppercase tracking-[0.25em] text-accent">
        {eyebrow}
      </p>
      <h1 className="mt-4 font-serif text-4xl leading-tight text-foreground md:text-5xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted">
          {subtitle}
        </p>
      ) : null}
    </Reveal>
  );
}

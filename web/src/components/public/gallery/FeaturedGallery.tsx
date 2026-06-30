"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { listImages } from "@/lib/api/images";
import type { GalleryImage } from "@/lib/api/types";
import { GalleryPhoto } from "./GalleryPhoto";
import { Reveal } from "../ui/Reveal";

const FEATURED_SLOTS = [0, 1, 2] as const;
const FEATURED_FRAME_CLASS =
  "transition duration-500 ease-out shadow-[0_16px_45px_rgba(43,42,40,0.08)] hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(43,42,40,0.12)]";

export function FeaturedGallery() {
  const t = useTranslations("featured");
  const [images, setImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    listImages({ landingSlot: "featured", limit: 3 }, controller.signal)
      .then(async (data) => {
        if (data.items.length > 0) {
          setImages(data.items);
          return;
        }
        const fallback = await listImages({ limit: 3 }, controller.signal);
        setImages(fallback.items);
      })
      .catch(() => {
        setImages([]);
      });

    return () => controller.abort();
  }, []);

  return (
    <section className="border-t border-silver-soft bg-surface">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.25em] text-accent">
            {t("eyebrow")}
          </p>
          <h2 className="mt-4 font-serif text-3xl leading-tight text-foreground md:text-4xl">
            {t("title")}
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {FEATURED_SLOTS.map((i) => (
            <Reveal key={i} delay={i * 120}>
              <GalleryPhoto
                image={images[i]}
                label={t("imageLabel")}
                aspect="aspect-[4/3]"
                index={i}
                className={FEATURED_FRAME_CLASS}
                useNaturalAspect={false}
              />
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12">
          <Link
            href="/gallery"
            className="inline-block rounded-sm border border-silver px-7 py-3 text-sm tracking-wide text-foreground transition-colors hover:border-accent hover:text-accent"
          >
            {t("cta")}
          </Link>
        </Reveal>
      </div>
    </section>
  );
}

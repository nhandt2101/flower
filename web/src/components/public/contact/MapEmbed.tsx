import { useLocale } from "next-intl";

/**
 * Keyless Google Maps embed (output=embed), framed in the site's silver motif.
 * `hl` follows the active locale. Before launch, replace `query` with the
 * shop's real address or paste the iframe from Google Maps → Share → Embed.
 */
export function MapEmbed({ query, title }: { query: string; title: string }) {
  const locale = useLocale();

  return (
    <div className="rounded-sm bg-surface p-2 ring-1 ring-silver">
      <iframe
        title={title}
        src={`https://maps.google.com/maps?q=${encodeURIComponent(
          query,
        )}&hl=${locale}&z=15&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="aspect-[4/3] w-full rounded-sm border-0 grayscale-[0.2]"
      />
    </div>
  );
}

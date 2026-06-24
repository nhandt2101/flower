import { routing } from "@/i18n/routing";

/** Public site URL. Set NEXT_PUBLIC_SITE_URL in the environment before launch. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

/**
 * Builds canonical + hreflang alternates for a given page path (no locale
 * prefix, e.g. "/gallery"). Pass "" for the homepage.
 */
export function buildAlternates(locale: string, path = "") {
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `/${l}${path}`;
  }
  languages["x-default"] = `/${routing.defaultLocale}${path}`;
  return { canonical: `/${locale}${path}`, languages };
}

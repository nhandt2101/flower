import { routing } from "@/i18n/routing";

/** Public site URL. Can be overridden with NEXT_PUBLIC_SITE_URL per environment. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.blumenngoclan.com";

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

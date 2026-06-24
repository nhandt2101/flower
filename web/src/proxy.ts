import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export const proxy = createMiddleware(routing);

export const config = {
  // Skip admin, Next internals, and anything with a file extension
  // (sitemap.xml, robots.txt, icon.svg, fonts, …) so they aren't
  // redirected to a locale.
  matcher: ["/((?!admin|_next|_vercel|.*\\..*).*)"],
};

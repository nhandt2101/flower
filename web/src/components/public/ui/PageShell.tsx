import { Header } from "../layout/Header";
import { Footer } from "../layout/Footer";

/**
 * Wraps a public sub-page with the shared header and footer. The top padding
 * clears the fixed header so content never sits underneath it.
 */
export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="pt-28 md:pt-32">{children}</main>
      <Footer />
    </>
  );
}

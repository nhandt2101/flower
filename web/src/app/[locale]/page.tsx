import type { Metadata } from "next";
import { Header } from "@/components/public/layout/Header";
import { Footer } from "@/components/public/layout/Footer";
import { Hero } from "@/components/public/hero/Hero";
import { Occasions } from "@/components/public/occasions/Occasions";
import { About } from "@/components/public/about/About";
import { FeaturedGallery } from "@/components/public/gallery/FeaturedGallery";
import { Testimonials } from "@/components/public/comments/Testimonials";
import { Visit } from "@/components/public/contact/Visit";
import { buildAlternates } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { alternates: buildAlternates(locale) };
}

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Occasions />
        <About />
        <FeaturedGallery />
        <Testimonials />
        <Visit />
      </main>
      <Footer />
    </>
  );
}

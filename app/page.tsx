import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
import { ProductGrid } from "@/components/ProductGrid";

// Configuración de la API
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://46.202.88.177:8010";
const PLACEHOLDER_IMG = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

interface PageData {
  data: {
    meta: {
      description: string;
      keywords: boolean | string;
      title: string;
    };
    product_grid: {
      items: Array<any>;
      title: string;
    };
    sections: Array<{
      content: {
        background_text?: string;
        badge?: { icon: string; text: string };
        cta: { href: string; sub_text?: string; text: string };
        description: string;
        image: { alt: string; src: string; show_badge?: boolean };
        subtitle: string;
        title: { highlight: string; normal: string };
      };
      id: string;
      layout: "image_left" | "image_right";
      type: "hero" | "feature" | "brand_story";
    }>;
  };
}

async function getPageData(): Promise<PageData | null> {
  try {
    const res = await fetch(`${API_URL}/api/v1/page?url=/`, {
      next: { revalidate: 60 }, 
    });

    if (!res.ok) {
      console.error("Error fetching page data:", res.statusText);
      return null;
    }

    return res.json();
  } catch (error) {
    console.error("Network error fetching page data:", error);
    return null;
  }
}

export default async function Home() {
  const pageData = await getPageData();

  if (!pageData || !pageData.data) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
        <p className="text-[#6C7466]">Temporarily unavailable. Please try again later.</p>
      </main>
    );
  }

  const { sections } = pageData.data;
  const heroSection = sections.find((s) => s.type === "hero");
  const featureSection = sections.find((s) => s.type === "feature");
  const brandSection = sections.find((s) => s.type === "brand_story");

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] selection:bg-[#6C7466] selection:text-white">
      <div className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6 overflow-hidden">
        {/* Global Atmosphere */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
          }}
        />
        <div className="hidden lg:block absolute top-0 left-1/4 w-px h-full bg-[#6C7466]/10 z-0" />
        <div className="hidden lg:block absolute top-0 right-1/4 w-px h-full bg-[#6C7466]/10 z-0" />

        <div className="container mx-auto max-w-7xl relative z-10 space-y-32 md:space-y-48">
          
          {/* HERO SECTION */}
          {heroSection && (
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              <div className="order-2 lg:order-1 lg:col-span-7 relative group">
                {heroSection.content.background_text && (
                  <div className="absolute -top-12 -left-12 text-[8rem] md:text-[10rem] font-serif font-bold text-[#6C7466]/5 select-none pointer-events-none z-0 leading-none">
                    {heroSection.content.background_text}
                  </div>
                )}

                <div className="relative aspect-[4/5] md:aspect-[16/10] w-full overflow-hidden bg-[#EBEBE8] rounded-sm shadow-sm z-10">
                  <Image
                    src={heroSection.content.image.src || PLACEHOLDER_IMG}
                    alt={heroSection.content.image.alt || "Hero Image"}
                    fill
                    className="object-cover transition-transform duration-[2s] ease-in-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 60vw"
                    priority
                    unoptimized={true} /* <--- ESTO SOLUCIONA EL ERROR 400 */
                  />
                  <div className="absolute inset-0 bg-[#6C7466]/10 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                  {heroSection.content.badge && (
                    <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                      <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#6C7466]">
                        <Star className="w-3 h-3 fill-[#6C7466]" />
                        {heroSection.content.badge.text}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="order-1 lg:order-2 lg:col-span-5 lg:pl-12 flex flex-col justify-center text-center lg:text-left">
                {/* ... contenido del hero ... */}
                <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                  <span className="h-px w-6 bg-[#6C7466]"></span>
                  <p className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/80 uppercase">
                    {heroSection.content.subtitle}
                  </p>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] leading-[0.9] tracking-tight mb-8">
                  {heroSection.content.title.normal} <br />
                  <span className="italic font-light text-[#2B2B2B] opacity-80">
                    {heroSection.content.title.highlight}
                  </span>
                </h1>
                <p className="text-base md:text-lg text-gray-500 font-light leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
                  {heroSection.content.description}
                </p>
                <div className="flex justify-center lg:justify-start">
                  <Link
                    href={heroSection.content.cta.href || "#"}
                    className="group relative inline-flex items-center gap-4"
                  >
                    <div className="w-12 h-12 rounded-full border border-[#6C7466]/30 flex items-center justify-center group-hover:bg-[#6C7466] group-hover:border-[#6C7466] transition-all duration-300">
                      <ArrowRight className="w-5 h-5 text-[#6C7466] group-hover:text-white transition-colors" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#2B2B2B] group-hover:text-[#6C7466] transition-colors">
                        {heroSection.content.cta.text}
                      </span>
                      {heroSection.content.cta.sub_text && (
                        <span className="text-[10px] text-gray-400 font-light tracking-wide group-hover:translate-x-1 transition-transform duration-300">
                          {heroSection.content.cta.sub_text}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* FEATURE SECTION */}
          {featureSection && (
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-center">
              <div className="order-1 lg:col-span-5 lg:text-right flex flex-col items-center lg:items-end">
                {/* ... contenido del feature ... */}
                <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/60 uppercase mb-6 flex items-center gap-4">
                  {featureSection.content.subtitle}{" "}
                  <span className="w-8 h-px bg-[#6C7466]/40"></span>
                </span>
                <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] leading-[0.95] mb-8 text-center lg:text-right">
                  {featureSection.content.title.normal} <br />
                  <span className="italic font-light text-[#2B2B2B]">
                    {featureSection.content.title.highlight}
                  </span>
                </h2>
                <p className="text-lg text-gray-500 font-light leading-relaxed mb-10 max-w-md text-center lg:text-right">
                  {featureSection.content.description}
                </p>
                <Link
                  href={featureSection.content.cta.href || "#"}
                  className="group flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase text-[#2B2B2B] hover:text-[#6C7466] transition-colors"
                >
                  <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </span>
                  <span>{featureSection.content.cta.text}</span>
                </Link>
              </div>

              <div className="order-2 lg:col-span-6 lg:col-start-7 relative group">
                <div className="absolute inset-0 border border-[#6C7466] opacity-20 rounded-sm translate-x-4 translate-y-4 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2" />
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EBEBE8] rounded-sm shadow-sm">
                  <Image
                    src={featureSection.content.image.src || PLACEHOLDER_IMG}
                    alt={featureSection.content.image.alt || "Feature Image"}
                    fill
                    className="object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized={true} /* <--- ESTO SOLUCIONA EL ERROR 400 */
                  />
                  <div className="absolute inset-0 bg-[#6C7466]/5 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
                </div>
              </div>
            </div>
          )}

          {/* BRAND STORY SECTION */}
          {brandSection && (
            <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-center">
              <div className="order-2 lg:order-1 lg:col-span-5 relative group">
                <div className="absolute inset-0 border border-[#6C7466] opacity-20 rounded-sm -translate-x-4 translate-y-4 transition-transform duration-500 group-hover:-translate-x-2 group-hover:translate-y-2" />
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EBEBE8] rounded-sm shadow-sm">
                  <Image
                    src={brandSection.content.image.src || PLACEHOLDER_IMG}
                    alt={brandSection.content.image.alt || "Brand Image"}
                    fill
                    className="object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized={true} /* <--- ESTO SOLUCIONA EL ERROR 400 */
                  />
                  <div className="absolute inset-0 bg-[#6C7466]/5 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
                  {brandSection.content.image.show_badge && (
                    <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-full shadow-xl animate-spin-slow-reverse hidden md:block z-10">
                      <div className="border border-[#6C7466]/20 rounded-full p-2">
                        <Star className="w-6 h-6 text-[#6C7466]" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="order-1 lg:order-2 lg:col-span-6 lg:col-start-7 flex flex-col items-center lg:items-start text-center lg:text-left">
                {/* ... contenido del brand ... */}
                <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/60 uppercase mb-6 flex items-center gap-4">
                  <span className="w-8 h-px bg-[#6C7466]/40"></span>{" "}
                  {brandSection.content.subtitle}
                </span>
                <h2 className="text-5xl md:text-7xl font-serif text-[#6C7466] leading-[0.9] mb-8">
                  {brandSection.content.title.normal} <br />
                  <span className="italic font-light opacity-80 text-[#2B2B2B]">
                    {brandSection.content.title.highlight}
                  </span>
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed font-light mb-10 max-w-md">
                  {brandSection.content.description}
                </p>
                <Link
                  href={brandSection.content.cta.href || "#"}
                  className="group flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase text-[#2B2B2B] hover:text-[#6C7466] transition-colors"
                >
                  <span>{brandSection.content.cta.text}</span>
                  <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PRODUCT GRID */}
      <Suspense fallback={<div className="h-96 flex items-center justify-center text-[#6C7466]">Loading Treasures...</div>}>
        <ProductGrid />
      </Suspense>
    </main>
  );
}
import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";
import { ProductGrid } from "@/components/ProductGrid";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] selection:bg-[#6C7466] selection:text-white">

      {/* =====================================================================================
          MASTER CONTAINER: Envuelve las 3 secciones (Hero, Feature, Brand)
          Esto garantiza que el fondo y las líneas verticales sean continuos sin cortes.
         ===================================================================================== */}
      <div className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6 overflow-hidden">

        {/* 1. GLOBAL ATMOSPHERE: Ruido y Líneas Arquitectónicas compartidas */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
        />
        {/* Líneas verticales que atraviesan TODAS las secciones */}
        <div className="hidden lg:block absolute top-0 left-1/4 w-px h-full bg-[#6C7466]/10 z-0" />
        <div className="hidden lg:block absolute top-0 right-1/4 w-px h-full bg-[#6C7466]/10 z-0" />


        <div className="container mx-auto max-w-7xl relative z-10 space-y-32 md:space-y-48">

          {/* =========================================================================
              BLOCK 1: HERO SECTION (Image Left / Text Right)
             ========================================================================= */}
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Visual Column */}
            <div className="order-2 lg:order-1 lg:col-span-7 relative group">
              {/* Decorative Big Text behind */}
              <div className="absolute -top-12 -left-12 text-[8rem] md:text-[10rem] font-serif font-bold text-[#6C7466]/5 select-none pointer-events-none z-0 leading-none">
                JASPER
              </div>

              <div className="relative aspect-[4/5] md:aspect-[16/10] w-full overflow-hidden bg-[#EBEBE8] rounded-sm shadow-sm z-10">
                <Image
                  src="/producto5.png"
                  alt="Polished Landscape Jasper"
                  fill
                  className="object-cover transition-transform duration-[2s] ease-in-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  priority
                />
                <div className="absolute inset-0 bg-[#6C7466]/10 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                {/* Badge */}
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#6C7466]">
                    <Star className="w-3 h-3 fill-[#6C7466]" />
                    New Arrival
                  </span>
                </div>
              </div>
            </div>

            {/* Text Column */}
            <div className="order-1 lg:order-2 lg:col-span-5 lg:pl-12 flex flex-col justify-center text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                <span className="h-px w-6 bg-[#6C7466]"></span>
                <p className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/80 uppercase">
                  The November Edit
                </p>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] leading-[0.9] tracking-tight mb-8">
                Polished <br />
                <span className="italic font-light text-[#2B2B2B] opacity-80">Landscape Jasper.</span>
              </h1>
              <p className="text-base md:text-lg text-gray-500 font-light leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
                Sculpture of polished Landscape Jasper, known for its natural patterns evoking terrestrial landscapes. A study in contrast, light, and modern nature.
              </p>
              <div className="flex justify-center lg:justify-start">
                <Link href="/product/prod-5" className="group relative inline-flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full border border-[#6C7466]/30 flex items-center justify-center group-hover:bg-[#6C7466] group-hover:border-[#6C7466] transition-all duration-300">
                    <ArrowRight className="w-5 h-5 text-[#6C7466] group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#2B2B2B] group-hover:text-[#6C7466] transition-colors">Shop Now</span>
                    <span className="text-[10px] text-gray-400 font-light tracking-wide group-hover:translate-x-1 transition-transform duration-300">Limited Availability</span>
                  </div>
                </Link>
              </div>
            </div>
          </div>

          {/* =========================================================================
              BLOCK 2: FEATURE "Unique Crystals" (Image Right / Text Left) -> REVERSE
             ========================================================================= */}
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-center">

            {/* Text Column (Left due to reverse layout) */}
            <div className="order-1 lg:col-span-5 lg:text-right flex flex-col items-center lg:items-end">
              <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/60 uppercase mb-6 flex items-center gap-4">
                Featured Collection <span className="w-8 h-px bg-[#6C7466]/40"></span>
              </span>
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] leading-[0.95] mb-8 text-center lg:text-right">
                Unique <br /> <span className="italic font-light text-[#2B2B2B]">Crystals</span>
              </h2>
              <p className="text-lg text-gray-500 font-light leading-relaxed mb-10 max-w-md text-center lg:text-right">
                Each piece is a natural masterpiece, formed over millions of years in the depths of the earth. Unrepeatable geometries for the discerning eye.
              </p>
              <Link
                href="/collections/crystal"
                className="group flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase text-[#2B2B2B] hover:text-[#6C7466] transition-colors"
              >
                <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </span>
                <span>Explore Collection</span>
              </Link>
            </div>

            {/* Visual Column (Right) */}
            <div className="order-2 lg:col-span-6 lg:col-start-7 relative group">
              <div className="absolute inset-0 border border-[#6C7466] opacity-20 rounded-sm translate-x-4 translate-y-4 transition-transform duration-500 group-hover:translate-x-2 group-hover:translate-y-2" />
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EBEBE8] rounded-sm shadow-sm">
                <Image
                  src="/producto4.png"
                  alt="Unique Crystal Collection"
                  fill
                  className="object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-[#6C7466]/5 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
              </div>
            </div>
          </div>

          {/* =========================================================================
              BLOCK 3: BRAND STORY (Image Left / Text Right) -> STANDARD
             ========================================================================= */}
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-24 items-center">

            {/* Visual Column (Left) */}
            <div className="order-2 lg:order-1 lg:col-span-5 relative group">
              <div className="absolute inset-0 border border-[#6C7466] opacity-20 rounded-sm -translate-x-4 translate-y-4 transition-transform duration-500 group-hover:-translate-x-2 group-hover:translate-y-2" />
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#EBEBE8] rounded-sm shadow-sm">
                <Image
                  src="/producto3.png"
                  alt="The Brand Philosophy"
                  fill
                  className="object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-[#6C7466]/5 mix-blend-multiply transition-opacity duration-500 group-hover:opacity-0" />
                {/* Star Badge */}
                <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-full shadow-xl animate-spin-slow-reverse hidden md:block z-10">
                  <div className="border border-[#6C7466]/20 rounded-full p-2">
                    <Star className="w-6 h-6 text-[#6C7466]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Text Column (Right) */}
            <div className="order-1 lg:order-2 lg:col-span-6 lg:col-start-7 flex flex-col items-center lg:items-start text-center lg:text-left">
              <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/60 uppercase mb-6 flex items-center gap-4">
                <span className="w-8 h-px bg-[#6C7466]/40"></span> Our Philosophy
              </span>
              <h2 className="text-5xl md:text-7xl font-serif text-[#6C7466] leading-[0.9] mb-8">
                Unearthing <br />
                <span className="italic font-light opacity-80 text-[#2B2B2B]">The Extraordinary.</span>
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed font-light mb-10 max-w-md">
                One of a Kind unveils unique masterpieces of nature that tell millennial stories. Authenticity and meticulous selection for the modern sanctuary.
              </p>
              <Link
                href="/the-brand"
                className="group flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase text-[#2B2B2B] hover:text-[#6C7466] transition-colors"
              >
                <span>Read our story</span>
                <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* =========================================================================
          PRODUCT GRID (Fuera del contenedor narrativo, como sección de cierre)
         ========================================================================= */}
      <Suspense fallback={<div className="h-96 flex items-center justify-center text-[#6C7466]">Loading Treasures...</div>}>
        <ProductGrid />
      </Suspense>

    </main>
  );
}
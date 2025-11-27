import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6 bg-[#FDFBF7] overflow-hidden text-[#2B2B2B]">

      {/* 1. Background Atmosphere (Noise & Lines) */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
      />

      {/* Línea arquitectónica asimétrica */}
      <div className="hidden md:block absolute top-0 right-1/3 w-px h-full bg-[#6C7466]/10 z-0" />

      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* --- COLUMNA IMAGEN (Hero Visual) --- */}
          <div className="order-2 lg:order-1 lg:col-span-7 relative group">

            {/* Texto de fondo decorativo (Parallax Effect simulado) */}
            <div className="absolute -top-12 -left-12 text-[8rem] md:text-[10rem] font-serif font-bold text-[#6C7466]/5 select-none pointer-events-none z-0 leading-none">
              JASPER
            </div>

            {/* Contenedor de Imagen */}
            <div className="relative aspect-[4/5] md:aspect-[16/10] w-full overflow-hidden bg-[#EBEBE8] rounded-sm shadow-sm z-10">
              <Image
                src="/producto5.png"
                alt="Polished Landscape Jasper - Luxury Object"
                fill
                className="object-cover transition-transform duration-[2s] ease-in-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority // Carga prioritaria por ser Hero
              />

              {/* Overlay suave al hover */}
              <div className="absolute inset-0 bg-[#6C7466]/10 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              {/* Badge "New Arrival" */}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm">
                <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-[#6C7466]">
                  <Star className="w-3 h-3 fill-[#6C7466]" />
                  New Arrival
                </span>
              </div>
            </div>
          </div>

          {/* --- COLUMNA TEXTO (Product Story) --- */}
          <div className="order-1 lg:order-2 lg:col-span-5 lg:pl-12 flex flex-col justify-center text-center lg:text-left">

            {/* Pre-header */}
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
              <span className="h-px w-6 bg-[#6C7466]"></span>
              <p className="text-xs font-bold tracking-[0.25em] text-[#6C7466]/80 uppercase">
                The November Edit
              </p>
            </div>

            {/* Title Monumental */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif text-[#6C7466] leading-[0.9] tracking-tight mb-8">
              Polished <br />
              <span className="italic font-light text-[#2B2B2B] opacity-80">Landscape Jasper.</span>
            </h1>

            {/* Description */}
            <p className="text-base md:text-lg text-gray-500 font-light leading-relaxed mb-10 max-w-md mx-auto lg:mx-0">
              Sculpture of polished Landscape Jasper, known for its natural patterns evoking terrestrial landscapes. A study in contrast, light, and modern nature.
            </p>

            {/* CTA High-End */}
            <div className="flex justify-center lg:justify-start">
              <Link href="/product/prod-5" className="group relative inline-flex items-center gap-4">
                {/* Circle Button */}
                <div className="w-12 h-12 rounded-full border border-[#6C7466]/30 flex items-center justify-center group-hover:bg-[#6C7466] group-hover:border-[#6C7466] transition-all duration-300">
                  <ArrowRight className="w-5 h-5 text-[#6C7466] group-hover:text-white transition-colors" />
                </div>

                {/* Text Label */}
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold tracking-[0.2em] uppercase text-[#2B2B2B] group-hover:text-[#6C7466] transition-colors">
                    Shop Now
                  </span>
                  <span className="text-[10px] text-gray-400 font-light tracking-wide group-hover:translate-x-1 transition-transform duration-300">
                    Limited Availability
                  </span>
                </div>
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
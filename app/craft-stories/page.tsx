import React from 'react';
import { Gem, Hammer, ArrowRight, Star } from 'lucide-react';

export default function CraftStoriesPage() {
  return (
    <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] relative overflow-hidden selection:bg-[#6C7466] selection:text-white">

      {/* 1. Background Texture (Noise/Grain) - El secreto del look "High-End" */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
      />

      {/* Grid Lines Decorativas (Arquitectura visual) */}
      <div className="hidden md:block absolute top-0 left-1/4 w-px h-full bg-[#6C7466]/10 z-0" />
      <div className="hidden md:block absolute top-0 right-1/4 w-px h-full bg-[#6C7466]/10 z-0" />

      <div className="container mx-auto px-6 pt-24 pb-32 relative z-10">

        {/* 2. Hero Section: Asimétrico y Dramático */}
        <div className="max-w-7xl mx-auto mb-32">
          <div className="grid md:grid-cols-12 gap-8 items-end">
            <div className="md:col-span-3">
              <span className="flex items-center gap-3 text-xs font-bold tracking-[0.3em] uppercase text-[#6C7466] mb-6 md:mb-12">
                <span className="w-6 h-px bg-[#6C7466]"></span>
                The Process
              </span>
              <Star className="w-8 h-8 text-[#6C7466] animate-spin-slow opacity-80 hidden md:block" />
            </div>
            <div className="md:col-span-9">
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-serif leading-[0.85] text-[#6C7466]">
                From Earth <br />
                <span className="italic font-light opacity-60 ml-12 md:ml-32">to Eternity.</span>
              </h1>
              <p className="mt-12 text-lg md:text-xl text-gray-500 max-w-xl font-light leading-relaxed md:pl-2">
                More than objects, we create legacies. A meticulous journey from the raw chaos of nature to the refined silence of your home.
              </p>
            </div>
          </div>
        </div>

        {/* 3. The Chapters (Stories) - Layout en Zig-Zag Editorial */}
        <div className="max-w-7xl mx-auto space-y-24 md:space-y-40">

          {/* Chapter 01: Raw Selection */}
          <div className="relative grid md:grid-cols-12 gap-12 items-center group">
            {/* Visual Number (Background Depth) */}
            <div className="absolute -top-20 -left-10 md:left-0 text-[12rem] md:text-[15rem] font-serif leading-none text-[#6C7466]/5 select-none pointer-events-none z-0 font-bold">
              01
            </div>

            {/* Content Left */}
            <div className="md:col-span-5 md:col-start-2 relative z-10 pt-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-[#6C7466]/10 rounded-full">
                  <Gem className="w-6 h-6 text-[#6C7466]" />
                </div>
                <span className="text-xs font-bold tracking-[0.2em] text-[#6C7466] uppercase">
                  The Origin
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-serif text-[#2B2B2B] mb-6 leading-tight group-hover:text-[#6C7466] transition-colors duration-500">
                Hand-Selected <br />
                <span className="italic font-light text-gray-400">by Experts</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Every piece is hand-picked by our expert geologists. We don't just seek perfection; we seek character, geological drama, and the singularity that makes a stone impossible to replicate.
              </p>
            </div>

            {/* Decorative Line (Desktop only) */}
            <div className="hidden md:block md:col-span-6 md:col-start-7 border-t border-[#6C7466]/20 relative">
              <div className="absolute -top-[3px] left-0 w-2 h-2 rounded-full bg-[#6C7466]" />
            </div>
          </div>

          {/* Chapter 02: Refinement */}
          <div className="relative grid md:grid-cols-12 gap-12 items-center group">
            {/* Visual Number (Background Depth) - Right Aligned */}
            <div className="absolute -top-20 -right-10 md:right-0 text-[12rem] md:text-[15rem] font-serif leading-none text-[#6C7466]/5 select-none pointer-events-none z-0 font-bold text-right w-full">
              02
            </div>

            {/* Decorative Line (Desktop only) */}
            <div className="hidden md:block md:col-span-6 border-t border-[#6C7466]/20 relative">
              <div className="absolute -top-[3px] right-0 w-2 h-2 rounded-full bg-[#6C7466]" />
            </div>

            {/* Content Right */}
            <div className="md:col-span-5 relative z-10 pt-10">
              <div className="flex items-center gap-4 mb-6 md:justify-end">
                <span className="text-xs font-bold tracking-[0.2em] text-[#6C7466] uppercase order-2 md:order-1">
                  The Craft
                </span>
                <div className="p-3 bg-[#6C7466]/10 rounded-full order-1 md:order-2">
                  <Hammer className="w-6 h-6 text-[#6C7466]" />
                </div>
              </div>

              <h2 className="text-4xl md:text-5xl font-serif text-[#2B2B2B] mb-6 leading-tight md:text-right group-hover:text-[#6C7466] transition-colors duration-500">
                Artisanal <br />
                <span className="italic font-light text-gray-400">Preparation</span>
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed md:text-right">
                A silent dialogue between tool and matter. Our artisans carefully clean and prepare each specimen to highlight its natural geometry without altering its ancient essence.
              </p>
            </div>
          </div>

        </div>

        {/* 4. Minimal Footer / Next Step */}
        <div className="mt-32 flex justify-center">
          <button className="group relative px-8 py-4 bg-transparent overflow-hidden rounded-full">
            <span className="absolute inset-0 w-full h-full bg-[#6C7466]/5 group-hover:bg-[#6C7466] transition-all duration-500 ease-out" />
            <span className="relative flex items-center gap-3 text-[#6C7466] font-bold tracking-[0.15em] text-xs uppercase group-hover:text-white transition-colors">
              Explore the Collection
              <ArrowRight className="w-4 h-4" />
            </span>
          </button>
        </div>

      </div>
    </main>
  );
}
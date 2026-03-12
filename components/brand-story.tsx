import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Star } from 'lucide-react';

export function BrandStory() {
  return (
    <section className="relative py-24 md:py-32 px-6 bg-[#FDFBF7] overflow-hidden text-[#2B2B2B]">
      
      {/* 1. Background Grain & Lines (Consistencia Visual) */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }} 
      />
      {/* Línea vertical decorativa */}
      <div className="hidden md:block absolute top-0 left-1/2 w-px h-full bg-[#6C7466]/10 -translate-x-1/2 z-0" />

      <div className="container mx-auto max-w-6xl relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          
          {/* 2. Columna Imagen: Estilo Marco de Galería */}
          <div className="order-2 lg:order-1 relative group">
            <div className="relative w-full overflow-hidden rounded-sm">
              <Image
                src="/producto3.png" // Asegúrate que esta ruta sea correcta en tu carpeta public
                alt="Curated crystal collection"
                width={1000}
                height={1000}
                className="w-full h-auto transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              
              {/* Overlay sutil */}
              <div className="absolute inset-0 bg-[#6C7466]/10 mix-blend-multiply pointer-events-none" />
            </div>
          </div>

          {/* 3. Columna Texto: Estilo Editorial */}
          <div className="order-1 lg:order-2 text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
                <span className="h-px w-8 bg-[#6C7466]"></span>
                <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466] uppercase">
                    Our Philosophy
                </span>
            </div>

            <h2 className="text-5xl md:text-7xl font-serif text-[#6C7466] leading-[0.9] mb-8">
              Unearthing <br />
              <span className="italic font-light opacity-80 text-[#2B2B2B]">The Extraordinary.</span>
            </h2>

            <p className="text-lg text-gray-600 leading-relaxed font-light mb-8 max-w-md mx-auto lg:mx-0">
              One of a Kind unveils unique masterpieces of nature that tell millennial stories. Every mineral, gem, and fossil is authentic and meticulously selected, offering a tangible connection to the Earth's fascinating geological history.
            </p>

            <div className="flex justify-center lg:justify-start">
              <Link
                href="/the-brand"
                className="group flex items-center gap-3 text-sm font-bold tracking-[0.2em] uppercase text-[#6C7466] hover:text-[#2B2B2B] transition-colors"
              >
                Read our story
                <span className="bg-[#6C7466]/10 p-2 rounded-full group-hover:bg-[#6C7466] group-hover:text-white transition-all duration-300">
                    <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
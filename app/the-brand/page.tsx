import React from 'react';
import { BrandStory } from "@/components/brand-story";
import { Star } from 'lucide-react';

export default function TheBrandPage() {
    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] relative overflow-hidden selection:bg-[#6C7466] selection:text-white">

            {/* 1. Background Grain/Noise */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
            />

            {/* Decoración Abstracta: Oculta en móvil para limpiar la vista, visible en desktop */}
            <div className="hidden md:block absolute top-0 left-1/3 w-px h-full bg-[#6C7466]/10 z-0" />

            {/* Ajuste de padding: px-4 en móvil, px-6 en desktop. pt-16 en móvil. */}
            <div className="container mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-20 md:pb-32 relative z-10">

                {/* 2. Typographic Hero */}
                <div className="max-w-7xl mx-auto mb-16 md:mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-end">
                        <div className="md:col-span-4">
                            {/* Flex wrap para asegurar que no se rompa raro en pantallas muy pequeñas */}
                            <span className="flex items-center gap-3 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#6C7466] mb-4 md:mb-6">
                                <span className="w-6 md:w-8 h-px bg-[#6C7466]"></span>
                                Philosophy
                            </span>
                        </div>
                        <div className="md:col-span-8">
                            {/* H1 Responsivo: text-4xl en móvil -> 5xl en tablet -> 8xl en desktop */}
                            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-serif leading-[0.95] md:leading-[0.9] text-[#6C7466]">
                                Curating the <br />
                                <span className="italic font-light opacity-80">Earth's Soul.</span>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* 3. The Story Component: Cinematic Look */}
                {/* Margen inferior reducido en móvil */}
                <div className="w-full mb-16 md:mb-32 pl-0 md:pl-[8%]">
                    {/* Aspect Ratio cambia: Video (16:9) en móvil para ver más detalle, Ultra Wide (21/9) en desktop */}
                    <div className="relative w-full aspect-video md:aspect-[21/9] overflow-visible md:overflow-hidden group">
                        
                        {/* Wrapper del componente */}
                        <div className="w-full h-full grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out relative z-10 bg-gray-200">
                             {/* Asegúrate que BrandStory ocupe el 100% width/height internamente */}
                            <BrandStory />
                        </div>

                        {/* Marco decorativo: Se ajusta ligeramente en móvil para no salirse de la pantalla */}
                        <div className="absolute top-2 left-2 md:top-4 md:left-4 w-full h-full border border-[#6C7466] pointer-events-none z-0 translate-x-1 translate-y-1 md:translate-x-2 md:translate-y-2 opacity-20" />
                    </div>
                </div>

                {/* 4. The Manifesto: Editorial Layout */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 max-w-7xl mx-auto items-start">

                    {/* Columna Izquierda: "The Hook" */}
                    {/* En móvil quitamos 'sticky' para que fluya natural, en desktop se mantiene fijo */}
                    <div className="md:col-span-4 relative md:sticky md:top-12">
                        <h2 className="text-2xl md:text-3xl font-serif text-[#6C7466] mb-4 md:mb-6 leading-tight">
                            "We do not design nature. <br />
                            <span className="italic text-black/60">We simply frame it."</span>
                        </h2>
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 md:w-6 md:h-6 text-[#6C7466] animate-spin-slow opacity-60" />
                            {/* Línea decorativa extra solo para móvil para separar visualmente */}
                            <div className="h-px w-12 bg-[#6C7466]/30 md:hidden"></div>
                        </div>
                    </div>

                    {/* Columna Derecha: The Body */}
                    <div className="md:col-span-7 md:col-start-6 space-y-6 md:space-y-8 text-base md:text-lg lg:text-xl font-light leading-relaxed text-gray-600">
                        <p>
                            {/* Dropcap ajustada para móvil */}
                            <span className="text-4xl md:text-5xl float-left mr-3 md:mr-4 mt-[-6px] md:mt-[-10px] font-serif text-[#6C7466]">A</span>
                            t One of a Kind, we operate at the intersection of geology and fine living.
                            We believe that true luxury is not manufactured; it is excavated.
                            Our quest takes us to the most remote quarries of the world to find
                            pieces that carry the weight of millennia.
                        </p>

                        <div className="w-full h-px bg-[#6C7466]/20 my-6 md:my-8" />

                        <p>
                            Each crystal, fossil, and mineral is a distinct character in the story of our planet.
                            We don't just sell objects; we act as custodians of these ancient energies until
                            they find their rightful place in your sanctuary.
                        </p>

                        <div className="pt-4 md:pt-8">
                            <p className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-[#6C7466] uppercase">
                                Est. 2023 — Mexico City
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
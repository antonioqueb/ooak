import React from 'react';
import { BrandStory } from "@/components/brand-story";
import { Star } from 'lucide-react';

export default function TheBrandPage() {
    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] relative overflow-hidden selection:bg-[#6C7466] selection:text-white">

            {/* 1. Background Grain/Noise (Opcional para textura 'film') 
                Si no tienes una imagen de ruido, esto es un degradado sutil.
            */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
            />

            {/* Decoración Abstracta: Línea vertical muy fina (Tendencia arquitectónica) */}
            <div className="hidden md:block absolute top-0 left-1/3 w-px h-full bg-[#6C7466]/10 z-0" />

            <div className="container mx-auto px-6 pt-24 pb-32 relative z-10">

                {/* 2. Typographic Hero: Sin decir "The Brand" */}
                <div className="max-w-7xl mx-auto mb-20 md:mb-32">
                    <div className="grid md:grid-cols-12 gap-8 items-end">
                        <div className="md:col-span-4">
                            <span className="flex items-center gap-3 text-xs font-bold tracking-[0.3em] uppercase text-[#6C7466] mb-6">
                                <span className="w-8 h-px bg-[#6C7466]"></span>
                                Philosophy
                            </span>
                        </div>
                        <div className="md:col-span-8">
                            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif leading-[0.9] text-[#6C7466]">
                                Curating the <br />
                                <span className="italic font-light opacity-80">Earth's Soul.</span>
                            </h1>
                        </div>
                    </div>
                </div>

                {/* 3. The Story Component: Cinematic Look 
                   Ya no es una "caja con sombra". Es un elemento ancho, cinematográfico.
                */}
                <div className="w-full mb-24 md:mb-32 pl-0 md:pl-[8%]">
                    <div className="relative w-full aspect-video md:aspect-[21/9] overflow-hidden">
                        {/* Wrapper para el componente externo */}
                        <div className="w-full h-full grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out">
                            <BrandStory />
                        </div>
                        {/* Marco decorativo sutil */}
                        <div className="absolute top-4 left-4 w-full h-full border border-[#6C7466] pointer-events-none -z-10 translate-x-2 translate-y-2 opacity-20" />
                    </div>
                </div>

                {/* 4. The Manifesto: Editorial Layout 
                   Dos columnas: Izquierda (Concepto) / Derecha (Texto denso)
                */}
                <div className="grid md:grid-cols-12 gap-12 max-w-7xl mx-auto items-start">

                    {/* Columna Izquierda: "The Hook" */}
                    <div className="md:col-span-4 sticky top-12">
                        <h2 className="text-2xl md:text-3xl font-serif text-[#6C7466] mb-6 leading-tight">
                            "We do not design nature. <br />
                            <span className="italic text-black/60">We simply frame it."</span>
                        </h2>
                        <Star className="w-6 h-6 text-[#6C7466] animate-spin-slow opacity-60" />
                    </div>

                    {/* Columna Derecha: The Body */}
                    <div className="md:col-span-7 md:col-start-6 space-y-8 text-lg md:text-xl font-light leading-relaxed text-gray-600">
                        <p>
                            <span className="text-5xl float-left mr-4 mt-[-10px] font-serif text-[#6C7466]">A</span>
                            t One of a Kind, we operate at the intersection of geology and fine living.
                            We believe that true luxury is not manufactured; it is excavated.
                            Our quest takes us to the most remote quarries of the world to find
                            pieces that carry the weight of millennia.
                        </p>

                        <div className="w-full h-px bg-[#6C7466]/20 my-8" />

                        <p>
                            Each crystal, fossil, and mineral is a distinct character in the story of our planet.
                            We don't just sell objects; we act as custodians of these ancient energies until
                            they find their rightful place in your sanctuary.
                        </p>

                        <div className="pt-8">
                            <p className="text-xs font-bold tracking-[0.2em] text-[#6C7466] uppercase">
                                Est. 2023 — Mexico City
                            </p>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
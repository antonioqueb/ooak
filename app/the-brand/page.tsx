"use client";

import React, { useState, useEffect } from 'react';
import { Star, ArrowDown, MapPin, Search, Diamond, Loader2 } from 'lucide-react';

export default function TheBrandPage() {
    const [content, setContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 1. Fetch de datos a la API
    useEffect(() => {
        const fetchContent = async () => {
            try {
                const response = await fetch('https://odoo-ooak.alphaqueb.com/api/the-brand/content');
                if (!response.ok) throw new Error('Error al cargar los datos');
                
                const jsonData = await response.json();
                // La API devuelve { "data": { ... } }, guardamos el objeto interno
                setContent(jsonData.data);
            } catch (err: any) {
                console.error(err);
                setError(err.message || 'Unknown error');
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
    }, []);

    // Helper para asignar iconos según el índice del capítulo
    const getChapterIcon = (index: number) => {
        const icons = [
            <MapPin key="map" className="w-4 h-4" />, 
            <Search key="search" className="w-4 h-4" />, 
            <Diamond key="diamond" className="w-4 h-4" />
        ];
        return icons[index] || <Star className="w-4 h-4" />;
    };

    // 2. Estado de Carga
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-[#6C7466]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="font-serif italic tracking-widest">Loading Earth's Soul...</p>
                </div>
            </div>
        );
    }

    // 3. Estado de Error
    if (error || !content) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-red-900/50">
                <p>Error loading content. Please try again later.</p>
            </div>
        );
    }

    // Desestructuración para facilitar uso en el render
    const { hero, manifesto, chapters } = content;

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] relative selection:bg-[#6C7466] selection:text-white font-sans">

            {/* 1. Global Noise & Grid Lines (Architectural Feel) */}
            <div className="fixed inset-0 opacity-[0.04] pointer-events-none z-0 mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
            />

            {/* Líneas verticales sutiles */}
            <div className="fixed inset-0 container mx-auto px-6 border-l border-r border-[#6C7466]/5 pointer-events-none z-0 hidden md:block">
                <div className="absolute left-1/3 h-full w-px bg-[#6C7466]/5"></div>
                <div className="absolute left-2/3 h-full w-px bg-[#6C7466]/5"></div>
            </div>

            <div className="relative z-10">

                {/* 2. Hero Section: Editorial & Minimal */}
                <section className="pt-32 pb-20 md:pt-48 md:pb-32 container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-start justify-between border-b border-[#6C7466] pb-12">
                        <div className="md:w-1/3 mb-8 md:mb-0">
                            <div className="flex items-center gap-3 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase text-[#6C7466]">
                                <span className="w-4 h-4 border border-[#6C7466] flex items-center justify-center rounded-full text-[8px]">
                                    {hero.number}
                                </span>
                                {hero.label}
                            </div>
                        </div>
                        <div className="md:w-2/3">
                            {/* Usamos dangerouslySetInnerHTML porque el título viene con etiquetas <p> y <br> desde la API */}
                            <div 
                                className="text-5xl md:text-8xl lg:text-9xl font-serif leading-[0.9] text-[#6C7466] mix-blend-multiply [&>p>br]:block"
                                dangerouslySetInnerHTML={{ __html: hero.title }}
                            />
                        </div>
                    </div>
                </section>

                {/* 3. The Manifesto: Typography Focus */}
                <section className="container mx-auto px-6 mb-32">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                        <div className="md:col-span-4 md:sticky md:top-32 h-fit">
                            <h2 className="text-xl md:text-2xl font-serif text-[#2B2B2B] leading-tight">
                                {manifesto.title}
                            </h2>
                            <div className="mt-8 flex items-center gap-2">
                                <div className="h-px w-12 bg-[#6C7466]"></div>
                                <Star className="w-4 h-4 text-[#6C7466]" />
                            </div>
                        </div>
                        <div className="md:col-span-8 md:col-start-6">
                            <p className="text-lg md:text-2xl font-light leading-relaxed text-[#2B2B2B]/80">
                                {manifesto.text}
                            </p>
                        </div>
                    </div>
                </section>

                {/* 4. The Brand History: Renderizado Dinámico desde API */}
                <section className="border-t border-[#6C7466]/20 bg-[#FDFBF7]">
                    {/* Header de la sección */}
                    <div className="container mx-auto px-6 py-12 border-b border-[#6C7466]/10">
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#6C7466]">
                            Legacy & Timeline
                        </span>
                    </div>

                    {/* Loop de Capítulos obtenidos de la API */}
                    {chapters.map((chapter: any, index: number) => (
                        <div key={chapter.id || index} className="group border-b border-[#6C7466]/10 transition-colors duration-500 hover:bg-[#6C7466]/5">
                            <div className="container mx-auto px-6 py-20 md:py-32">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

                                    {/* Columna Izquierda: Año y Metadatos */}
                                    <div className="md:col-span-3 md:sticky md:top-32">
                                        <span className="block text-6xl md:text-8xl font-serif text-[#6C7466]/20 group-hover:text-[#6C7466] transition-colors duration-500">
                                            {chapter.year}
                                        </span>
                                        <div className="mt-4 flex items-center gap-2 text-[#6C7466] text-xs tracking-widest uppercase font-bold">
                                            {getChapterIcon(index)}
                                            {chapter.subtitle}
                                        </div>
                                    </div>

                                    {/* Columna Central: Contenido Textual */}
                                    <div className="md:col-span-4 md:col-start-5 pt-4">
                                        <h3 className="text-3xl md:text-4xl font-serif text-[#2B2B2B] mb-6">
                                            {chapter.title}
                                        </h3>
                                        <p className="text-base md:text-lg leading-relaxed text-gray-600 font-light">
                                            {chapter.description}
                                        </p>
                                    </div>

                                    {/* Columna Derecha: Visual (Video o Imagen) */}
                                    <div className="md:col-span-4 md:col-start-9 mt-8 md:mt-0">
                                        <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100 border border-[#6C7466]/20">
                                            
                                            {/* Lógica para diferenciar Video vs Imagen */}
                                            {chapter.media_type === 'video' ? (
                                                <video 
                                                    src={chapter.video_url} 
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    autoPlay 
                                                    muted 
                                                    loop 
                                                    playsInline 
                                                />
                                            ) : (
                                                <img 
                                                    src={chapter.image_url} 
                                                    alt={chapter.title}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                />
                                            )}

                                            {/* Decoración esquina */}
                                            <div className="absolute bottom-4 right-4 text-white drop-shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                                <ArrowDown className="w-6 h-6 -rotate-45" />
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* 5. Footer / Signature Section */}
                <section className="py-32 container mx-auto px-6 text-center">
                    <Star className="w-6 h-6 text-[#6C7466] mx-auto mb-8 animate-spin-slow" />
                    <h4 className="text-sm md:text-base tracking-[0.4em] uppercase text-[#6C7466] mb-2">
                        One of a Kind
                    </h4>
                    <p className="font-serif italic text-2xl text-[#2B2B2B]/40">
                        {content.hero.subtitle}
                    </p>
                </section>

            </div>
        </main>
    );
}
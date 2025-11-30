'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
    Calendar, 
    MapPin, 
    ArrowLeft, 
    Clock, 
    Share2, 
    User, 
    Mail, 
    ExternalLink,
    Loader2
} from 'lucide-react';

interface EventDetail {
    id: number;
    slug: string;
    status: string;
    date: string;
    title: string;
    location: string;
    description: string;
    long_description?: string;
    image?: string;
    gallery?: string[];
    time?: string;
    organizer?: string;
    contact?: string;
}

export default function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const [event, setEvent] = useState<EventDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [slug, setSlug] = useState<string>('');

    // 1. Resolver params (Next.js 15)
    useEffect(() => {
        const getParams = async () => {
            const resolvedParams = await params;
            setSlug(resolvedParams.slug);
        };
        getParams();
    }, [params]);

    // 2. Fetch de datos
    useEffect(() => {
        if (!slug) return;

        const fetchEvent = async () => {
            try {
                const res = await fetch(`/api/news-events/${slug}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('not-found');
                        return;
                    }
                    throw new Error('Error fetching event');
                }
                const json = await res.json();
                // Maneja si la API devuelve { data: ... } o el objeto directo
                setEvent(json.data || json);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [slug]);

    // 3. Función compartir
    const handleShare = async () => {
        if (navigator.share && event) {
            try {
                await navigator.share({
                    title: event.title,
                    text: event.description,
                    url: window.location.href,
                });
            } catch (err) {
                console.log('Error sharing', err);
            }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Enlace copiado al portapapeles');
        }
    };

    // --- Loading State ---
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] animate-pulse">
                <div className="h-[50vh] bg-gray-200 w-full" />
                <div className="container mx-auto px-6 py-12 max-w-6xl">
                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="h-12 bg-gray-200 rounded w-3/4 mb-6" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-2/3" />
                        </div>
                        <div className="h-64 bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error === 'not-found' || !event) return notFound();

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] text-[#2B2B2B]">
                <p className="text-red-500 mb-4 font-medium">Error cargando el evento.</p>
                <Link href="/news-events" className="text-[#6C7466] hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Volver a intentar
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] font-sans selection:bg-[#6C7466] selection:text-white">
            
            {/* --- HERO SECTION --- */}
            <div className="relative h-[50vh] lg:h-[60vh] w-full overflow-hidden bg-[#EBEBE8]">
                {event.image ? (
                    <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover"
                        priority
                        // Nota: Si tus imágenes vienen de dominios externos no configurados, 
                        // esto podría fallar. Asegúrate de tenerlos en next.config.js
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <span className="text-[#6C7466]/30 font-serif text-4xl">Event</span>
                    </div>
                )}
                
                {/* Degradado para legibilidad del texto */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B2B2B]/90 via-[#2B2B2B]/30 to-transparent" />

                {/* Botón Volver */}
                <div className="absolute top-0 left-0 w-full p-6 z-20">
                    <div className="container mx-auto max-w-6xl">
                        <Link
                            href="/news-events"
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-all duration-300 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Volver
                        </Link>
                    </div>
                </div>

                {/* Título Principal */}
                <div className="absolute bottom-0 left-0 w-full p-6 lg:p-12 z-20">
                    <div className="container mx-auto max-w-6xl">
                        {event.status === 'upcoming' && (
                            <span className="inline-block px-3 py-1 rounded-md bg-[#6C7466] text-white text-xs font-bold tracking-widest uppercase mb-4 shadow-lg shadow-[#6C7466]/20">
                                Próximo Evento
                            </span>
                        )}
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif text-white leading-tight max-w-4xl drop-shadow-md">
                            {event.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* --- CONTENIDO PRINCIPAL --- */}
            <div className="container mx-auto max-w-6xl px-6 py-12 lg:py-20">
                <div className="grid lg:grid-cols-12 gap-12">
                    
                    {/* COLUMNA IZQUIERDA: TEXTO RENDERIZADO (8 COLS) */}
                    <div className="lg:col-span-8">
                        
                        {/* 
                           AQUÍ ESTÁ LA SOLUCIÓN AL PROBLEMA DE DISEÑO:
                           Personalizamos 'prose' para limpiar el HTML sucio de la API.
                        */}
                        <article className="
                            prose prose-lg max-w-none
                            
                            // Títulos Generales
                            prose-headings:font-serif prose-headings:text-[#2B2B2B]
                            prose-h2:text-3xl prose-h2:mt-8 prose-h2:mb-6 prose-h2:font-medium
                            
                            // SUBTÍTULOS (AIDA, PAS): Transformamos los H3 en etiquetas elegantes
                            prose-h3:text-sm prose-h3:font-bold prose-h3:uppercase prose-h3:tracking-[0.15em] prose-h3:text-[#6C7466] prose-h3:mt-10 prose-h3:mb-4
                            
                            // Párrafos
                            prose-p:text-[#2B2B2B]/85 prose-p:leading-[1.8] prose-p:font-light prose-p:mb-6
                            
                            // Negritas: Efecto 'resaltador' sutil en lugar de negro pesado
                            prose-strong:font-bold prose-strong:text-[#2B2B2B] prose-strong:bg-[#6C7466]/10 prose-strong:px-1 prose-strong:rounded-sm
                            
                            // Listas: Bullets verdes y buen espaciado
                            prose-ul:my-6 prose-ul:list-none prose-ul:pl-0 prose-ul:space-y-3
                            prose-li:pl-6 prose-li:relative
                            prose-li:before:content-[''] prose-li:before:absolute prose-li:before:left-0 prose-li:before:top-[0.6em] prose-li:before:h-1.5 prose-li:before:w-1.5 prose-li:before:bg-[#6C7466] prose-li:before:rounded-full
                            
                            // Enlaces dentro del texto
                            prose-a:text-[#6C7466] prose-a:font-medium prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-[#555]
                        ">
                            {/* Renderizamos long_description si existe, si no description */}
                            <div dangerouslySetInnerHTML={{ __html: event.long_description || event.description }} />
                        </article>

                        {/* Galería */}
                        {event.gallery && event.gallery.length > 0 && (
                            <div className="border-t border-[#6C7466]/10 pt-16 mt-12">
                                <h3 className="text-2xl font-serif text-[#2B2B2B] mb-8 flex items-center gap-4">
                                    Galería
                                    <span className="h-px flex-1 bg-[#6C7466]/10"></span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {event.gallery.map((img, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`relative rounded-xl overflow-hidden shadow-sm group bg-gray-100 ${idx === 0 ? 'md:col-span-2 md:aspect-[2.5/1]' : 'aspect-square'}`}
                                        >
                                            <Image
                                                src={img}
                                                alt={`Gallery ${idx}`}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                            />
                                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* COLUMNA DERECHA: SIDEBAR STICKY (4 COLS) */}
                    <div className="lg:col-span-4 relative">
                        <div className="sticky top-24 space-y-6">
                            
                            {/* Tarjeta de Información */}
                            <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#6C7466]/10">
                                <h2 className="text-xl font-serif text-[#2B2B2B] mb-6 border-b border-[#6C7466]/10 pb-4">
                                    Detalles del Evento
                                </h2>
                                
                                <div className="space-y-6">
                                    {/* Fecha */}
                                    <div className="flex items-start gap-4 group">
                                        <div className="p-2.5 rounded-lg bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors duration-300">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#6C7466]/80 uppercase tracking-wider mb-0.5">Fecha</p>
                                            <p className="text-[#2B2B2B] font-medium">{event.date}</p>
                                        </div>
                                    </div>

                                    {/* Hora */}
                                    {event.time && (
                                        <div className="flex items-start gap-4 group">
                                            <div className="p-2.5 rounded-lg bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors duration-300">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold text-[#6C7466]/80 uppercase tracking-wider mb-0.5">Horario</p>
                                                <p className="text-[#2B2B2B] font-medium">{event.time}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Ubicación */}
                                    <div className="flex items-start gap-4 group">
                                        <div className="p-2.5 rounded-lg bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors duration-300">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#6C7466]/80 uppercase tracking-wider mb-0.5">Ubicación</p>
                                            <p className="text-[#2B2B2B] font-medium leading-tight">{event.location}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Organizador y Contacto */}
                                {(event.organizer || event.contact) && (
                                    <>
                                        <hr className="my-6 border-[#6C7466]/10" />
                                        <div className="space-y-3">
                                            {event.organizer && (
                                                <div className="flex items-center gap-3 text-sm text-[#2B2B2B]/70">
                                                    <User className="w-4 h-4 text-[#6C7466]" />
                                                    <span>Org: <span className="text-[#2B2B2B] font-medium">{event.organizer}</span></span>
                                                </div>
                                            )}
                                            {event.contact && (
                                                <div className="flex items-center gap-3 text-sm text-[#2B2B2B]/70">
                                                    <Mail className="w-4 h-4 text-[#6C7466]" />
                                                    <span className="truncate">{event.contact}</span>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                <button 
                                    onClick={handleShare}
                                    className="w-full mt-8 flex items-center justify-center gap-2 py-3 px-4 bg-[#FDFBF7] text-[#2B2B2B] border border-[#6C7466]/20 rounded-xl hover:bg-[#6C7466] hover:text-white hover:border-transparent transition-all duration-300 font-medium text-sm"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Compartir
                                </button>
                            </div>

                            {/* Banner CTA */}
                            <div className="bg-[#6C7466] rounded-2xl p-8 text-center text-white relative overflow-hidden group shadow-lg">
                                {/* Efecto decorativo de fondo */}
                                <div className="absolute top-0 right-0 p-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                
                                <h3 className="text-xl font-serif mb-2 relative z-10">¿Te interesa asistir?</h3>
                                <p className="text-white/80 text-sm mb-6 relative z-10 font-light">
                                    No te pierdas las novedades y actualizaciones de este evento.
                                </p>
                                <button className="w-full py-3 px-4 bg-white text-[#6C7466] rounded-xl font-bold text-sm hover:bg-[#FDFBF7] transition-colors relative z-10 flex items-center justify-center gap-2 shadow-md">
                                    Más Información <ExternalLink className="w-3 h-3" />
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
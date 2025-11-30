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

    // Manejo del Promise de params para Next.js 15
    useEffect(() => {
        const getParams = async () => {
            const resolvedParams = await params;
            setSlug(resolvedParams.slug);
        };
        getParams();
    }, [params]);

    // Fetch de datos
    useEffect(() => {
        if (!slug) return;

        const fetchEvent = async () => {
            try {
                // Simula un delay pequeño para ver el Skeleton (puedes quitar esto en prod)
                // await new Promise(resolve => setTimeout(resolve, 800)); 
                
                const res = await fetch(`/api/news-events/${slug}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('not-found');
                        return;
                    }
                    throw new Error('Error fetching event');
                }
                const json = await res.json();
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
            // Fallback: Copiar al portapapeles
            navigator.clipboard.writeText(window.location.href);
            alert('Enlace copiado al portapapeles');
        }
    };

    // --- Loading State (Skeleton UI) ---
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
                <div className="bg-red-50 text-red-600 p-6 rounded-lg border border-red-100 max-w-md text-center">
                    <p className="font-medium mb-2">Algo salió mal</p>
                    <p className="text-sm opacity-80">No pudimos cargar el evento. Por favor intenta de nuevo.</p>
                </div>
                <Link href="/news-events" className="mt-6 text-[#6C7466] hover:underline">
                    Volver a eventos
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] font-sans selection:bg-[#6C7466] selection:text-white">
            
            {/* Header / Hero Image */}
            <div className="relative h-[50vh] lg:h-[60vh] w-full overflow-hidden">
                {event.image ? (
                    <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-[#EBEBE8] flex items-center justify-center">
                        <span className="text-[#6C7466]/30 font-serif text-4xl">Event</span>
                    </div>
                )}
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B2B2B]/90 via-[#2B2B2B]/20 to-transparent" />

                {/* Navigation Top */}
                <div className="absolute top-0 left-0 w-full p-6 z-20">
                    <div className="container mx-auto max-w-6xl">
                        <Link
                            href="/news-events"
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-all duration-300 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Volver a Eventos
                        </Link>
                    </div>
                </div>

                {/* Hero Title Content */}
                <div className="absolute bottom-0 left-0 w-full p-6 lg:p-12 z-20">
                    <div className="container mx-auto max-w-6xl">
                        {event.status === 'upcoming' && (
                            <span className="inline-block px-3 py-1 rounded-md bg-[#6C7466] text-white text-xs font-bold tracking-widest uppercase mb-4 shadow-lg shadow-[#6C7466]/20">
                                Próximo Evento
                            </span>
                        )}
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif text-white leading-tight max-w-4xl drop-shadow-sm">
                            {event.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* Main Content Layout */}
            <div className="container mx-auto max-w-6xl px-6 py-12 lg:py-20">
                <div className="grid lg:grid-cols-12 gap-12">
                    
                    {/* Left Column: Content & Gallery (8 cols) */}
                    <div className="lg:col-span-8">
                        {/* Description */}
                        <div className="prose prose-lg prose-headings:font-serif prose-headings:text-[#2B2B2B] prose-p:text-[#2B2B2B]/80 prose-a:text-[#6C7466] hover:prose-a:text-[#555] prose-strong:text-[#2B2B2B] max-w-none mb-16">
                            <div dangerouslySetInnerHTML={{ __html: event.long_description || event.description }} />
                        </div>

                        {/* Gallery Section */}
                        {event.gallery && event.gallery.length > 0 && (
                            <div className="border-t border-[#6C7466]/10 pt-12">
                                <h3 className="text-2xl font-serif text-[#2B2B2B] mb-8 flex items-center gap-3">
                                    Galería
                                    <span className="h-px flex-1 bg-[#6C7466]/10"></span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {event.gallery.map((img, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`relative rounded-xl overflow-hidden shadow-sm group ${idx === 0 ? 'md:col-span-2 md:aspect-[2/1]' : 'aspect-square'}`}
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

                    {/* Right Column: Sticky Sidebar Info (4 cols) */}
                    <div className="lg:col-span-4 relative">
                        <div className="sticky top-24 space-y-6">
                            
                            {/* Info Card */}
                            <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#6C7466]/5">
                                <h2 className="text-xl font-serif text-[#2B2B2B] mb-6">Detalles del Evento</h2>
                                
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4 group">
                                        <div className="p-3 rounded-xl bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#6C7466] uppercase tracking-wider mb-1">Fecha</p>
                                            <p className="text-[#2B2B2B] font-medium">{event.date}</p>
                                        </div>
                                    </div>

                                    {event.time && (
                                        <div className="flex items-start gap-4 group">
                                            <div className="p-3 rounded-xl bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors">
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-[#6C7466] uppercase tracking-wider mb-1">Horario</p>
                                                <p className="text-[#2B2B2B] font-medium">{event.time}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-4 group">
                                        <div className="p-3 rounded-xl bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-[#6C7466] uppercase tracking-wider mb-1">Ubicación</p>
                                            <p className="text-[#2B2B2B] font-medium leading-tight">{event.location}</p>
                                        </div>
                                    </div>
                                </div>

                                <hr className="my-6 border-[#6C7466]/10" />

                                <div className="space-y-4">
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

                                <button 
                                    onClick={handleShare}
                                    className="w-full mt-8 flex items-center justify-center gap-2 py-3 px-4 bg-[#FDFBF7] text-[#2B2B2B] border border-[#6C7466]/20 rounded-xl hover:bg-[#6C7466] hover:text-white hover:border-transparent transition-all duration-300 font-medium text-sm"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Compartir Evento
                                </button>
                            </div>

                            {/* Additional CTA or Map Placeholder */}
                            <div className="bg-[#6C7466] rounded-2xl p-8 text-center text-white relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                                
                                <h3 className="text-xl font-serif mb-2 relative z-10">¿Te interesa asistir?</h3>
                                <p className="text-white/80 text-sm mb-6 relative z-10">
                                    No te pierdas las novedades de este evento.
                                </p>
                                <button className="w-full py-3 px-4 bg-white text-[#6C7466] rounded-xl font-bold text-sm hover:bg-[#FDFBF7] transition-colors relative z-10 flex items-center justify-center gap-2">
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
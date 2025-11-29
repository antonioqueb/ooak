'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, ArrowLeft, Clock, Share2, Loader2 } from 'lucide-react';

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

    useEffect(() => {
        const getParams = async () => {
            const resolvedParams = await params;
            setSlug(resolvedParams.slug);
        };
        getParams();
    }, [params]);

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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#6C7466]">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    if (error === 'not-found' || !event) {
        notFound();
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
                <p className="text-red-500">Error loading event. Please try again later.</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B]">
            {/* Hero Section */}
            <div className="relative h-[60vh] md:h-[70vh] bg-[#EBEBE8] overflow-hidden">
                {event.image && (
                    <Image
                        src={event.image}
                        alt={event.title}
                        fill
                        className="object-cover"
                        priority
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B2B2B]/80 via-[#2B2B2B]/40 to-transparent" />

                {/* Back Button */}
                <Link
                    href="/news-events"
                    className="absolute top-8 left-8 z-10 flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Events</span>
                </Link>

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
                    <div className="container mx-auto max-w-5xl">
                        {event.status === 'upcoming' && (
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6C7466] text-white text-xs font-bold uppercase tracking-wider mb-4">
                                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                Upcoming Event
                            </span>
                        )}
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-tight mb-4">
                            {event.title}
                        </h1>
                        <div className="flex flex-wrap gap-6 text-white/90 text-sm md:text-base">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                <span>{event.date}</span>
                            </div>
                            {event.time && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5" />
                                    <span>{event.time}</span>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                <span>{event.location}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto max-w-4xl px-6 py-16 md:py-24">

                {/* Main Description */}
                <div className="prose prose-lg max-w-none mb-12">
                    <div
                        className="text-gray-700 leading-relaxed text-lg"
                        dangerouslySetInnerHTML={{ __html: event.long_description || event.description }}
                    />
                </div>

                {/* Event Details Card */}
                <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-[#6C7466]/10 mb-12">
                    <h2 className="text-2xl font-serif text-[#6C7466] mb-6">Event Details</h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Date & Time</h3>
                            <p className="text-gray-700">{event.date}</p>
                            {event.time && <p className="text-gray-700">{event.time}</p>}
                        </div>
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Location</h3>
                            <p className="text-gray-700">{event.location}</p>
                        </div>
                        {event.organizer && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Organizer</h3>
                                <p className="text-gray-700">{event.organizer}</p>
                            </div>
                        )}
                        {event.contact && (
                            <div>
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Contact</h3>
                                <p className="text-gray-700">{event.contact}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gallery */}
                {event.gallery && event.gallery.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-2xl font-serif text-[#6C7466] mb-6">Gallery</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {event.gallery.map((img, idx) => (
                                <div key={idx} className="relative aspect-square overflow-hidden rounded-lg">
                                    <Image
                                        src={img}
                                        alt={`${event.title} gallery ${idx + 1}`}
                                        fill
                                        className="object-cover hover:scale-110 transition-transform duration-500"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Share Section */}
                <div className="flex items-center justify-between pt-8 border-t border-[#6C7466]/10">
                    <Link
                        href="/news-events"
                        className="flex items-center gap-2 text-[#6C7466] hover:text-[#2B2B2B] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to all events</span>
                    </Link>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-[#6C7466] transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Share</span>
                    </button>
                </div>

            </div>
        </main>
    );
}

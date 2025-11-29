'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, ArrowLeft, Share2, Loader2, Calendar, User } from 'lucide-react';

interface ProjectDetail {
    id: number;
    slug: string;
    title: string;
    location: string;
    category: string;
    year: string;
    description: string;
    long_description?: string;
    image: string;
    gallery?: string[];
    architect?: string;
    client?: string;
}

export default function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const [project, setProject] = useState<ProjectDetail | null>(null);
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

        const fetchProject = async () => {
            try {
                const res = await fetch(`/api/projects/${slug}`);
                if (!res.ok) {
                    if (res.status === 404) {
                        setError('not-found');
                        return;
                    }
                    throw new Error('Error fetching project');
                }
                const json = await res.json();
                setProject(json.data || json);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProject();
    }, [slug]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#6C7466]">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    if (error === 'not-found' || !project) {
        notFound();
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7]">
                <p className="text-red-500">Error loading project. Please try again later.</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B]">
            {/* Hero Section */}
            <div className="relative h-[70vh] bg-[#EBEBE8] overflow-hidden">
                <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B2B2B]/80 via-[#2B2B2B]/20 to-transparent" />

                {/* Back Button */}
                <Link
                    href="/projects"
                    className="absolute top-8 left-8 z-10 flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Back to Projects</span>
                </Link>

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
                    <div className="container mx-auto max-w-5xl">
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold uppercase tracking-wider mb-4 border border-white/30">
                            {project.category}
                        </span>
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white leading-tight mb-6">
                            {project.title}
                        </h1>
                        <div className="flex flex-wrap gap-8 text-white/90 text-sm md:text-base">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                <span>{project.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                <span>{project.year}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Section */}
            <div className="container mx-auto max-w-5xl px-6 py-20">

                <div className="grid md:grid-cols-12 gap-12">
                    {/* Left Column: Details */}
                    <div className="md:col-span-4 space-y-8">
                        <div className="bg-white p-8 rounded-2xl border border-[#6C7466]/10 shadow-sm">
                            <h3 className="text-lg font-serif text-[#6C7466] mb-6 border-b border-[#6C7466]/10 pb-2">Project Info</h3>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Location</p>
                                    <p className="text-[#2B2B2B]">{project.location}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Year</p>
                                    <p className="text-[#2B2B2B]">{project.year}</p>
                                </div>
                                {project.architect && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Architect</p>
                                        <p className="text-[#2B2B2B]">{project.architect}</p>
                                    </div>
                                )}
                                {project.client && (
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Client</p>
                                        <p className="text-[#2B2B2B]">{project.client}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Description */}
                    <div className="md:col-span-8">
                        <h2 className="text-3xl md:text-4xl font-serif text-[#2B2B2B] mb-8 leading-tight">
                            {project.description}
                        </h2>
                        <div
                            className="prose prose-lg max-w-none text-gray-600 font-light leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: project.long_description || project.description }}
                        />
                    </div>
                </div>

                {/* Gallery */}
                {project.gallery && project.gallery.length > 0 && (
                    <div className="mt-24">
                        <h3 className="text-2xl font-serif text-[#6C7466] mb-8 text-center">Project Gallery</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {project.gallery.map((img, idx) => (
                                <div key={idx} className={`relative overflow-hidden rounded-xl shadow-sm group ${idx === 0 ? 'md:col-span-2 aspect-[16/9]' : 'aspect-[4/5]'}`}>
                                    <Image
                                        src={img}
                                        alt={`${project.title} view ${idx + 1}`}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Footer Navigation */}
                <div className="flex items-center justify-between pt-12 mt-20 border-t border-[#6C7466]/10">
                    <Link
                        href="/projects"
                        className="flex items-center gap-2 text-[#6C7466] hover:text-[#2B2B2B] transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to Projects</span>
                    </Link>
                    <button className="flex items-center gap-2 text-gray-400 hover:text-[#6C7466] transition-colors">
                        <Share2 className="w-4 h-4" />
                        <span className="text-sm font-medium">Share Project</span>
                    </button>
                </div>

            </div>
        </main>
    );
}

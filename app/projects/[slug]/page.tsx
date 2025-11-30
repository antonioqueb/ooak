'use client';

import React, { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
    MapPin, 
    ArrowLeft, 
    Share2, 
    Loader2, 
    Calendar, 
    User, 
    Briefcase, 
    Layers 
} from 'lucide-react';

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

    const handleShare = async () => {
        if (navigator.share && project) {
            try {
                await navigator.share({
                    title: project.title,
                    text: project.description,
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

    // --- Loading State (Skeleton) ---
    if (loading) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] animate-pulse">
                <div className="h-[60vh] bg-gray-200 w-full" />
                <div className="container mx-auto px-6 py-12 max-w-6xl">
                    <div className="grid lg:grid-cols-3 gap-12">
                        <div className="lg:col-span-2 space-y-4">
                            <div className="h-12 bg-gray-200 rounded w-3/4 mb-6" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                        </div>
                        <div className="h-64 bg-gray-200 rounded-2xl" />
                    </div>
                </div>
            </div>
        );
    }

    if (error === 'not-found' || !project) return notFound();

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] text-[#2B2B2B]">
                <p className="text-red-500 mb-4 font-medium">Error cargando el proyecto.</p>
                <Link href="/projects" className="text-[#6C7466] hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Volver a proyectos
                </Link>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] font-sans selection:bg-[#6C7466] selection:text-white">
            
            {/* --- HERO SECTION --- */}
            <div className="relative h-[60vh] lg:h-[70vh] w-full overflow-hidden bg-[#EBEBE8]">
                <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover"
                    priority
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#2B2B2B]/90 via-[#2B2B2B]/30 to-transparent" />

                {/* Back Button */}
                <div className="absolute top-0 left-0 w-full p-6 z-20">
                    <div className="container mx-auto max-w-6xl">
                        <Link
                            href="/projects"
                            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-white/20 transition-all duration-300 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                            Volver
                        </Link>
                    </div>
                </div>

                {/* Title Overlay */}
                <div className="absolute bottom-0 left-0 w-full p-6 lg:p-12 z-20">
                    <div className="container mx-auto max-w-6xl">
                        <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-md text-white text-xs font-bold uppercase tracking-widest mb-4 border border-white/30">
                            {project.category}
                        </span>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-tight max-w-5xl drop-shadow-md">
                            {project.title}
                        </h1>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="container mx-auto max-w-6xl px-6 py-12 lg:py-20">
                <div className="grid lg:grid-cols-12 gap-12">

                    {/* COLUMNA IZQUIERDA: TEXTO CON ESTILO PROSE (8 COLS) */}
                    <div className="lg:col-span-8">
                        
                        {/* Intro / Short Description en tamaño grande */}
                        <p className="text-xl md:text-2xl font-serif text-[#2B2B2B] leading-relaxed mb-10 border-l-4 border-[#6C7466] pl-6 py-1">
                            {project.description}
                        </p>

                        {/* 
                            MAGIA DEL TEXTO: Misma configuración que en Eventos 
                            para arreglar el HTML de la API 
                        */}
                        <article className="
                            prose prose-lg max-w-none
                            
                            // Títulos
                            prose-headings:font-serif prose-headings:text-[#2B2B2B]
                            prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-6 prose-h2:font-medium
                            
                            // Subtítulos estilizados (AIDA/PAS Style)
                            prose-h3:text-sm prose-h3:font-bold prose-h3:uppercase prose-h3:tracking-[0.15em] prose-h3:text-[#6C7466] prose-h3:mt-12 prose-h3:mb-4 prose-h3:font-sans
                            
                            // Cuerpo de texto
                            prose-p:text-[#2B2B2B]/85 prose-p:leading-[1.8] prose-p:font-light prose-p:mb-6
                            
                            // Negritas tipo resaltador
                            prose-strong:font-bold prose-strong:text-[#2B2B2B] prose-strong:bg-[#6C7466]/10 prose-strong:px-1 prose-strong:rounded-sm
                            
                            // Listas con bullets verdes
                            prose-ul:my-6 prose-ul:list-none prose-ul:pl-0 prose-ul:space-y-3
                            prose-li:pl-6 prose-li:relative prose-li:text-[#2B2B2B]/85
                            prose-li:before:content-[''] prose-li:before:absolute prose-li:before:left-0 prose-li:before:top-[0.6em] prose-li:before:h-1.5 prose-li:before:w-1.5 prose-li:before:bg-[#6C7466] prose-li:before:rounded-full
                            
                            // Enlaces
                            prose-a:text-[#6C7466] prose-a:font-medium prose-a:underline prose-a:underline-offset-2 hover:prose-a:text-[#555]
                        ">
                            <div dangerouslySetInnerHTML={{ __html: project.long_description || '' }} />
                        </article>

                        {/* Gallery Grid */}
                        {project.gallery && project.gallery.length > 0 && (
                            <div className="border-t border-[#6C7466]/10 pt-16 mt-16">
                                <h3 className="text-2xl font-serif text-[#2B2B2B] mb-8 flex items-center gap-4">
                                    Galería del Proyecto
                                    <span className="h-px flex-1 bg-[#6C7466]/10"></span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {project.gallery.map((img, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`relative rounded-xl overflow-hidden shadow-sm group bg-gray-100 ${idx === 0 ? 'md:col-span-2 aspect-[2/1]' : 'aspect-square'}`}
                                        >
                                            <Image
                                                src={img}
                                                alt={`Project view ${idx}`}
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
                            
                            {/* Card de Ficha Técnica */}
                            <div className="bg-white rounded-2xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#6C7466]/10">
                                <h2 className="text-xl font-serif text-[#2B2B2B] mb-6 border-b border-[#6C7466]/10 pb-4">
                                    Ficha Técnica
                                </h2>

                                <div className="space-y-6">
                                    {/* Location */}
                                    <div className="flex items-start gap-4 group">
                                        <div className="p-2.5 rounded-lg bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors duration-300">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#6C7466]/80 uppercase tracking-wider mb-0.5">Ubicación</p>
                                            <p className="text-[#2B2B2B] font-medium">{project.location}</p>
                                        </div>
                                    </div>

                                    {/* Year */}
                                    <div className="flex items-start gap-4 group">
                                        <div className="p-2.5 rounded-lg bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors duration-300">
                                            <Calendar className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#6C7466]/80 uppercase tracking-wider mb-0.5">Año</p>
                                            <p className="text-[#2B2B2B] font-medium">{project.year}</p>
                                        </div>
                                    </div>

                                    {/* Category */}
                                    <div className="flex items-start gap-4 group">
                                        <div className="p-2.5 rounded-lg bg-[#FDFBF7] text-[#6C7466] group-hover:bg-[#6C7466] group-hover:text-white transition-colors duration-300">
                                            <Layers className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-bold text-[#6C7466]/80 uppercase tracking-wider mb-0.5">Categoría</p>
                                            <p className="text-[#2B2B2B] font-medium">{project.category}</p>
                                        </div>
                                    </div>
                                </div>

                                <hr className="my-6 border-[#6C7466]/10" />

                                <div className="space-y-4">
                                    {project.architect && (
                                        <div className="flex items-center gap-3 text-sm text-[#2B2B2B]/70">
                                            <User className="w-4 h-4 text-[#6C7466]" />
                                            <span>Arq: <span className="text-[#2B2B2B] font-medium">{project.architect}</span></span>
                                        </div>
                                    )}
                                    {project.client && (
                                        <div className="flex items-center gap-3 text-sm text-[#2B2B2B]/70">
                                            <Briefcase className="w-4 h-4 text-[#6C7466]" />
                                            <span>Cliente: <span className="text-[#2B2B2B] font-medium">{project.client}</span></span>
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={handleShare}
                                    className="w-full mt-8 flex items-center justify-center gap-2 py-3 px-4 bg-[#FDFBF7] text-[#2B2B2B] border border-[#6C7466]/20 rounded-xl hover:bg-[#6C7466] hover:text-white hover:border-transparent transition-all duration-300 font-medium text-sm"
                                >
                                    <Share2 className="w-4 h-4" />
                                    Compartir Proyecto
                                </button>
                            </div>

                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, MapPin, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface Project {
    id: number;
    slug: string;
    title: string;
    location: string;
    category: string;
    year: string;
    description: string;
    image: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await fetch('/api/projects');
                if (!res.ok) throw new Error('Error fetching projects');
                const json = await res.json();

                let projectsData = json.data || json;

                // Ensure slug exists
                projectsData = projectsData.map((p: any) => ({
                    ...p,
                    slug: p.slug || p.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                }));

                setProjects(projectsData);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] text-[#6C7466]">
                <Loader2 className="w-10 h-10 animate-spin" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-[#FDFBF7] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[#6C7466] opacity-[0.02] rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto px-6 py-20 relative z-10">

                {/* Header Section */}
                <div className="max-w-4xl mx-auto text-center mb-20">
                    <span className="uppercase tracking-[0.2em] text-xs font-bold text-[#6C7466]/60 mb-4 block">
                        Portfolio
                    </span>
                    <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#6C7466] mb-6 tracking-tight">
                        Selected Projects
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-light">
                        Collaborations with visionary architects and interior designers to create bespoke spaces where nature acts as the ultimate centerpiece.
                    </p>
                </div>

                {/* Projects Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16 max-w-7xl mx-auto">
                    {projects.map((project) => (
                        <Link
                            key={project.id}
                            href={`/projects/${project.slug}`}
                            className="group cursor-pointer flex flex-col h-full block"
                        >

                            {/* Image Container */}
                            <div className="relative overflow-hidden rounded-2xl bg-[#EBEBE8] aspect-[4/5] mb-6 shadow-sm group-hover:shadow-xl transition-all duration-500">

                                <Image
                                    src={project.image}
                                    alt={project.title}
                                    fill
                                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />

                                {/* Overlay Effect */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 pointer-events-none" />

                                {/* Floating 'View' Button */}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-full opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 delay-75 shadow-sm z-10">
                                    <ArrowUpRight className="w-5 h-5 text-[#6C7466]" />
                                </div>
                            </div>

                            {/* Text Content */}
                            <div className="flex flex-col grow">
                                {/* Meta info row */}
                                <div className="flex justify-between items-center mb-3 border-b border-[#6C7466]/10 pb-3">
                                    <span className="text-xs font-bold tracking-widest text-[#6C7466]/60 uppercase">
                                        {project.category}
                                    </span>
                                    <span className="text-xs font-medium text-gray-400">
                                        {project.year}
                                    </span>
                                </div>

                                {/* Title & Desc */}
                                <h3 className="text-2xl font-serif font-medium text-[#2B2B2B] group-hover:text-[#6C7466] transition-colors duration-300 mb-2">
                                    {project.title}
                                </h3>

                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                                    <MapPin className="w-3 h-3" />
                                    {project.location}
                                </div>

                                <p className="text-gray-500 text-sm leading-relaxed line-clamp-2 group-hover:text-gray-700 transition-colors">
                                    {project.description}
                                </p>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Bottom CTA */}
                <div className="mt-24 text-center">
                    <p className="text-xl font-serif text-[#6C7466] mb-6">Have a project in mind?</p>
                    <button className="px-8 py-3 bg-white border border-[#6C7466] text-[#6C7466] rounded-full hover:bg-[#6C7466] hover:text-white transition-all duration-300 uppercase text-xs tracking-[0.15em] font-bold">
                        Get in Touch
                    </button>
                </div>

            </div>
        </main>
    );
}
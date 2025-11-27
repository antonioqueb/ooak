import React from 'react';
import { Calendar, ArrowUpRight, MapPin } from 'lucide-react';

export default function NewsEventsPage() {
    const events = [
        {
            id: 1,
            status: "upcoming",
            date: "Spring 2024",
            title: "Rare Mineral Exhibition",
            location: "Main Gallery, NYC",
            description: "Join us for our annual exhibition featuring the most recent acquisitions from our private collection.", // Texto corto para probar el fix
        },
        {
            id: 2,
            status: "past",
            date: "Oct 2023",
            title: "Ocean Collection Launch",
            location: "Design Week",
            description: "Celebrating the debut of our new collection inspired by ocean depths. Featuring fossilized corals and shells that tell stories of ancient seas.",
        }
    ];

    return (
        <main className="min-h-screen bg-[#FDFBF7] relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#6C7466] opacity-[0.03] rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none" />

            <div className="container mx-auto px-6 py-20 relative z-10">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24 gap-6">
                    <div className="max-w-2xl">
                        <span className="uppercase tracking-[0.2em] text-xs font-bold text-[#6C7466]/60 mb-4 block">
                            Journal
                        </span>
                        <h1 className="text-5xl md:text-6xl font-serif font-bold text-[#6C7466] tracking-tight">
                            News & Events
                        </h1>
                    </div>
                    <p className="text-gray-500 max-w-sm text-sm md:text-base leading-relaxed">
                        Stay updated with our latest discoveries, gallery openings, and exclusive collection drops.
                    </p>
                </div>

                {/* Events List */}
                <div className="max-w-5xl mx-auto flex flex-col gap-8">
                    {events.map((event) => (
                        <div
                            key={event.id}
                            className="group relative bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-[#6C7466]/10 hover:shadow-xl hover:border-[#6C7466]/30 transition-all duration-500 ease-out"
                        >
                            {/* Flex container para las columnas */}
                            <div className="flex flex-col md:flex-row gap-8 md:gap-12 h-full">

                                {/* Columna Izquierda: Fecha / Status */}
                                {/* shrink-0 evita que esta columna se aplaste */}
                                <div className="md:w-1/4 shrink-0 flex flex-col justify-start border-l-2 border-[#6C7466]/10 pl-6 md:pl-0 md:border-l-0 md:border-r-2 md:border-[#6C7466]/10 md:pr-12">
                                    {event.status === 'upcoming' ? (
                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#6C7466] text-white text-xs font-bold uppercase tracking-wider w-fit mb-3">
                                            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                            Upcoming
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-bold uppercase tracking-wider w-fit mb-3">
                                            Past Event
                                        </span>
                                    )}
                                    <div className="text-3xl md:text-4xl font-serif text-[#6C7466] mb-2">
                                        {event.date}
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                                        <MapPin className="w-4 h-4" />
                                        {event.location}
                                    </div>
                                </div>

                                {/* Columna Derecha: Contenido */}
                                {/* flex-col y justify-between aseguran que el botón se vaya al fondo sin superponerse */}
                                <div className="md:w-3/4 flex flex-col justify-between">
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-[#6C7466] mb-4 group-hover:text-black transition-colors duration-300">
                                            {event.title}
                                        </h2>
                                        <p className="text-gray-600 text-lg leading-relaxed">
                                            {event.description}
                                        </p>
                                    </div>

                                    {/* Action Area */}
                                    {/* mt-8 asegura un margen mínimo si el texto es largo */}
                                    {/* justify-end alinea el botón a la derecha */}
                                    <div className="mt-8 flex justify-end opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                                        <button className="flex items-center gap-2 text-[#6C7466] font-semibold border-b border-[#6C7466] pb-1 hover:text-black hover:border-black transition-colors">
                                            View Details <ArrowUpRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Text */}
                <div className="text-center mt-20">
                    <p className="text-[#6C7466]/50 text-sm">Don't miss out on future treasures.</p>
                </div>

            </div>
        </main>
    );
}
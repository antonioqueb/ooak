import { notFound } from "next/navigation";
import Image from "next/image";
import { COLLECTIONS_DATA } from "@/lib/collections";
import { ArrowDown, Star, Sparkles } from "lucide-react";

export default async function CollectionPage({
    params,
}: {
    params: Promise<{ collection: string }>;
}) {
    const { collection } = await params;
    
    // --- LOGIC START (Manteniendo tu lógica original) ---
    let collectionKey = collection.replace(/-/g, " ").toUpperCase();

    if (!COLLECTIONS_DATA[collectionKey]) {
        if (COLLECTIONS_DATA[`${collectionKey} COLLECTION`]) {
            collectionKey = `${collectionKey} COLLECTION`;
        }
    }

    const data = COLLECTIONS_DATA[collectionKey];
    // --- LOGIC END ---

    // 404 Minimalista con estilo
    if (!data) {
        return (
            <main className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center relative overflow-hidden text-[#6C7466]">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }} />
                <h1 className="text-9xl font-serif opacity-20">404</h1>
                <p className="text-xl font-light tracking-widest uppercase mt-4">Collection Not Found</p>
            </main>
        );
    }

    // Formateo visual del título (para que no sea solo un bloque de texto plano)
    // Separamos la última palabra para darle estilo itálico si se desea, o simplemente mostramos elegante.
    const titleWords = collectionKey.split(" ");
    const mainTitle = titleWords.join(" ");

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] relative overflow-hidden selection:bg-[#6C7466] selection:text-white">
            
            {/* 1. Background Texture & Architecture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply" 
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }} 
            />
            {/* Líneas verticales sutiles */}
            <div className="hidden md:block absolute top-0 left-[15%] w-px h-full bg-[#6C7466]/5 z-0" />
            <div className="hidden md:block absolute top-0 right-[15%] w-px h-full bg-[#6C7466]/5 z-0" />

            <div className="relative z-10 pt-32 pb-24">
                
                {/* 2. HEADER SECTION: Editorial Style */}
                <div className="container mx-auto px-6 mb-20">
                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-3 mb-8">
                            <Star className="w-4 h-4 text-[#6C7466] animate-spin-slow" />
                            <span className="text-xs font-bold tracking-[0.3em] uppercase text-[#6C7466]/70">
                                Curated Series
                            </span>
                            <Star className="w-4 h-4 text-[#6C7466] animate-spin-slow" />
                        </div>
                        
                        <h1 className="text-5xl md:text-8xl lg:text-9xl font-serif text-[#6C7466] leading-[0.9] tracking-tight mb-8">
                            {mainTitle}
                        </h1>

                        <div className="h-24 w-px bg-[#6C7466]/20 mt-4 mb-8" />
                    </div>
                </div>

                {/* 3. HERO VISUAL: Cinematic & Wide */}
                <div className="w-full max-w-[95%] mx-auto mb-24 md:mb-32">
                    <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden rounded-sm md:rounded-2xl group">
                        <Image
                            src={data.image}
                            alt={collectionKey}
                            fill
                            className="object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                            priority
                        />
                        {/* Overlay sutil para atmósfera */}
                        <div className="absolute inset-0 bg-[#6C7466]/10 mix-blend-multiply pointer-events-none" />
                        
                        {/* Etiqueta flotante */}
                        <div className="absolute bottom-6 left-6 md:bottom-10 md:left-10 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full hidden md:block">
                            <p className="text-xs font-bold tracking-widest text-[#6C7466] uppercase">
                                Exclusive Edition
                            </p>
                        </div>
                    </div>
                </div>

                {/* 4. MANIFESTO (Description) */}
                <div className="container mx-auto px-6 mb-32">
                    <div className="grid md:grid-cols-12 gap-12 items-start">
                        {/* Columna Izquierda: Detalles Técnicos */}
                        <div className="md:col-span-3 md:col-start-2 sticky top-12">
                            <h3 className="text-sm font-bold tracking-[0.2em] text-[#6C7466] uppercase mb-6 border-b border-[#6C7466]/20 pb-4">
                                Specs
                            </h3>
                            <ul className="space-y-4 text-sm text-gray-500 font-light">
                                <li className="flex justify-between">
                                    <span>Material</span>
                                    <span className="text-[#2B2B2B]">Natural</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Curated</span>
                                    <span className="text-[#2B2B2B]">2024</span>
                                </li>
                                <li className="flex justify-between">
                                    <span>Origin</span>
                                    <span className="text-[#2B2B2B]">Global</span>
                                </li>
                            </ul>
                        </div>

                        {/* Columna Derecha: Texto Editorial */}
                        <div className="md:col-span-6 md:col-start-6">
                            <Sparkles className="w-6 h-6 text-[#6C7466]/40 mb-6" />
                            <p className="text-xl md:text-3xl font-serif text-[#2B2B2B] leading-relaxed md:leading-normal">
                                {data.description}
                            </p>
                            <p className="mt-8 text-gray-500 font-light leading-relaxed">
                                Each piece in this collection has been selected for its ability to transform a space. 
                                We invite you to explore the silence, the texture, and the timeless energy inherent in these forms.
                            </p>
                        </div>
                    </div>
                </div>

                {/* 5. GALLERY GRID (Placeholder Artístico) */}
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between mb-12 border-b border-[#6C7466]/10 pb-6">
                        <span className="text-4xl font-serif text-[#6C7466] italic">
                            The Pieces
                        </span>
                        <span className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">
                            Available Soon
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="group cursor-pointer">
                                {/* Frame de imagen */}
                                <div className="aspect-[4/5] bg-[#EBEBE8] relative overflow-hidden mb-4 transition-all duration-500 group-hover:shadow-xl">
                                    {/* Placeholder visual */}
                                    <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 group-hover:opacity-50 transition-opacity">
                                        <div className="w-px h-16 bg-[#6C7466] mb-2" />
                                        <span className="text-xs tracking-widest uppercase text-[#6C7466]">Object {i + 1}</span>
                                    </div>
                                    
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-[#6C7466]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                </div>

                                {/* Info */}
                                <div className="flex justify-between items-start opacity-60 group-hover:opacity-100 transition-opacity">
                                    <div>
                                        <h3 className="text-sm font-serif text-[#2B2B2B]">Ref. {100 + i}</h3>
                                        <p className="text-[10px] tracking-widest uppercase text-gray-500 mt-1">Waitlist Open</p>
                                    </div>
                                    <ArrowDown className="w-3 h-3 -rotate-45 text-[#6C7466]" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </main>
    );
}
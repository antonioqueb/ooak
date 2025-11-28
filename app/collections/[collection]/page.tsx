import { notFound } from "next/navigation";
import { Star, Sparkles } from "lucide-react";
import { ProductGrid } from "@/components/ProductGrid";

// Definimos la URL de la API
const API_URL = "https://odoo-ooak.alphaqueb.com/api/collections_data";

// Función para obtener datos (con caché de Next.js)
async function getCollectionsData() {
  try {
    const res = await fetch(API_URL, { 
      next: { revalidate: 60 } // Revalida cada 60 segundos
    });
    
    if (!res.ok) throw new Error("Failed to fetch data");
    
    return await res.json();
  } catch (error) {
    console.error("Error fetching collections:", error);
    return {};
  }
}

export default async function CollectionPage({
    params,
}: {
    params: Promise<{ collection: string }>;
}) {
    const { collection } = await params;
    const collectionsData = await getCollectionsData();

    // --- LOGIC START ---
    // La API devuelve keys como "alloys". Normalizamos el parámetro de la URL.
    // Si la URL es /collections/alloys, buscamos "alloys".
    let collectionKey = collection.toLowerCase();
    
    // Intento directo
    let data = collectionsData[collectionKey];

    // Fallback: Si no existe, buscamos keys que contengan la palabra (por si la API cambia)
    if (!data) {
        const foundKey = Object.keys(collectionsData).find(key => 
            key.toLowerCase().includes(collectionKey) || 
            collectionKey.includes(key.toLowerCase())
        );
        if (foundKey) {
            data = collectionsData[foundKey];
            collectionKey = foundKey; // Actualizamos para usar el título correcto
        }
    }
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

    // Usamos el título que viene de la API o formateamos la key
    const mainTitle = data.title || collectionKey.replace(/-/g, " ").toUpperCase();

    // CORRECCIÓN TS: Forzamos el tipo 'any' para acceder a .products sin errores
    const products = (data as any).products || [];

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] relative overflow-hidden selection:bg-[#6C7466] selection:text-white">

            {/* 1. Background Texture & Architecture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
            />
            <div className="hidden md:block absolute top-0 left-[15%] w-px h-full bg-[#6C7466]/5 z-0" />
            <div className="hidden md:block absolute top-0 right-[15%] w-px h-full bg-[#6C7466]/5 z-0" />

            <div className="relative z-10 pt-32 pb-24">

                {/* 2. HEADER SECTION: Centered & Clean */}
                <div className="container mx-auto px-6 mb-12">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <div className="flex items-center gap-3 mb-6">
                            <Star className="w-3 h-3 text-[#6C7466] animate-spin-slow" />
                            <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#6C7466]/70">
                                Curated Series
                            </span>
                            <Star className="w-3 h-3 text-[#6C7466] animate-spin-slow" />
                        </div>

                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif text-[#6C7466] leading-[1.1] tracking-tight mb-8">
                            {mainTitle}
                        </h1>

                        <div className="w-full h-px bg-[#6C7466]/20 mb-8" />

                        <div className="max-w-2xl mx-auto">
                            <Sparkles className="w-5 h-5 text-[#6C7466]/40 mb-4 mx-auto" />
                            <p className="text-lg md:text-xl font-serif text-[#2B2B2B] leading-relaxed">
                                {data.description}
                            </p>
                            <p className="mt-4 text-sm text-gray-500 font-light leading-relaxed">
                                Each piece in this collection has been selected for its ability to transform a space.
                                We invite you to explore the silence, the texture, and the timeless energy inherent in these forms.
                            </p>
                        </div>

                        <div className="w-full h-px bg-[#6C7466]/20 mt-12" />
                    </div>
                </div>

                {/* 5. GALLERY GRID */}
                <div className="container mx-auto px-6">
                    <div className="flex items-center justify-between mb-12 border-b border-[#6C7466]/10 pb-6">
                        <span className="text-4xl font-serif text-[#6C7466] italic">
                            The Pieces
                        </span>
                        <span className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase">
                            {products.length || 0} Objects
                        </span>
                    </div>

                    {/* @ts-ignore */}
                    <ProductGrid products={products} />
                </div>

            </div>
        </main>
    );
}
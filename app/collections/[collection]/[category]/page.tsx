import { ArrowRight, Star, ArrowDown } from "lucide-react";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductGrid";

const API_URL = "https://odoo-ooak.alphaqueb.com/api/collections_data";

async function getCollectionsData() {
  try {
    const res = await fetch(API_URL, { next: { revalidate: 60 } });
    if (!res.ok) return {};
    return await res.json();
  } catch (error) {
    return {};
  }
}

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ collection: string; category: string }>;
}) {
    const { collection, category } = await params;
    const collectionsData = await getCollectionsData();

    // Normalización de texto para visualización
    const categoryNameDisplay = category.replace(/-/g, " ").toUpperCase();
    const collectionNameDisplay = collection.replace(/-/g, " ").toUpperCase();

    // Lógica de recuperación de datos
    // 1. Buscamos primero si existe una key exacta para la categoría
    let data = collectionsData[category];
    
    // 2. Si no, buscamos la key de la colección padre para sacar datos genéricos
    if (!data) {
        const parentKey = collection.toLowerCase(); // ej: 'alloys'
        const parentData = collectionsData[parentKey];
        
        if (parentData) {
            // AQUÍ: Si la API no tiene un objeto separado para la categoría, 
            // asumimos que quieres mostrar los productos de la colección padre.
            // Opcionalmente podrías filtrar 'parentData.products' si tuvieran tags.
            data = {
                description: parentData.description,
                image: parentData.image,
                products: parentData.products || []
            };
        }
    }

    const products = data ? ((data as any).products || []) : [];

    return (
        <main className="min-h-screen bg-[#FDFBF7] text-[#2B2B2B] relative overflow-hidden selection:bg-[#6C7466] selection:text-white">

            {/* 1. Background Grain & Atmosphere */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
            />
            {/* Architectural Line */}
            <div className="hidden md:block absolute top-0 left-12 w-px h-full bg-[#6C7466]/10 z-0" />

            <div className="relative z-10 pt-32 pb-24 container mx-auto px-6">

                {/* 2. Breadcrumb */}
                <nav className="flex items-center gap-4 text-[10px] font-bold tracking-[0.2em] uppercase text-[#6C7466]/60 mb-12 md:mb-20 pl-0 md:pl-12">
                    <Link href={`/collections/${collection}`} className="hover:text-[#6C7466] transition-colors border-b border-transparent hover:border-[#6C7466]">
                        {collectionNameDisplay}
                    </Link>
                    <ArrowRight className="w-3 h-3 text-[#6C7466]/40" />
                    <span className="text-[#6C7466]">
                        {categoryNameDisplay}
                    </span>
                </nav>

                {/* 3. Header Section */}
                <div className="container mx-auto px-6 mb-12">
                    <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif text-[#6C7466] leading-[1.1] tracking-tight mb-8">
                            {categoryNameDisplay}
                        </h1>

                        <div className="w-full h-px bg-[#6C7466]/20 mb-8" />

                        {data && (
                            <div className="max-w-2xl mx-auto">
                                <p className="text-lg md:text-xl font-serif text-[#2B2B2B] leading-relaxed italic opacity-80">
                                    "{data.description}"
                                </p>
                                <p className="mt-4 text-sm text-gray-500 font-light leading-relaxed">
                                    Exploring the nuances of texture and form within the {collectionNameDisplay}. A study in material purity.
                                </p>
                            </div>
                        )}

                        <div className="w-full h-px bg-[#6C7466]/20 mt-12" />
                    </div>
                </div>

                {/* 5. Product Gallery Grid */}
                <div className="pl-0 md:pl-12">
                    <div className="flex items-end justify-between mb-12 border-b border-[#6C7466]/10 pb-6">
                        <div>
                            <span className="text-xs font-bold tracking-[0.2em] text-[#6C7466] uppercase block mb-2">
                                Catalogue
                            </span>
                            <span className="text-3xl md:text-4xl font-serif text-[#2B2B2B]">
                                The Selection
                            </span>
                        </div>
                        <span className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase hidden md:block">
                            {products.length > 0 ? `${products.length} Series` : 'Available Soon'}
                        </span>
                    </div>

                    {/* @ts-ignore */}
                    <ProductGrid products={products} />

                </div>

            </div>
        </main>
    );
}
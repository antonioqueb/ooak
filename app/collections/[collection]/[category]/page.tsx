import Image from "next/image";
import { COLLECTIONS_DATA } from "@/lib/collections";
import { ArrowRight, Star, ArrowDown } from "lucide-react";
import Link from "next/link"; 
// 1. Importamos el Grid
import { ProductGrid } from "@/components/ProductGrid";

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ collection: string; category: string }>;
}) {
    const { collection, category } = await params;
    
    // Normalización de texto
    const categoryName = category.replace(/-/g, " ").toUpperCase();
    const collectionName = collection.replace(/-/g, " ").toUpperCase();

    // Lógica de recuperación de datos (Intacta)
    let data = COLLECTIONS_DATA[categoryName];

    if (!data) {
        const parentData =
            COLLECTIONS_DATA[collectionName] ||
            COLLECTIONS_DATA[`${collectionName} COLLECTION`];
        if (parentData) {
            data = {
                description: `A curated selection of ${categoryName}, derived from the essence of the ${collectionName}.`, 
                image: parentData.image,
                // Intentamos pasar los productos del padre si la categoría no tiene datos específicos
                // (Ojo: esto mostraría todos los productos de la colección. Si quieres filtrar, se haría aquí)
                // @ts-ignore
                products: parentData.products || [] 
            };
        }
    }

    // Extraemos los productos de forma segura para TS
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
                
                {/* 2. Breadcrumb: Minimal & Clean */}
                <nav className="flex items-center gap-4 text-[10px] font-bold tracking-[0.2em] uppercase text-[#6C7466]/60 mb-12 md:mb-20 pl-0 md:pl-12">
                    <Link href={`/collections/${collection}`} className="hover:text-[#6C7466] transition-colors border-b border-transparent hover:border-[#6C7466]">
                        {collectionName}
                    </Link>
                    <ArrowRight className="w-3 h-3 text-[#6C7466]/40" />
                    <span className="text-[#6C7466]">
                        {categoryName}
                    </span>
                </nav>

                {/* 3. Header Section: Asymmetric Editorial */}
                <div className="grid md:grid-cols-12 gap-12 items-end mb-24 md:pl-12">
                    <div className="md:col-span-8">
                        <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-[#6C7466] leading-[0.9] tracking-tight mb-6">
                            {categoryName}
                        </h1>
                        <div className="w-24 h-1 bg-[#6C7466]" />
                    </div>
                    <div className="md:col-span-4 pb-2">
                        <p className="text-gray-500 font-light text-sm md:text-base leading-relaxed max-w-sm">
                            Exploring the nuances of texture and form within the {collectionName}. A study in material purity.
                        </p>
                    </div>
                </div>

                {data ? (
                    <>
                        {/* 4. Hero Visual: Cinematic Widescreen */}
                        <div className="w-full mb-24 relative pl-0 md:pl-12">
                            <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden group">
                                <Image
                                    src={data.image}
                                    alt={categoryName}
                                    fill
                                    className="object-cover transition-transform duration-[1.5s] ease-in-out group-hover:scale-105"
                                    priority
                                />
                                {/* Film Overlay */}
                                <div className="absolute inset-0 bg-[#6C7466]/10 mix-blend-multiply pointer-events-none" />
                                
                                {/* Floating Badge */}
                                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full">
                                    <div className="flex items-center gap-2">
                                        <Star className="w-3 h-3 text-[#6C7466] fill-[#6C7466]" />
                                        <span className="text-[10px] font-bold tracking-widest text-[#6C7466] uppercase">
                                            Category Focus
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Description text under image */}
                            <div className="mt-12 max-w-2xl border-l border-[#6C7466]/20 pl-6 ml-0 md:ml-12">
                                <p className="text-xl md:text-2xl font-serif text-[#2B2B2B] leading-relaxed italic opacity-80">
                                    "{data.description}"
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    // Empty State Fallback (Aesthetic)
                    <div className="w-full aspect-[21/9] bg-[#EBEBE8] mb-24 flex flex-col items-center justify-center text-[#6C7466]/40 ml-0 md:ml-12 border border-[#6C7466]/5">
                        <Star className="w-12 h-12 mb-4 animate-spin-slow opacity-50" />
                        <p className="text-sm tracking-[0.3em] uppercase">Visuals Curating</p>
                    </div>
                )}

                {/* 5. Product Gallery Grid (INTEGRACIÓN) */}
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

                    {/* Renderizamos el ProductGrid */}
                    {/* @ts-ignore */}
                    <ProductGrid products={products} />
                    
                </div>

            </div>
        </main>
    );
}
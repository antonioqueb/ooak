import { ArrowRight, Star, ArrowDown } from "lucide-react";
import Link from "next/link";
// 1. Importamos el Grid
import { ProductGrid } from "@/components/ProductGrid";
import { fetchCollections, fetchCollectionDetails, mapApiProductDetailToProduct } from "@/lib/api";
import { notFound } from "next/navigation";

export default async function CategoryPage({
    params,
}: {
    params: Promise<{ collection: string; category: string }>;
}) {
    const { collection, category } = await params;
    const collections = await fetchCollections();

    // Try to find category in API. The API keys seem to be flat (e.g. "alloys", "antonio").
    // The URL structure is /collections/[collection]/[category].
    // Maybe the category corresponds to a key in the API?
    // Or maybe the API has a hierarchical structure? The user provided API has "parent": "alloys" for "antonio".
    // So "antonio" is a child of "alloys".
    // If URL is /collections/alloys/antonio, then `collection` is alloys, `category` is antonio.
    // We should look up `category` in the API.

    let apiCategoryKey = Object.keys(collections).find(key =>
        key === category ||
        key === category.toLowerCase()
    );

    let apiParentKey = Object.keys(collections).find(key =>
        key === collection ||
        key === collection.toLowerCase() ||
        key === collection + 's' ||
        key === collection.toLowerCase() + 's'
    );

    if (!apiCategoryKey) {
        // Fallback or 404
        // return notFound();
    }

    // Fetch details
    const categoryDetail = apiCategoryKey ? await fetchCollectionDetails(apiCategoryKey) : null;
    const parentDetail = apiParentKey ? await fetchCollectionDetails(apiParentKey) : null;

    const data = categoryDetail ? {
        // Prefer parent description if category description is missing or if user wants inheritance
        description: (parentDetail && parentDetail.collection_info.description) || categoryDetail.collection_info.description,
    } : null;

    const categoryNameDisplay = categoryDetail ? categoryDetail.collection_info.title : category.replace(/-/g, " ").toUpperCase();
    const collectionNameDisplay = parentDetail ? parentDetail.collection_info.title : collection.replace(/-/g, " ").toUpperCase();

    const products = categoryDetail ? categoryDetail.products.map(p => mapApiProductDetailToProduct(p, categoryNameDisplay)) : [];

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
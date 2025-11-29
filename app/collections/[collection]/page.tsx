import { notFound } from "next/navigation";
import { Star, Sparkles } from "lucide-react";
import { ProductGrid } from "@/components/ProductGrid";
import { fetchCollections, fetchCollectionDetails, mapApiProductDetailToProduct } from "@/lib/api";


export default async function CollectionPage({
    params,
}: {
    params: Promise<{ collection: string }>;
}) {
    const { collection } = await params;
    const collections = await fetchCollections();

    // Try to find collection by slug (assuming API keys are slugs like 'alloys')
    let apiCollectionKey = Object.keys(collections).find(key =>
        key === collection ||
        key === collection.toLowerCase() ||
        key === collection + 's' ||
        key === collection.toLowerCase() + 's'
    );

    if (!apiCollectionKey) {
        return notFound();
    }

    // Fetch detailed data for this collection
    const collectionDetail = await fetchCollectionDetails(apiCollectionKey);

    if (!collectionDetail) {
        return notFound();
    }

    const mainTitle = collectionDetail.collection_info.title;
    const products = collectionDetail.products.map(p => mapApiProductDetailToProduct(p, mainTitle));

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
                                {collectionDetail.collection_info.description}
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
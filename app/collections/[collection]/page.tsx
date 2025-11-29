import { notFound } from "next/navigation";
import { Star, Sparkles } from "lucide-react";
import { ProductGrid } from "@/components/ProductGrid";
import { fetchCollections, mapApiProductToProduct } from "@/lib/api";


export default async function CollectionPage({
    params,
}: {
    params: Promise<{ collection: string }>;
}) {
    const { collection } = await params;
    const collections = await fetchCollections();

    // Try to find collection by slug (assuming API keys are slugs like 'alloys')
    // The param might be 'alloy', API has 'alloys'. We might need some fuzzy matching or try both.
    // Let's try exact match first, then with 's', then lowercase.
    let apiCollection = collections[collection] || collections[collection.toLowerCase()] || collections[collection + 's'] || collections[collection.toLowerCase() + 's'];

    // Fallback for specific known mappings if needed, or just rely on the above.
    // The user provided API keys: "alloys", "antonio", "marissa", "metalicus", "pedro", "fossils", "marmolina".
    // URL params are likely singular or plural depending on the link.
    // Navbar links: /collections/alloy, /collections/crystal, /collections/earth, etc.
    // So 'alloy' -> 'alloys'. 'crystal' -> ? (API doesn't have crystal? It has 'antonio', 'marissa' etc. Wait, the user provided API response has "alloys", "antonio", "marissa", "metalicus", "pedro", "fossils", "marmolina". It DOES NOT have "crystal", "earth", "heritage", "lumen", "ocean", "serenity" which are in the Navbar.
    // This is a discrepancy. The user wants to use THIS API.
    // If the API doesn't have the collection, we should probably show 404 or fallback to static if possible?
    // The user said "instead of being static".
    // I will try to use the API. If not found, I will try to fallback to static data if I haven't deleted it, OR just show 404 as per the code.
    // Actually, I should probably keep the static data as a fallback if the API is missing keys, OR just assume the API is the source of truth.
    // Given the user's request "instead of being static", I should rely on API.
    // But if the API is missing "crystal", then /collections/crystal will 404.
    // I will assume the user will update the API or I should map 'crystal' to one of the API keys if I knew the mapping.
    // For now, I will implement the lookup logic.

    if (!apiCollection) {
        // Try to find by title match if slug fails? 
        // No, let's just stick to keys.
        // If not found, return 404.
    }

    const data = apiCollection ? {
        description: apiCollection.description,
        image: "", // API doesn't have collection image in the root object? It has 'products_preview'. 
        // Wait, the API response provided by user: "alloys": { ..., "description": "...", "products_preview": [...] }
        // It does NOT have a main image for the collection itself in the root, only inside products.
        // The previous static data had an image.
        // But we removed the hero image from the UI in step 251. So we don't need `image`!
    } : null;

    if (!data) {
        return notFound();
    }

    const mainTitle = apiCollection.title;
    const products = apiCollection.products_preview.map(p => mapApiProductToProduct(p, mainTitle));

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
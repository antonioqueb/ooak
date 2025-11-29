import { notFound } from "next/navigation";
import { getAllProducts } from "@/lib/api";
import { ProductView } from "@/components/ProductView";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const products = await getAllProducts();
    const productIndex = products.findIndex((p) => p.slug === slug);
    const product = products[productIndex];

    if (!product) {
        notFound();
    }

    const prevProduct = products[productIndex - 1] || products[products.length - 1];
    const nextProduct = products[productIndex + 1] || products[0];

    // We need to determine the collection slug. 
    // The product has a 'category' field which is the display name (e.g. "Alloys").
    // We can try to map it back to a slug, or just use a generic back link if not found.
    // Ideally, we should pass the collection slug in the URL or derive it.
    // For now, let's try to lowercase the category name as a best guess for the collection slug.
    const collectionSlug = product.category.toLowerCase();

    return <ProductView product={product} prevProductSlug={prevProduct.slug} nextProductSlug={nextProduct.slug} collectionSlug={collectionSlug} />;
}

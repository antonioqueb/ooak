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
    // Ideally use the collectionKey from the product if available.
    const collectionSlug = product.collectionKey || product.category.toLowerCase().replace(/ /g, "-");

    return <ProductView product={product} prevProductSlug={prevProduct.slug} nextProductSlug={nextProduct.slug} collectionSlug={collectionSlug} />;
}

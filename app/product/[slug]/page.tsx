import { notFound } from "next/navigation";
import { getAllProducts } from "@/lib/api";
import { ProductView } from "@/components/ProductView";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const products = await getAllProducts();
    const product = products.find((p) => p.slug === slug);

    if (!product) {
        notFound();
    }

    return <ProductView product={product} />;
}

import { notFound } from "next/navigation";
import { products } from "@/lib/products";
import { ProductView } from "@/components/ProductView";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const product = products.find((p) => p.id === id);

    if (!product) {
        notFound();
    }

    return <ProductView product={product} />;
}

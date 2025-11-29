import { Product } from "./products";

const API_URL = "https://odoo-ooak.alphaqueb.com/api/collections_data";

export interface ApiProduct {
    id: number;
    name: string;
    slug: string;
    image: string;
}

export interface ApiCollection {
    id: number;
    title: string;
    description: string;
    parent: string | null;
    products_preview: ApiProduct[];
}

export type ApiResponse = Record<string, ApiCollection>;

export async function fetchCollections(): Promise<ApiResponse> {
    try {
        const response = await fetch(API_URL, { next: { revalidate: 3600 } });
        if (!response.ok) {
            throw new Error("Failed to fetch collections");
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching collections:", error);
        return {};
    }
}

export function mapApiProductToProduct(apiProduct: ApiProduct, category: string): Product {
    // Ensure image URL is HTTPS to avoid mixed content errors
    const imageUrl = apiProduct.image.replace(/^http:\/\//, "https://");

    return {
        id: apiProduct.id.toString(),
        name: apiProduct.name,
        slug: apiProduct.slug,
        price: 0, // Default as API doesn't provide price
        image: imageUrl,
        images: [imageUrl],
        category: category,
        featured: false,
        description: "",
        dimensions: { height: "", width: "", depth: "", weight: "" },
        material: "",
        colors: "",
        inStock: true,
    };
}

export async function getAllProducts(): Promise<Product[]> {
    const collections = await fetchCollections();
    let allProducts: Product[] = [];

    Object.values(collections).forEach((collection) => {
        const products = collection.products_preview.map((p) =>
            mapApiProductToProduct(p, collection.title)
        );
        allProducts = [...allProducts, ...products];
    });

    // Remove duplicates if any (based on ID)
    return Array.from(new Map(allProducts.map(item => [item.id, item])).values());
}

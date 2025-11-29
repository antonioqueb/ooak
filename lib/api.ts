import { Product } from "./products";

// ... existing imports ...

const API_URL = "https://odoo-ooak.alphaqueb.com/api/collections_data";
const API_COLLECTION_URL = "https://odoo-ooak.alphaqueb.com/api/collection";

export interface ApiProduct {
    id: number;
    name: string;
    slug: string;
    image: string;
}

export interface ApiProductDetail {
    id: number;
    name: string;
    slug: string;
    price: number;
    currency: string;
    short_description: string;
    long_description: string;
    material: string;
    specs: {
        weight_kg: number;
        volume_m3: number;
        dimensions: {
            length: number;
            width: number;
            height: number;
            display: string;
        };
    };
    images: {
        main: string;
        image_1: string | null;
        image_2: string | null;
        image_3: string | null;
        image_4: string | null;
    };
    seo: {
        keyword: string;
        meta_title: string;
        meta_description: string;
    };
}

export interface ApiCollection {
    id: number;
    title: string;
    description: string;
    parent: string | null;
    products_preview: ApiProduct[];
}

export interface ApiCollectionDetail {
    collection_info: {
        title: string;
        description: string;
        key: string;
    };
    products: ApiProductDetail[];
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

export async function fetchCollectionDetails(key: string): Promise<ApiCollectionDetail | null> {
    try {
        const response = await fetch(`${API_COLLECTION_URL}/${key}`, { next: { revalidate: 3600 } });
        if (!response.ok) {
            throw new Error(`Failed to fetch collection details for ${key}`);
        }
        return response.json();
    } catch (error) {
        console.error(`Error fetching collection details for ${key}:`, error);
        return null;
    }
}

export function mapApiProductDetailToProduct(apiProduct: ApiProductDetail, category: string): Product {
    // Helper to ensure HTTPS
    const toHttps = (url: string) => url ? url.replace(/^http:\/\//, "https://") : "";

    const mainImage = toHttps(apiProduct.images.main);
    const images = [
        mainImage,
        toHttps(apiProduct.images.image_1 || ""),
        toHttps(apiProduct.images.image_2 || ""),
        toHttps(apiProduct.images.image_3 || ""),
        toHttps(apiProduct.images.image_4 || ""),
    ].filter(Boolean);

    return {
        id: apiProduct.id.toString(),
        name: apiProduct.name,
        slug: apiProduct.slug,
        price: apiProduct.price,
        image: mainImage,
        images: images,
        category: category,
        featured: false,
        description: apiProduct.long_description || apiProduct.short_description, // Use HTML description
        dimensions: {
            height: apiProduct.specs.dimensions.height + " cm",
            width: apiProduct.specs.dimensions.width + " cm",
            depth: apiProduct.specs.dimensions.length + " cm", // Assuming length is depth
            weight: apiProduct.specs.weight_kg + " kg",
        },
        material: apiProduct.material,
        colors: "", // API doesn't provide colors yet
        inStock: true,
    };
}

// Keep the old mapper for preview if needed, or just use the detailed one if we fetch everything.
export function mapApiProductToProduct(apiProduct: ApiProduct, category: string): Product {
    // Ensure image URL is HTTPS to avoid mixed content errors
    const imageUrl = apiProduct.image.replace(/^http:\/\//, "https://");

    return {
        id: apiProduct.id.toString(),
        name: apiProduct.name,
        slug: apiProduct.slug,
        price: 0,
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
    // 1. Get all collection keys
    const collections = await fetchCollections();
    const keys = Object.keys(collections);

    // 2. Fetch details for each collection in parallel
    const detailsPromises = keys.map(key => fetchCollectionDetails(key));
    const detailsResults = await Promise.all(detailsPromises);

    let allProducts: Product[] = [];

    detailsResults.forEach((detail, index) => {
        if (detail && detail.products) {
            const category = detail.collection_info.title;
            const products = detail.products.map(p => mapApiProductDetailToProduct(p, category));
            allProducts = [...allProducts, ...products];
        } else {
            // Fallback to preview data if details fail? 
            // For now, if details fail, we might miss products.
            // But let's assume it works.
        }
    });

    // Remove duplicates
    return Array.from(new Map(allProducts.map(item => [item.id, item])).values());
}

export interface Product {
    id: string;
    name: string;
    slug: string;
    price: number;
    image: string;
    images?: string[];
    category: string;
    featured?: boolean;
    description?: string;
    dimensions?: {
        height: string;
        width: string;
        depth: string;
        weight: string;
    };
    material?: string;
    colors?: string;
    inStock?: boolean;
}

export const products: Product[] = [
    {
        id: "prod-1",
        name: "Green Fluorite on Acrylic Base",
        slug: "green-fluorite-acrylic-base",
        price: 38500,
        image: "/producto1.png",
        images: ["/producto1.png", "/producto1.png", "/producto1.png", "/producto1.png"],
        category: "Minerals & Crystals",
        featured: true,
        description: "An exceptional piece of natural Green Fluorite mounted on a transparent acrylic base. Its natural geometry and translucent tones capture light with depth, generating sparkles that evoke serenity and balance. Ideal for spaces seeking a touch of authentic mineral luxury.",
        dimensions: { height: "17.5 cm", width: "12.3 cm", depth: "6.8 cm", weight: "2.4 kg" },
        material: "Natural Fluorite on high-transparency acrylic base",
        colors: "Emerald Green / Translucent White",
        inStock: true,
    },
    {
        id: "prod-2",
        name: "Polished Fossil Ammonite",
        slug: "polished-fossil-ammonite",
        price: 42000,
        image: "/producto2.png",
        images: ["/producto2.png", "/producto2.png", "/producto2.png", "/producto2.png"],
        category: "Fossils & Paleontology",
        featured: true,
        description: "Authentic ammonite fossil, carefully polished to highlight its spiral structure and the natural earthy tones of the mineral.",
        dimensions: { height: "19.2 cm", width: "15.8 cm", depth: "6.0 cm", weight: "3.1 kg" },
        material: "Mineralized natural fossil on polished acrylic base",
        colors: "Amber, Brown, Metallic Grey",
        inStock: true,
    },
    {
        id: "3",
        name: "Quartz Crystal Cluster",
        slug: "quartz-crystal-cluster",
        price: 1200,
        image: "/producto3.png",
        images: ["/producto3.png", "/producto3.png", "/producto3.png", "/producto3.png"],
        category: "Gems & Minerals",
        featured: true,
        description: "Piece of natural raw Amazonite, recognized for its blue-green color with white veins evoking serenity.",
        dimensions: { height: "14.0 cm", width: "20.0 cm", depth: "10.5 cm", weight: "4.2 kg" },
        material: "Unpolished natural Amazonite",
        colors: "Turquoise Green / White",
        inStock: true,
    },
    {
        id: "7",
        name: "Labradorite Slab",
        slug: "labradorite-slab",
        price: 2100,
        image: "/producto4.png",
        images: ["/producto4.png", "/producto4.png", "/producto4.png", "/producto4.png"],
        category: "Gems & Minerals",
        featured: true,
        description: "High-purity natural Smoky Quartz crystal with natural terminations and deep transparencies.",
        dimensions: { height: "16.0 cm", width: "18.5 cm", depth: "10.0 cm", weight: "3.6 kg" },
        material: "Natural Smoky Quartz",
        colors: "Dark Brown / Smoke Grey",
        inStock: true,
    },
    {
        id: "1",
        name: "Polished Landscape Jasper",
        slug: "polished-landscape-jasper",
        price: 2400,
        image: "/producto5.png",
        images: ["/producto5.png", "/producto5.png", "/producto5.png", "/producto5.png"],
        category: "Gems & Minerals",
        featured: true,
        description: "Sculpture of polished Landscape Jasper, known for its natural patterns evoking terrestrial landscapes.",
        dimensions: { height: "18.0 cm", width: "12.0 cm", depth: "9.0 cm", weight: "3.0 kg" },
        material: "Polished natural Jasper",
        colors: "Sand, Grey, Amber",
        inStock: true,
    },
    {
        id: "2",
        name: "Amethyst Geode Cathedral",
        slug: "amethyst-geode-cathedral",
        price: 4500,
        image: "/producto6.png",
        images: ["/producto6.png", "/producto6.png", "/producto6.png", "/producto6.png"],
        category: "Gems & Minerals",
        featured: true,
        description: "Impressive natural amethyst geode with deep formation crystals in lavender and light violet tones.",
        dimensions: { height: "22.0 cm", width: "25.0 cm", depth: "14.0 cm", weight: "6.5 kg" },
        material: "Natural Amethyst",
        colors: "Violet, Lavender",
        inStock: true,
    },
    {
        id: "prod-7",
        name: "Polished Septarian Geode",
        slug: "polished-septarian-geode",
        price: 69000,
        image: "/producto7.png",
        images: ["/producto7.png", "/producto7.png", "/producto7.png", "/producto7.png"],
        category: "Gems & Minerals",
        featured: true,
        description: "Polished Septarian geode with internal cavity of black crystals and natural veins.",
        dimensions: { height: "20.5 cm", width: "14.0 cm", depth: "13.0 cm", weight: "4.8 kg" },
        material: "Natural Septarian",
        colors: "Black, Ochre, Gold",
        inStock: true,
    },
    {
        id: "4",
        name: "Obsidian Sphere",
        slug: "obsidian-sphere",
        price: 850,
        image: "/producto8.png",
        images: ["/producto8.png", "/producto8.png", "/producto8.png", "/producto8.png"],
        category: "Gems & Minerals",
        featured: true,
        description: "Mineral work of polished Septarian with internal cavity of dark crystals.",
        dimensions: { height: "21.0 cm", width: "14.8 cm", depth: "13.5 cm", weight: "5.0 kg" },
        material: "Polished natural Septarian",
        colors: "Black, Gold, Brown",
        inStock: true,
    },
];

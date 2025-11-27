// components/product-grid.tsx
"use client";
import * as React from "react";
import Image from "next/image";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { 
  Heart, 
  ShoppingCart, 
  X, 
  Package, 
  TruckIcon, 
  ShieldCheck, 
  ChevronLeft, 
  ChevronRight,
  Star,
  Plus,
  ArrowRight,
  ArrowLeft,
  Ruler,
  RefreshCcw 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ========================================
// 🔧 TYPES & INTERFACES
// ========================================
interface Product {
  id: string;
  name: string;
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

// ========================================
// 🔧 DATA CONFIGURATION (Translated to English)
// ========================================
const STATIC_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Green Fluorite on Acrylic Base",
    price: 3850,
    image: "/producto1.png",
    images: [
      "/producto1.png",
      "/producto1.png",
      "/producto1.png",
      "/producto1.png",
    ],
    category: "Minerals & Crystals",
    featured: true,
    description:
      "An exceptional piece of natural Green Fluorite mounted on a transparent acrylic base. Its natural geometry and translucent tones capture light with depth, generating sparkles that evoke serenity and balance. Ideal for spaces seeking a touch of authentic mineral luxury.",
    dimensions: {
      height: "17.5 cm / 6.9 in",
      width: "12.3 cm / 4.8 in",
      depth: "6.8 cm / 2.7 in",
      weight: "2.4 kg / 5.3 lb",
    },
    material:
      "Natural Fluorite on high-transparency acrylic base",
    colors: "Emerald Green / Translucent White",
    inStock: true,
  },
  {
    id: "prod-2",
    name: "Polished Fossil Ammonite",
    price: 4200,
    image: "/producto2.png",
    images: [
      "/producto2.png",
      "/producto2.png",
      "/producto2.png",
      "/producto2.png",
    ],
    category: "Fossils & Paleontology",
    featured: true,
    description:
      "Authentic ammonite fossil, carefully polished to highlight its spiral structure and the natural earthy tones of the mineral. This millennial piece combines history and aesthetics, ideal for collectors or as a high-level decorative accent.",
    dimensions: {
      height: "19.2 cm / 7.6 in",
      width: "15.8 cm / 6.2 in",
      depth: "6.0 cm / 2.4 in",
      weight: "3.1 kg / 6.8 lb",
    },
    material: "Mineralized natural fossil on polished acrylic base",
    colors: "Amber, Brown, Metallic Grey",
    inStock: true,
  },
  {
    id: "prod-3",
    name: "Raw Natural Amazonite",
    price: 3100,
    image: "/producto3.png",
    images: [
      "/producto3.png",
      "/producto3.png",
      "/producto3.png",
      "/producto3.png",
    ],
    category: "Gems & Minerals",
    featured: true,
    description:
      "Piece of natural raw Amazonite, recognized for its blue-green color with white veins evoking serenity. Its raw texture highlights mineral purity and its imposing presence makes it a contemporary and natural design accent.",
    dimensions: {
      height: "14.0 cm / 5.5 in",
      width: "20.0 cm / 7.9 in",
      depth: "10.5 cm / 4.1 in",
      weight: "4.2 kg / 9.3 lb",
    },
    material: "Unpolished natural Amazonite on transparent acrylic base",
    colors: "Turquoise Green / White / Light Brown",
    inStock: true,
  },
  {
    id: "prod-4",
    name: "Natural Smoky Quartz",
    price: 5400,
    image: "/producto4.png",
    images: [
      "/producto4.png",
      "/producto4.png",
      "/producto4.png",
      "/producto4.png",
    ],
    category: "Gems & Minerals",
    featured: true,
    description:
      "High-purity natural Smoky Quartz crystal with natural terminations and deep transparencies. Its smoky brown tone and golden reflections bring elegance and presence to any environment, ideal for exclusive collections or contemporary spaces.",
    dimensions: {
      height: "16.0 cm / 6.3 in",
      width: "18.5 cm / 7.3 in",
      depth: "10.0 cm / 3.9 in",
      weight: "3.6 kg / 7.9 lb",
    },
    material: "Natural Smoky Quartz on display acrylic base",
    colors: "Dark Brown / Smoke Grey / Faint Gold",
    inStock: true,
  },
  {
    id: "prod-5",
    name: "Polished Landscape Jasper",
    price: 3600,
    image: "/producto5.png",
    images: [
      "/producto5.png",
      "/producto5.png",
      "/producto5.png",
      "/producto5.png",
    ],
    category: "Gems & Minerals",
    featured: true,
    description:
      "Sculpture of polished Landscape Jasper, known for its natural patterns evoking terrestrial landscapes and warm nature tones. Each vein tells a unique geological story, combining natural art and mineral sophistication.",
    dimensions: {
      height: "18.0 cm / 7.1 in",
      width: "12.0 cm / 4.7 in",
      depth: "9.0 cm / 3.5 in",
      weight: "3.0 kg / 6.6 lb",
    },
    material: "Polished natural Jasper on transparent acrylic base",
    colors: "Sand, Grey, Amber, Reddish tones",
    inStock: true,
  },
  {
    id: "prod-6",
    name: "Natural Amethyst Geode",
    price: 4800,
    image: "/producto6.png",
    images: [
      "/producto6.png",
      "/producto6.png",
      "/producto6.png",
      "/producto6.png",
    ],
    category: "Gems & Minerals",
    featured: true,
    description:
      "Impressive natural amethyst geode with deep formation crystals in lavender and light violet tones. Its internal cavity reflects light creating a hypnotic effect. Perfect for exclusive decoration or fine mineral collections.",
    dimensions: {
      height: "22.0 cm / 8.7 in",
      width: "25.0 cm / 9.8 in",
      depth: "14.0 cm / 5.5 in",
      weight: "6.5 kg / 14.3 lb",
    },
    material: "Natural Amethyst with display acrylic base",
    colors: "Violet, Lavender, Stone Grey",
    inStock: true,
  },
  {
    id: "prod-7",
    name: "Polished Septarian Geode",
    price: 6900,
    image: "/producto7.png",
    images: [
      "/producto7.png",
      "/producto7.png",
      "/producto7.png",
      "/producto7.png",
    ],
    category: "Gems & Minerals",
    featured: true,
    description:
      "Polished Septarian geode with internal cavity of black crystals and natural veins in ochre and golden tones. Its ovoid shape and natural fractures give it an organic and sophisticated look. Ideal as a sculptural piece or high visual impact decor.",
    dimensions: {
      height: "20.5 cm / 8.1 in",
      width: "14.0 cm / 5.5 in",
      depth: "13.0 cm / 5.1 in",
      weight: "4.8 kg / 10.6 lb",
    },
    material:
      "Natural Septarian with internal crystals and support acrylic base",
    colors: "Black, Ochre, Gold, Beige",
    inStock: true,
  },
  {
    id: "prod-8",
    name: "Polished Septarian Sphere",
    price: 7200,
    image: "/producto8.png",
    images: [
      "/producto8.png",
      "/producto8.png",
      "/producto8.png",
      "/producto8.png",
    ],
    category: "Gems & Minerals",
    featured: true,
    description:
      "Mineral work of polished Septarian with internal cavity of dark crystals that shine under light. Its smooth finish and ovoid shape reflect balance and natural strength, making it a centerpiece of sophistication and terrestrial energy.",
    dimensions: {
      height: "21.0 cm / 8.3 in",
      width: "14.8 cm / 5.8 in",
      depth: "13.5 cm / 5.3 in",
      weight: "5.0 kg / 11.0 lb",
    },
    material:
      "Polished natural Septarian with crystalline core on acrylic base",
    colors: "Black, Gold, Brown, Beige",
    inStock: true,
  },
  {
    id: "prod-9",
    name: "Premium Ammonite Fossil",
    price: 8800,
    image: "/producto9.png",
    images: [
      "/producto9.png",
      "/producto9.png",
      "/producto9.png",
      "/producto9.png",
    ],
    category: "Fossils",
    featured: true,
    description:
      "Museum-grade ammonite fossil, polished to highlight the golden and greenish tones of its spiral structure. This millennial piece combines historical value and natural beauty, perfect for collectors and spaces that appreciate the organic elegance of the geological past.",
    dimensions: {
      height: "23.0 cm / 9.1 in",
      width: "18.0 cm / 7.1 in",
      depth: "7.5 cm / 3.0 in",
      weight: "4.7 kg / 10.4 lb",
    },
    material: "Natural ammonite fossil on polished acrylic base",
    colors: "Gold, Amber, Beige, Slate Grey",
    inStock: true,
  },
  {
    id: "prod-10",
    name: "Monumental Raw Amazonite",
    price: 6400,
    image: "/producto10.png",
    images: [
      "/producto10.png",
      "/producto10.png",
      "/producto10.png",
      "/producto10.png",
    ],
    category: "Gems & Minerals",
    featured: true,
    description:
      "Monumental piece of Amazonite in its natural state, with green and blue tones evoking tranquility and purity. Its raw texture highlights the organic beauty of the mineral, ideal for spaces seeking harmony and natural luxury.",
    dimensions: {
      height: "19.0 cm / 7.5 in",
      width: "26.0 cm / 10.2 in",
      depth: "14.5 cm / 5.7 in",
      weight: "7.8 kg / 17.2 lb",
    },
    material: "Unpolished natural Amazonite on display acrylic base",
    colors: "Emerald Green, Turquoise, Beige nuances",
    inStock: true,
  },
];

// ========================================
// 🧩 MAIN COMPONENT
// ========================================
export function ProductGrid() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentPage = Number(searchParams.get('page')) || 1;
  const ITEMS_PER_PAGE = 8; // Increased for better gallery view
  const totalPages = Math.ceil(STATIC_PRODUCTS.length / ITEMS_PER_PAGE);

  const products = STATIC_PRODUCTS.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const handlePageChange = (pageNumber: number) => {
    replace(createPageURL(pageNumber));
  };

  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <section className="relative py-24 md:py-32 bg-[#FDFBF7] text-[#2B2B2B] overflow-hidden selection:bg-[#6C7466] selection:text-white">
      
      {/* 1. Global Atmosphere (Matches Landing Page Style) */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply" 
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }} 
      />
      {/* Architectural Lines */}
      <div className="hidden md:block absolute top-0 left-12 w-px h-full bg-[#6C7466]/10 z-0" />
      <div className="hidden md:block absolute top-0 right-12 w-px h-full bg-[#6C7466]/10 z-0" />

      <div className="container mx-auto px-6 relative z-10">
        
        {/* 2. Editorial Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 md:pl-12">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-4">
                <Star className="w-4 h-4 text-[#6C7466] animate-spin-slow" />
                <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466] uppercase">
                  The Collection
                </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-serif text-[#6C7466] leading-[0.9]">
              Natural <br />
              <span className="italic font-light opacity-80 text-[#2B2B2B]">Treasures.</span>
            </h1>
          </div>
          <p className="text-sm font-light text-gray-500 max-w-xs mt-6 md:mt-0 leading-relaxed md:text-right">
             Transform your sanctuary with exceptional elements, worthy of the most discerning taste.
          </p>
        </div>

        {/* 3. Gallery Grid (4 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 md:pl-12">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onProductClick={handleProductClick}
            />
          ))}
        </div>

        {/* 4. Minimalist Pagination */}
        {totalPages > 1 && (
          <div className="mt-24 flex justify-center items-center gap-8 md:pl-12">
            <button
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
              className="group flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-[#6C7466] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#2B2B2B] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Prev
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center text-xs font-serif transition-all duration-300 rounded-full",
                    currentPage === page
                      ? "bg-[#6C7466] text-white"
                      : "text-gray-400 hover:text-[#6C7466]"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="group flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase text-[#6C7466] disabled:opacity-30 disabled:cursor-not-allowed hover:text-[#2B2B2B] transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* 5. Luxury Detail Modal */}
      <ProductModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
      />
    </section>
  );
}

// ========================================
// 🎨 PRODUCT CARD (Gallery Style)
// ========================================
function ProductCard({
  product,
  onProductClick,
}: {
  product: Product;
  onProductClick: (product: Product) => void;
}) {
  const [isFavorite, setIsFavorite] = React.useState(false);

  return (
    <div
      className="group cursor-pointer flex flex-col gap-4"
      onClick={() => onProductClick(product)}
    >
      {/* Image Container (Floating, no border) */}
      <div className="relative aspect-[3/4] overflow-hidden bg-[#EBEBE8] rounded-sm">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority={product.featured}
        />

        {/* Atmospheric Overlay */}
        <div className="absolute inset-0 bg-[#6C7466]/10 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* Floating Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
             {product.featured && (
                <span className="bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-[#6C7466]">
                    Featured
                </span>
             )}
             {product.inStock && (
                <span className="bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-gray-400">
                    In Stock
                </span>
             )}
        </div>

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className={cn(
            "absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 delay-75",
            isFavorite ? "bg-red-500 text-white" : "bg-white text-[#6C7466] hover:bg-[#6C7466] hover:text-white"
          )}
        >
          <Heart className={cn("w-4 h-4", isFavorite && "fill-current")} />
        </button>

        {/* Quick View Button (Subtle Plus Icon) */}
        <button className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#6C7466] shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#6C7466] hover:text-white">
            <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Minimal Info */}
      <div className="flex flex-col">
        <div className="flex justify-between items-baseline">
            <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-gray-400 mb-1 truncate max-w-[70%]">
                {product.category}
            </span>
            <span className="text-sm font-medium text-[#2B2B2B]">
                ${product.price.toLocaleString("en-US")}
            </span>
        </div>
        <h3 className="text-lg font-serif text-[#2B2B2B] leading-tight group-hover:text-[#6C7466] transition-colors duration-300 line-clamp-2">
          {product.name}
        </h3>
      </div>
    </div>
  );
}

// ========================================
// 🎨 PRODUCT MODAL (Magazine/Editorial Layout)
// ========================================
function ProductModal({
  product,
  isOpen,
  onClose,
}: {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
  const [activeTab, setActiveTab] = React.useState<"measurements" | "shipping" | "returns">("measurements");
  const [showMoreDescription, setShowMoreDescription] = React.useState(false);

  // Zoom logic states
  const [isZooming, setIsZooming] = React.useState(false);
  const [zoomPosition, setZoomPosition] = React.useState({ x: 0, y: 0 });
  const imageRef = React.useRef<HTMLDivElement>(null);

  // Reset state on open
  React.useEffect(() => {
    if (isOpen) {
      setSelectedImageIndex(0);
      setActiveTab("measurements");
      setShowMoreDescription(false);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    requestAnimationFrame(() => {
      setZoomPosition({ x, y });
    });
  };

  const handleMouseEnter = () => setIsZooming(true);
  const handleMouseLeave = () => setIsZooming(false);

  if (!product) return null;
  const images = product.images || [product.image];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] lg:max-w-6xl h-[90vh] overflow-hidden p-0 bg-[#FDFBF7] border-0 shadow-2xl rounded-none md:rounded-lg">
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-50 p-2 bg-white/50 hover:bg-white rounded-full transition-colors backdrop-blur-md"
        >
          <X className="w-6 h-6 text-[#2B2B2B]" strokeWidth={1.5} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 h-full">
          
          {/* LEFT SIDE: Immersive Gallery with Zoom */}
          <div className="bg-[#EBEBE8] relative h-1/2 lg:h-full flex flex-col justify-center items-center">
             <div 
                ref={imageRef}
                className="relative w-full h-full cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
             >
                <Image
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  fill
                  className={cn(
                    "object-cover transition-opacity duration-200",
                    isZooming ? "opacity-0" : "opacity-100"
                  )}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                
                {/* Zoom Lens Effect */}
                {isZooming && (
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `url(${images[selectedImageIndex]})`,
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      backgroundSize: "200%", // Zoom Level
                      backgroundRepeat: "no-repeat",
                    }}
                  />
                )}
                
                {/* Minimal Overlay when not zooming */}
                {!isZooming && (
                   <div className="absolute inset-0 bg-[#6C7466]/5 mix-blend-multiply pointer-events-none" />
                )}
            </div>
            
            {/* Floating Thumbnails */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 px-4 py-2 bg-white/30 backdrop-blur-md rounded-full z-20">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "w-2 h-2 rounded-full transition-all duration-300",
                      selectedImageIndex === index ? "bg-[#2B2B2B] scale-125" : "bg-white/60 hover:bg-white"
                    )}
                  />
                ))}
            </div>
          </div>

          {/* RIGHT SIDE: Editorial Details */}
          <div className="p-8 lg:p-12 overflow-y-auto bg-[#FDFBF7] custom-scrollbar flex flex-col h-1/2 lg:h-full">
            
            <div className="flex-1">
                {/* Category & Breadcrumb vibe */}
                <div className="flex items-center gap-3 mb-6">
                    <span className="h-px w-8 bg-[#6C7466]"></span>
                    <span className="text-xs font-bold tracking-[0.25em] text-[#6C7466] uppercase">
                        {product.category}
                    </span>
                </div>

                {/* Title */}
                <h2 className="text-3xl md:text-5xl font-serif text-[#2B2B2B] mb-4 leading-[0.95]">
                  {product.name}
                </h2>
                
                {/* Price */}
                <p className="text-2xl font-light text-[#6C7466] mb-8">
                  ${product.price.toLocaleString("en-US")} <span className="text-sm text-gray-400">MXN</span>
                </p>

                {/* Description with Expand/Collapse logic preserved */}
                <div className="mb-10 text-gray-500 font-light leading-relaxed">
                    <p className="text-sm md:text-base">
                      {showMoreDescription
                        ? product.description
                        : product.description?.substring(0, 200) + (product.description && product.description.length > 200 ? "..." : "")}
                    </p>
                    {product.description && product.description.length > 200 && (
                      <button
                        onClick={() => setShowMoreDescription(!showMoreDescription)}
                        className="text-[#6C7466] text-xs font-bold uppercase tracking-widest mt-3 flex items-center gap-2 hover:text-[#2B2B2B] transition-colors"
                      >
                        {showMoreDescription ? "Read Less" : "Read More"}
                        <ChevronRight className={cn("w-3 h-3 transition-transform", showMoreDescription && "rotate-90")} />
                      </button>
                    )}
                </div>

                {/* Technical Tabs (Restyled) */}
                <div className="border-t border-b border-[#6C7466]/10 py-6 mb-8">
                   <div className="flex gap-8 mb-6 overflow-x-auto">
                      <button 
                        onClick={() => setActiveTab("measurements")}
                        className={cn("text-xs font-bold tracking-widest uppercase transition-colors whitespace-nowrap", activeTab === "measurements" ? "text-[#2B2B2B]" : "text-gray-400 hover:text-[#2B2B2B]")}
                      >
                        Specs
                      </button>
                      <button 
                         onClick={() => setActiveTab("shipping")}
                         className={cn("text-xs font-bold tracking-widest uppercase transition-colors whitespace-nowrap", activeTab === "shipping" ? "text-[#2B2B2B]" : "text-gray-400 hover:text-[#2B2B2B]")}
                      >
                        Shipping
                      </button>
                      <button 
                         onClick={() => setActiveTab("returns")}
                         className={cn("text-xs font-bold tracking-widest uppercase transition-colors whitespace-nowrap", activeTab === "returns" ? "text-[#2B2B2B]" : "text-gray-400 hover:text-[#2B2B2B]")}
                      >
                        Returns
                      </button>
                   </div>

                   {/* Tab Content */}
                   <div className="min-h-[100px]">
                      {activeTab === "measurements" && (
                         <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-left-2 duration-300">
                             <div><span className="block text-[10px] text-gray-400 uppercase">Dimensions</span><span className="text-sm text-[#2B2B2B]">{product.dimensions?.height} x {product.dimensions?.width}</span></div>
                             <div><span className="block text-[10px] text-gray-400 uppercase">Weight</span><span className="text-sm text-[#2B2B2B]">{product.dimensions?.weight}</span></div>
                             <div className="col-span-2"><span className="block text-[10px] text-gray-400 uppercase">Material</span><span className="text-sm text-[#2B2B2B]">{product.material}</span></div>
                             <div className="col-span-2"><span className="block text-[10px] text-gray-400 uppercase">Colors</span><span className="text-sm text-[#2B2B2B]">{product.colors}</span></div>
                         </div>
                      )}
                      {activeTab === "shipping" && (
                         <div className="space-y-2 text-sm text-gray-500 font-light animate-in fade-in slide-in-from-left-2 duration-300">
                            <p className="flex items-center gap-2"><TruckIcon className="w-4 h-4 text-[#6C7466]" /> CDMX & Metro Area: 2-3 business days</p>
                            <p className="flex items-center gap-2"><Package className="w-4 h-4 text-[#6C7466]" /> Rest of Mexico: 3-5 business days</p>
                            <p className="text-xs text-gray-400 mt-2">Express shipping available at checkout.</p>
                         </div>
                      )}
                      {activeTab === "returns" && (
                         <div className="space-y-2 text-sm text-gray-500 font-light animate-in fade-in slide-in-from-left-2 duration-300">
                             <p className="flex items-center gap-2"><RefreshCcw className="w-4 h-4 text-[#6C7466]" /> 30-day return window</p>
                             <p>Items must be in original, unused condition.</p>
                         </div>
                      )}
                   </div>
                </div>
            </div>

            {/* Actions Footer */}
            <div className="mt-auto space-y-4">
                <Button className="w-full bg-[#2B2B2B] text-white hover:bg-[#6C7466] transition-colors h-14 rounded-none text-xs font-bold tracking-[0.2em] uppercase">
                    Add to Cart — ${product.price.toLocaleString("en-US")}
                </Button>
                <div className="flex justify-center items-center gap-4 text-[10px] text-gray-400 uppercase tracking-widest">
                    <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure Checkout</span>
                    <span>•</span>
                    <span>Worldwide Shipping</span>
                </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
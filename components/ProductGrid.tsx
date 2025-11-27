// components/product-grid.tsx
"use client";
import * as React from "react";
import Image from "next/image";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import {
  Heart,
  X,
  Package,
  TruckIcon,
  ShieldCheck,
  ChevronRight,
  Star,
  Plus,
  ArrowRight,
  ArrowLeft,
  RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
// 🔧 DATA CONFIGURATION
// ========================================
const STATIC_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Green Fluorite on Acrylic Base",
    price: 3850,
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
    price: 4200,
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
    id: "prod-3",
    name: "Raw Natural Amazonite",
    price: 3100,
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
    id: "prod-4",
    name: "Natural Smoky Quartz",
    price: 5400,
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
    id: "prod-5",
    name: "Polished Landscape Jasper",
    price: 3600,
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
    id: "prod-6",
    name: "Natural Amethyst Geode",
    price: 4800,
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
    price: 6900,
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
    id: "prod-8",
    name: "Polished Septarian Sphere",
    price: 7200,
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

// ========================================
// 🧩 MAIN COMPONENT
// ========================================
export function ProductGrid() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentPage = Number(searchParams.get('page')) || 1;
  const ITEMS_PER_PAGE = 8;
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

  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  return (
    <section className="relative py-24 md:py-32 bg-[#FDFBF7] text-[#2B2B2B] overflow-hidden selection:bg-[#6C7466] selection:text-white">
      {/* Background Atmosphere */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-multiply"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")` }}
      />
      <div className="hidden md:block absolute top-0 left-12 w-px h-full bg-[#6C7466]/10 z-0" />
      <div className="hidden md:block absolute top-0 right-12 w-px h-full bg-[#6C7466]/10 z-0" />

      <div className="container mx-auto px-6 relative z-10">

        {/* Header */}
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
            Transform your sanctuary with exceptional elements.
          </p>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 md:pl-12">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onProductClick={handleProductClick}
            />
          ))}
        </div>

        {/* Pagination */}
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
                    currentPage === page ? "bg-[#6C7466] text-white" : "text-gray-400 hover:text-[#6C7466]"
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

      {/* Modal */}
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
// 🎨 PRODUCT CARD
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
      <div className="relative aspect-[3/4] overflow-hidden bg-[#EBEBE8] rounded-sm">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          priority={product.featured}
        />
        <div className="absolute inset-0 bg-[#6C7466]/10 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <div className="absolute top-3 left-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
          {product.featured && <span className="bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-[#6C7466]">Featured</span>}
          {product.inStock && <span className="bg-white/90 backdrop-blur-sm px-2 py-1 text-[10px] font-bold tracking-widest uppercase text-gray-400">In Stock</span>}
        </div>

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

        <button className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#6C7466] shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#6C7466] hover:text-white">
          <Plus className="w-5 h-5" />
        </button>
      </div>

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
// 🎨 PRODUCT MODAL
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

  // Smooth Zoom Logic
  const [isZooming, setIsZooming] = React.useState(false);
  const [mousePosition, setMousePosition] = React.useState({ x: 50, y: 50 });
  const imageContainerRef = React.useRef<HTMLDivElement>(null);

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
    if (!imageContainerRef.current) return;
    const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePosition({ x, y });
  };

  if (!product) return null;
  const images = product.images || [product.image];

  // 🔹 NUEVAS FUNCIONES PARA NAVEGACIÓN 🔹
  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="w-[95vw] md:max-w-[95vw] lg:max-w-[1600px] h-[90dvh] md:h-[85vh] overflow-hidden p-0 bg-[#FDFBF7] border-0 shadow-2xl gap-0 flex flex-col md:flex-row rounded-none md:rounded-lg"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>

        {/* Floating Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white/50 hover:bg-white rounded-full transition-colors backdrop-blur-md shadow-sm"
        >
          <X className="w-5 h-5 text-[#2B2B2B]" strokeWidth={1.5} />
        </button>

        {/* LEFT SIDE: Image Gallery */}
        <div
          className="relative w-full md:w-[55%] lg:w-[60%] shrink-0 bg-[#EBEBE8] overflow-hidden group h-[40vh] min-h-[300px] md:h-full md:min-h-0"
        >
          {/* 🔹 NUEVOS BOTONES DE NAVEGACIÓN MÓVIL (Y ESCRITORIO) 🔹 */}
          {images.length > 1 && (
            <>
              <button
                onClick={handlePrevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-white/40 backdrop-blur-md rounded-full hover:bg-white text-[#2B2B2B] shadow-sm transition-all active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-30 p-2.5 bg-white/40 backdrop-blur-md rounded-full hover:bg-white text-[#2B2B2B] shadow-sm transition-all active:scale-95 opacity-100 md:opacity-0 md:group-hover:opacity-100"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Desktop overrides via Tailwind classes */}
          <div
            ref={imageContainerRef}
            className="w-full h-full md:h-full cursor-zoom-in relative"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsZooming(true)}
            onMouseLeave={() => setIsZooming(false)}
          >
            <div
              className="w-full h-full relative"
              style={{
                transformOrigin: `${mousePosition.x}% ${mousePosition.y}%`,
                transform: isZooming ? "scale(2)" : "scale(1)",
                transition: "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform-origin 0.1s ease-out"
              }}
            >
              <Image
                src={images[selectedImageIndex]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
              />
            </div>

            {/* Overlay only when NOT zooming */}
            <div className={cn(
              "absolute inset-0 bg-[#6C7466]/5 mix-blend-multiply pointer-events-none transition-opacity duration-300",
              isZooming ? "opacity-0" : "opacity-100"
            )} />
          </div>

          {/* Thumbnails */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 px-3 py-1.5 bg-white/30 backdrop-blur-md rounded-full z-20">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(index); }}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-all duration-300",
                  selectedImageIndex === index ? "bg-[#2B2B2B] scale-150" : "bg-white/80 hover:bg-white"
                )}
              />
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: Details */}
        <div className="flex-1 w-full md:w-[45%] lg:w-[40%] flex flex-col h-full bg-[#FDFBF7] overflow-hidden">
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8 lg:p-12">

            {/* Breadcrumb */}
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <span className="h-px w-6 md:w-8 bg-[#6C7466]"></span>
              <span className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-[#6C7466] uppercase truncate">
                {product.category}
              </span>
            </div>

            {/* Header Info */}
            <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif text-[#2B2B2B] mb-2 md:mb-4 leading-[1.1]">
              {product.name}
            </h2>
            <p className="text-xl md:text-2xl lg:text-3xl font-light text-[#6C7466] mb-6 md:mb-8">
              ${product.price.toLocaleString("en-US")} <span className="text-xs text-gray-400">MXN</span>
            </p>

            {/* Description */}
            <div className="mb-8 text-gray-500 font-light leading-relaxed text-sm md:text-base">
              <p>
                {showMoreDescription
                  ? product.description
                  : product.description?.substring(0, 180) + (product.description && product.description.length > 180 ? "..." : "")}
              </p>
              {product.description && product.description.length > 180 && (
                <button
                  onClick={() => setShowMoreDescription(!showMoreDescription)}
                  className="text-[#6C7466] text-[10px] md:text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2 hover:text-[#2B2B2B] transition-colors"
                >
                  {showMoreDescription ? "Read Less" : "Read More"}
                  <ChevronRight className={cn("w-3 h-3 transition-transform", showMoreDescription && "rotate-90")} />
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="border-t border-b border-[#6C7466]/10 py-4 md:py-6 mb-6">
              <div className="flex gap-6 mb-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                {["measurements", "shipping", "returns"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={cn(
                      "text-[10px] md:text-xs font-bold tracking-widest uppercase transition-colors whitespace-nowrap pb-1 border-b-2",
                      activeTab === tab ? "text-[#2B2B2B] border-[#2B2B2B]" : "text-gray-400 border-transparent hover:text-[#2B2B2B]"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="min-h-[80px]">
                {activeTab === "measurements" && (
                  <div className="grid grid-cols-2 gap-3 text-sm animate-in fade-in slide-in-from-left-2 duration-300">
                    <div><span className="block text-[10px] text-gray-400 uppercase">Dimensions</span><span className="text-[#2B2B2B]">{product.dimensions?.height} x {product.dimensions?.width}</span></div>
                    <div><span className="block text-[10px] text-gray-400 uppercase">Weight</span><span className="text-[#2B2B2B]">{product.dimensions?.weight}</span></div>
                    <div className="col-span-2"><span className="block text-[10px] text-gray-400 uppercase">Material</span><span className="text-[#2B2B2B]">{product.material}</span></div>
                  </div>
                )}
                {activeTab === "shipping" && (
                  <div className="space-y-2 text-sm text-gray-500 font-light animate-in fade-in slide-in-from-left-2 duration-300">
                    <p className="flex items-center gap-2"><TruckIcon className="w-3.5 h-3.5 text-[#6C7466]" /> CDMX: 2-3 days</p>
                    <p className="flex items-center gap-2"><Package className="w-3.5 h-3.5 text-[#6C7466]" /> National: 3-5 days</p>
                  </div>
                )}
                {activeTab === "returns" && (
                  <div className="space-y-2 text-sm text-gray-500 font-light animate-in fade-in slide-in-from-left-2 duration-300">
                    <p className="flex items-center gap-2"><RefreshCcw className="w-3.5 h-3.5 text-[#6C7466]" /> 30-day return window</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions (Fixed at bottom right) */}
          <div className="p-6 md:p-8 lg:p-10 border-t border-[#6C7466]/10 bg-[#FDFBF7] shrink-0">
            <Button className="w-full bg-[#2B2B2B] text-white hover:bg-[#6C7466] transition-colors h-12 md:h-14 rounded-none text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-3">
              Add to Cart — ${product.price.toLocaleString("en-US")}
            </Button>
            <div className="flex justify-center items-center gap-3 text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure</span>
              <span>•</span>
              <span>Worldwide Shipping</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
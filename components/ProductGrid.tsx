// components/product-grid.tsx
"use client";
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingCart, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
// Tipos de productos
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  images?: string[]; // Galería de imágenes adicionales
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
// 🔧 CONFIGURACIÓN DE PRODUCTOS
// ========================================
const STATIC_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Fluorita Verde en Base Acrílica",
    price: 3850,
    image: "/producto1.png",
    images: [
      "/producto1.png",
      "/producto1.png",
      "/producto1.png",
      "/producto1.png",
    ],
    category: "Minerales y Cristales",
    featured: true,
    description:
      "Una pieza excepcional de Fluorita Verde natural montada sobre una base acrílica transparente. Su geometría natural y tonalidades translúcidas capturan la luz con profundidad, generando destellos que evocan serenidad y equilibrio. Ideal para espacios que buscan un toque de lujo mineral auténtico.",
    dimensions: {
      height: "17.5 cm / 6.9 in",
      width: "12.3 cm / 4.8 in",
      depth: "6.8 cm / 2.7 in",
      weight: "2.4 kg / 5.3 lb",
    },
    material:
      "Fluorita natural montada sobre base acrílica de alta transparencia",
    colors: "Verde esmeralda / Blanco translúcido",
    inStock: true,
  },
  {
    id: "prod-2",
    name: "Ammonite Fósil Pulido",
    price: 4200,
    image: "/producto2.png",
    images: [
      "/producto2.png",
      "/producto2.png",
      "/producto2.png",
      "/producto2.png",
    ],
    category: "Fósiles y Paleontología",
    featured: true,
    description:
      "Auténtico fósil de ammonite, cuidadosamente pulido para resaltar su estructura espiral y los tonos terrosos naturales del mineral. Esta pieza milenaria combina historia y estética, ideal para coleccionistas o como acento decorativo de alto nivel.",
    dimensions: {
      height: "19.2 cm / 7.6 in",
      width: "15.8 cm / 6.2 in",
      depth: "6.0 cm / 2.4 in",
      weight: "3.1 kg / 6.8 lb",
    },
    material: "Fósil natural mineralizado sobre base acrílica pulida",
    colors: "Ámbar, marrón, gris metálico",
    inStock: true,
  },
  {
    id: "prod-3",
    name: "Amazonita Natural en Bruto",
    price: 3100,
    image: "/producto3.png",
    images: [
      "/producto3.png",
      "/producto3.png",
      "/producto3.png",
      "/producto3.png",
    ],
    category: "Gemas y Minerales",
    featured: true,
    description:
      "Pieza de Amazonita natural en bruto, reconocida por su color verde azulado con vetas blancas que evocan serenidad. Su textura cruda resalta la pureza mineral y su presencia imponente la convierte en un acento de diseño contemporáneo y natural.",
    dimensions: {
      height: "14.0 cm / 5.5 in",
      width: "20.0 cm / 7.9 in",
      depth: "10.5 cm / 4.1 in",
      weight: "4.2 kg / 9.3 lb",
    },
    material: "Amazonita natural sin pulir sobre base acrílica transparente",
    colors: "Verde turquesa / Blanco / Marrón claro",
    inStock: true,
  },
  {
    id: "prod-4",
    name: "Cuarzo Ahumado Natural",
    price: 5400,
    image: "/producto4.png",
    images: [
      "/producto4.png",
      "/producto4.png",
      "/producto4.png",
      "/producto4.png",
    ],
    category: "Gemas y Minerales",
    featured: true,
    description:
      "Cristal de Cuarzo Ahumado natural de alta pureza con terminaciones naturales y transparencias profundas. Su tono marrón ahumado y reflejos dorados aportan elegancia y presencia a cualquier entorno, ideal para colecciones exclusivas o espacios contemporáneos.",
    dimensions: {
      height: "16.0 cm / 6.3 in",
      width: "18.5 cm / 7.3 in",
      depth: "10.0 cm / 3.9 in",
      weight: "3.6 kg / 7.9 lb",
    },
    material: "Cuarzo Ahumado natural sobre base acrílica de exhibición",
    colors: "Marrón oscuro / Gris humo / Dorado tenue",
    inStock: true,
  },
  {
    id: "prod-5",
    name: "Jaspe Paisaje Pulido",
    price: 3600,
    image: "/producto5.png",
    images: [
      "/producto5.png",
      "/producto5.png",
      "/producto5.png",
      "/producto5.png",
    ],
    category: "Gemas y Minerales",
    featured: true,
    description:
      "Escultura de Jaspe Paisaje pulido, conocida por sus patrones naturales que evocan paisajes terrestres y tonos cálidos de la naturaleza. Cada veta cuenta una historia geológica única, combinando arte natural y sofisticación mineral.",
    dimensions: {
      height: "18.0 cm / 7.1 in",
      width: "12.0 cm / 4.7 in",
      depth: "9.0 cm / 3.5 in",
      weight: "3.0 kg / 6.6 lb",
    },
    material: "Jaspe natural pulido sobre base acrílica transparente",
    colors: "Arena, gris, ámbar y tonos rojizos",
    inStock: true,
  },
  {
    id: "prod-6",
    name: "Geoda de Amatista Natural",
    price: 4800,
    image: "/producto6.png",
    images: [
      "/producto6.png",
      "/producto6.png",
      "/producto6.png",
      "/producto6.png",
    ],
    category: "Gemas y Minerales",
    featured: true,
    description:
      "Impresionante geoda de amatista natural con cristales de formación profunda en tonos lavanda y violeta claro. Su cavidad interna refleja la luz creando un efecto hipnótico. Perfecta para decoración exclusiva o colecciones de minerales finos.",
    dimensions: {
      height: "22.0 cm / 8.7 in",
      width: "25.0 cm / 9.8 in",
      depth: "14.0 cm / 5.5 in",
      weight: "6.5 kg / 14.3 lb",
    },
    material: "Amatista natural con base acrílica de exhibición",
    colors: "Violeta, lavanda y gris piedra",
    inStock: true,
  },
  {
    id: "prod-7",
    name: "Septaria Geoda Pulida",
    price: 6900,
    image: "/producto7.png",
    images: [
      "/producto7.png",
      "/producto7.png",
      "/producto7.png",
      "/producto7.png",
    ],
    category: "Gemas y Minerales",
    featured: true,
    description:
      "Geoda de Septaria pulida con cavidad interna de cristales negros y vetas naturales en tonos ocres y dorados. Su forma ovoide y fracturas naturales le otorgan un aspecto orgánico y sofisticado. Ideal como pieza escultórica o decorativa de alto impacto visual.",
    dimensions: {
      height: "20.5 cm / 8.1 in",
      width: "14.0 cm / 5.5 in",
      depth: "13.0 cm / 5.1 in",
      weight: "4.8 kg / 10.6 lb",
    },
    material:
      "Septaria natural con cristales internos y base acrílica de soporte",
    colors: "Negro, ocre, dorado y beige",
    inStock: true,
  },
  {
    id: "prod-8",
    name: "Septaria Esfera Pulida",
    price: 7200,
    image: "/producto8.png",
    images: [
      "/producto8.png",
      "/producto8.png",
      "/producto8.png",
      "/producto8.png",
    ],
    category: "Gemas y Minerales",
    featured: true,
    description:
      "Obra mineral de Septaria pulida con cavidad interna de cristales oscuros que brillan bajo la luz. Su acabado liso y forma ovoide reflejan equilibrio y fuerza natural, convirtiéndola en una pieza central de sofisticación y energía terrestre.",
    dimensions: {
      height: "21.0 cm / 8.3 in",
      width: "14.8 cm / 5.8 in",
      depth: "13.5 cm / 5.3 in",
      weight: "5.0 kg / 11.0 lb",
    },
    material:
      "Septaria natural pulida con núcleo cristalino sobre base acrílica",
    colors: "Negro, dorado, marrón y beige",
    inStock: true,
  },
  {
    id: "prod-9",
    name: "Ammonite Fósil Premium",
    price: 8800,
    image: "/producto9.png",
    images: [
      "/producto9.png",
      "/producto9.png",
      "/producto9.png",
      "/producto9.png",
    ],
    category: "Fósiles",
    featured: true,
    description:
      "Fósil de ammonite de grado museístico, pulido para resaltar los tonos dorados y verdosos de su estructura espiral. Esta pieza milenaria combina valor histórico y belleza natural, perfecta para coleccionistas y espacios que aprecian la elegancia orgánica del pasado geológico.",
    dimensions: {
      height: "23.0 cm / 9.1 in",
      width: "18.0 cm / 7.1 in",
      depth: "7.5 cm / 3.0 in",
      weight: "4.7 kg / 10.4 lb",
    },
    material: "Fósil natural de ammonite sobre base acrílica pulida",
    colors: "Dorado, ámbar, beige y gris pizarra",
    inStock: true,
  },
  {
    id: "prod-10",
    name: "Amazonita Bruta Monumental",
    price: 6400,
    image: "/producto10.png",
    images: [
      "/producto10.png",
      "/producto10.png",
      "/producto10.png",
      "/producto10.png",
    ],
    category: "Gemas y Minerales",
    featured: true,
    description:
      "Pieza monumental de Amazonita en estado natural, con tonos verdes y azules que evocan tranquilidad y pureza. Su textura cruda resalta la belleza orgánica del mineral, ideal para espacios que buscan armonía y lujo natural.",
    dimensions: {
      height: "19.0 cm / 7.5 in",
      width: "26.0 cm / 10.2 in",
      depth: "14.5 cm / 5.7 in",
      weight: "7.8 kg / 17.2 lb",
    },
    material: "Amazonita natural sin pulir sobre base acrílica de exhibición",
    colors: "Verde esmeralda, turquesa y matices beige",
    inStock: true,
  },
];
export function ProductGrid() {
  const products = STATIC_PRODUCTS;
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const sections = [];
  for (let i = 0; i < products.length; i += 10) {
    sections.push(products.slice(i, i + 10));
  }
  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };
  return (
    <section className="py-8 sm:py-12 lg:py-16 bg-white">
      <div className="container mx-auto px-2 sm:px-1 lg:px-1">
        {/* Header */}
        <div className="mb-8 sm:mb-12 lg:mb-16 flex flex-col items-center gap-4 sm:gap-6">
          <h1 className="text-center text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#6C7466]">
            Exclusive Natural Treasures
          </h1>
          <p className="text-center text-sm sm:text-base lg:text-lg text-[#6C7466]/70 max-w-3xl">
            Transform your spaces with exceptional elements, worthy of the most discerning taste.
          </p>
        </div>
        {/* Vista Móvil: Lista simple de productos */}
        <div className="block lg:hidden">
          <div className="flex flex-col gap-4">
            {products.map((product) => (
              <div key={product.id} className="w-full h-[320px] sm:h-[360px]">
                <ProductCard
                  product={product}
                  onProductClick={handleProductClick}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Vista Desktop: Grid con Bordes Estilo Bento */}
        <div className="hidden lg:block space-y-0">
          {sections.map((sectionProducts, sectionIndex) => (
            <BentoSection
              key={sectionIndex}
              products={sectionProducts}
              isLast={sectionIndex === sections.length - 1}
              onProductClick={handleProductClick}
            />
          ))}
        </div>
      </div>
      {/* Modal de Detalles del Producto */}
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
function BentoSection({
  products,
  isLast,
  onProductClick,
}: {
  products: Product[];
  isLast: boolean;
  onProductClick: (product: Product) => void;
}) {
  const topLeft = products.slice(0, 2);
  const topRight = products.slice(4, 6);
  const bottomLeft = products.slice(6, 8);
  const bottomRight = products.slice(8, 10);
  return (
    <div
      className={cn(
        "relative flex w-full flex-col border border-[#6C7466]/20",
        !isLast && "border-b-0"
      )}
    >
      {/* Fila Superior */}
      <div className="relative flex flex-col lg:flex-row">
        {/* Top Left - 4 productos */}
        <div className="border-[#6C7466]/20 border-b lg:border-b-0 lg:border-r lg:w-5/5">
          <div className="grid grid-cols-2 h-full">
            {topLeft.map((product, idx) => (
              <div
                key={product.id}
                className={cn(
                  "border-[#6C7466]/20 min-h-[280px]",
                  idx === 0 && "border-r border-b",
                  idx === 1 && "border-b",
                  idx === 2 && "border-r"
                )}
              >
                <ProductCard
                  product={product}
                  onProductClick={onProductClick}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Top Right - 2 productos */}
        <div className="lg:w-2/5">
          <div className="flex flex-col h-full">
            {topRight.map((product, idx) => (
              <div
                key={product.id}
                className={cn(
                  "border-[#6C7466]/20 min-h-[280px]",
                  idx === 0 && "border-b"
                )}
              >
                <ProductCard
                  product={product}
                  onProductClick={onProductClick}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Fila Inferior */}
      <div className="relative flex flex-col lg:flex-row border-t border-[#6C7466]/20">
        {/* Bottom Left - 2 productos */}
        <div className="border-[#6C7466]/20 border-b lg:border-b-0 lg:border-r lg:w-2/5">
          <div className="flex flex-col h-full">
            {bottomLeft.map((product, idx) => (
              <div
                key={product.id}
                className={cn(
                  "border-[#6C7466]/20 min-h-[280px]",
                  idx === 0 && "border-b"
                )}
              >
                <ProductCard
                  product={product}
                  onProductClick={onProductClick}
                />
              </div>
            ))}
          </div>
        </div>
        {/* Bottom Right - 2 productos */}
        <div className="lg:w-3/5">
          <div className="grid grid-cols-2 h-full">
            {bottomRight.map((product, idx) => (
              <div
                key={product.id}
                className={cn(
                  "border-[#6C7466]/20 min-h-[280px]",
                  idx === 0 && "border-r"
                )}
              >
                <ProductCard
                  product={product}
                  onProductClick={onProductClick}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
function ProductCard({
  product,
  onProductClick,
}: {
  product: Product;
  onProductClick: (product: Product) => void;
}) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFavorite, setIsFavorite] = React.useState(false);
  return (
    <div
      className="group relative overflow-hidden bg-white block h-full w-full cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onProductClick(product)}
    >
      <div className="relative w-full h-full">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className={cn(
            "object-cover transition-all duration-700",
            isHovered && "scale-105"
          )}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
          priority={product.featured}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
          <Badge className="bg-white/95 backdrop-blur-sm text-[#6C7466] hover:bg-white text-[9px] sm:text-[10px] px-1.5 py-0.5 font-semibold tracking-tight border-0">
            {product.category}
          </Badge>
        </div>
        {product.featured && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-500/95 backdrop-blur-sm flex items-center justify-center text-white text-xs sm:text-sm">
              ✨
            </div>
          </div>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFavorite(!isFavorite);
          }}
          className={cn(
            "absolute top-2 right-2 sm:top-3 sm:right-3",
            product.featured && "top-9 sm:top-11",
            "w-6 h-6 sm:w-7 sm:h-7 rounded-full backdrop-blur-md transition-all duration-300",
            "flex items-center justify-center",
            isFavorite
              ? "bg-red-500/95 scale-110"
              : "bg-white/20 hover:bg-white/30 hover:scale-110"
          )}
        >
          <Heart
            className={cn(
              "w-3 h-3 sm:w-3.5 sm:h-3.5 transition-all duration-300",
              isFavorite ? "fill-white text-white" : "text-white"
            )}
          />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 lg:p-2">
          <div
            className={cn(
              "transition-all duration-300",
              isHovered
                ? "translate-y-0 opacity-100"
                : "translate-y-0.5 opacity-90"
            )}
          >
            <div className="flex items-end justify-between gap-1.5">
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm sm:text-base lg:text-sm xl:text-base leading-none mb-0.5">
                  ${product.price.toLocaleString("es-MX")}
                </p>
                <p className="text-white/90 text-[10px] sm:text-xs lg:text-[10px] font-medium leading-none">
                  MXN
                </p>
              </div>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                }}
                size="icon"
                className={cn(
                  "rounded-full transition-all duration-300 flex-shrink-0",
                  "bg-white hover:bg-white text-[#6C7466]",
                  "w-8 h-8 sm:w-9 sm:h-9 lg:w-8 lg:h-8",
                  "shadow-md hover:shadow-lg",
                  isHovered ? "scale-105 opacity-100" : "scale-100 opacity-95"
                )}
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-3.5 lg:h-3.5" />
              </Button>
            </div>
          </div>
        </div>
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent",
            "translate-x-[-200%] group-hover:translate-x-[200%]",
            "transition-transform duration-1000 pointer-events-none"
          )}
        />
      </div>
    </div>
  );
}
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
  const [showMoreDescription, setShowMoreDescription] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<
    "measurements" | "shipping" | "returns"
  >("measurements");

  // ✨ NUEVO: Estados para el zoom dinámico
  const [isZooming, setIsZooming] = React.useState(false);
  const [zoomPosition, setZoomPosition] = React.useState({ x: 0, y: 0 });
  const imageRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setSelectedImageIndex(0);
      setShowMoreDescription(false);
      setActiveTab("measurements");
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // ✨ NUEVO: Manejadores del zoom dinámico
const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
  if (!imageRef.current) return
  
  const rect = imageRef.current.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * 100
  const y = ((e.clientY - rect.top) / rect.height) * 100
  
  // Usar requestAnimationFrame para animación más fluida
  requestAnimationFrame(() => {
    setZoomPosition({ x, y })
  })
}

  const handleMouseEnter = () => {
    setIsZooming(true);
  };

  const handleMouseLeave = () => {
    setIsZooming(false);
  };

  if (!product) return null;
  const images = product.images || [product.image];
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] lg:max-w-[90vw] xl:max-w-[85vw] h-[95vh] overflow-hidden p-0 bg-white gap-0 border-0">
        {/* DialogTitle oculto para accesibilidad */}
        <DialogHeader className="sr-only">
          <DialogTitle>{product.name}</DialogTitle>
        </DialogHeader>
        {/* Botón de Cerrar Prominente */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-white hover:bg-gray-100 shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110 border-2 border-gray-200"
          aria-label="Cerrar"
        >
          <X
            className="w-6 h-6 lg:w-7 lg:h-7 text-[#2B2B2B]"
            strokeWidth={2.5}
          />
        </button>
        <div className="grid grid-cols-1 lg:grid-cols-2 h-full overflow-y-auto lg:overflow-hidden">
          {/* Sección de Imágenes - Izquierda */}
          <div className="bg-[#F8F7F5] p-6 lg:p-12 flex flex-col justify-center items-center overflow-y-auto">
            {/* Imagen Principal con Zoom Dinámico */}
            <div className="w-full max-w-2xl mb-6 lg:mb-8">
              <div
                ref={imageRef}
                className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-sm cursor-crosshair"
                onMouseMove={handleMouseMove}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                {/* Imagen Normal */}
                <Image
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  fill
                  className={cn(
                    "object-contain p-6 lg:p-8 transition-opacity duration-150",
                    isZooming && "opacity-0"
                  )}
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />

                {/* Imagen con Zoom - Solo visible cuando isZooming es true */}
                {isZooming && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      backgroundImage: `url(${images[selectedImageIndex]})`,
                      backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                      backgroundSize: '250%',
                      backgroundRepeat: 'no-repeat',
                      willChange: 'background-position',
                      imageRendering: 'auto'
                    }}
                  />
                )}

                {/* Indicador de Zoom */}
                {isZooming && (
                  <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm z-10">
                    🔍 Zoom activo
                  </div>
                )}
              </div>
            </div>
            {/* Galería de Miniaturas */}
            <div className="w-full max-w-2xl">
              <div className="grid grid-cols-4 gap-3 lg:gap-4">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "relative aspect-square rounded-xl overflow-hidden transition-all duration-300",
                      "bg-white shadow-sm hover:shadow-md",
                      selectedImageIndex === index
                        ? "ring-4 ring-[#6C7466] scale-105"
                        : "ring-2 ring-gray-200 hover:ring-[#6C7466]/50"
                    )}
                  >
                    <Image
                      src={img}
                      alt={`${product.name} - vista ${index + 1}`}
                      fill
                      className="object-cover p-2"
                      sizes="150px"
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Sección de Información - Derecha */}
          <div className="bg-white p-6 lg:p-12 flex flex-col overflow-y-auto">
            <div className="max-w-2xl mx-auto w-full">
              {/* Header con título y categoría */}
              <div className="mb-6 lg:mb-8">
                <Badge className="bg-[#6C7466]/10 text-[#6C7466] hover:bg-[#6C7466]/10 text-xs lg:text-sm px-3 py-1.5 mb-4 font-semibold">
                  {product.category}
                </Badge>
                <h2 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-[#2B2B2B] mb-3 leading-tight">
                  {product.name}
                </h2>
                {product.dimensions && (
                  <p className="text-sm lg:text-base text-gray-500">
                    {product.dimensions.height}
                  </p>
                )}
              </div>
              {/* Precio */}
              <div className="mb-8 lg:mb-10 pb-8 border-b border-gray-200">
                <p className="text-4xl lg:text-5xl font-bold text-[#6C7466]">
                  ${product.price.toLocaleString("es-MX")}
                  <span className="text-xl lg:text-2xl text-gray-500 font-normal ml-2">
                    MXN
                  </span>
                </p>
              </div>
              {/* Descripción */}
              {product.description && (
                <div className="mb-8 lg:mb-10">
                  <h3 className="text-lg lg:text-xl font-semibold text-[#2B2B2B] mb-3">
                    Descripción
                  </h3>
                  <p className="text-[#2B2B2B]/80 text-sm lg:text-base leading-relaxed">
                    {showMoreDescription
                      ? product.description
                      : product.description.substring(0, 200) +
                        (product.description.length > 200 ? "..." : "")}
                  </p>
                  {product.description.length > 200 && (
                    <button
                      onClick={() =>
                        setShowMoreDescription(!showMoreDescription)
                      }
                      className="text-[#6C7466] text-sm lg:text-base font-semibold mt-3 flex items-center gap-2 hover:text-[#6C7466]/80 transition-colors"
                    >
                      {showMoreDescription ? "Ver menos" : "Leer más"}
                      <span
                        className={cn(
                          "transition-transform duration-200",
                          showMoreDescription && "rotate-180"
                        )}
                      >
                        ▼
                      </span>
                    </button>
                  )}
                </div>
              )}
              {/* Botones de Acción */}
              <div className="mb-8 lg:mb-10 space-y-4">
                <Button
                  className="w-full bg-[#6C7466] hover:bg-[#6C7466]/90 text-white py-6 lg:py-7 text-base lg:text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Lógica para agregar al carrito
                  }}
                >
                  <ShoppingCart className="w-5 h-5 lg:w-6 lg:h-6 mr-3" />
                  Agregar al carrito
                </Button>
                {/* Stock Status */}
                {product.inStock && (
                  <div className="flex items-center justify-center gap-2 text-sm lg:text-base">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-700 font-medium">
                      Disponible en stock
                    </span>
                  </div>
                )}
              </div>
              {/* Tabs de Información */}
              <div className="border-t border-gray-200">
                {/* Tab Headers */}
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab("measurements")}
                    className={cn(
                      "flex-1 py-4 text-sm lg:text-base font-semibold uppercase tracking-wide transition-colors",
                      activeTab === "measurements"
                        ? "text-[#6C7466] border-b-2 border-[#6C7466]"
                        : "text-gray-500 hover:text-[#6C7466]"
                    )}
                  >
                    Medidas
                  </button>
                  <button
                    onClick={() => setActiveTab("shipping")}
                    className={cn(
                      "flex-1 py-4 text-sm lg:text-base font-semibold uppercase tracking-wide transition-colors",
                      activeTab === "shipping"
                        ? "text-[#6C7466] border-b-2 border-[#6C7466]"
                        : "text-gray-500 hover:text-[#6C7466]"
                    )}
                  >
                    Envío
                  </button>
                  <button
                    onClick={() => setActiveTab("returns")}
                    className={cn(
                      "flex-1 py-4 text-sm lg:text-base font-semibold uppercase tracking-wide transition-colors",
                      activeTab === "returns"
                        ? "text-[#6C7466] border-b-2 border-[#6C7466]"
                        : "text-gray-500 hover:text-[#6C7466]"
                    )}
                  >
                    Devoluciones
                  </button>
                </div>
                {/* Tab Content */}
                <div className="py-6">
                  {activeTab === "measurements" && product.dimensions && (
                    <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                      <div className="grid grid-cols-2 gap-4 text-sm lg:text-base">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="text-gray-600 block mb-1">
                            Altura
                          </span>
                          <span className="font-semibold text-[#2B2B2B]">
                            {product.dimensions.height}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="text-gray-600 block mb-1">
                            Ancho
                          </span>
                          <span className="font-semibold text-[#2B2B2B]">
                            {product.dimensions.width}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="text-gray-600 block mb-1">
                            Profundidad
                          </span>
                          <span className="font-semibold text-[#2B2B2B]">
                            {product.dimensions.depth}
                          </span>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="text-gray-600 block mb-1">Peso</span>
                          <span className="font-semibold text-[#2B2B2B]">
                            {product.dimensions.weight}
                          </span>
                        </div>
                      </div>
                      {product.material && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="text-gray-600 block mb-1">
                            Material
                          </span>
                          <span className="font-semibold text-[#2B2B2B]">
                            {product.material}
                          </span>
                        </div>
                      )}
                      {product.colors && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <span className="text-gray-600 block mb-1">
                            Colores
                          </span>
                          <span className="font-semibold text-[#2B2B2B]">
                            {product.colors}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                  {activeTab === "shipping" && (
                    <div className="space-y-4 text-sm lg:text-base text-[#2B2B2B]/80 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                      <p className="leading-relaxed">
                        Ofrecemos envío a toda la República Mexicana. Los
                        tiempos de entrega varían según tu ubicación:
                      </p>
                      <ul className="space-y-2 ml-4">
                        <li className="flex items-start">
                          <span className="text-[#6C7466] mr-2">•</span>
                          <span>
                            Ciudad de México y Área Metropolitana: 2-3 días
                            hábiles
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-[#6C7466] mr-2">•</span>
                          <span>Resto del país: 3-5 días hábiles</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-[#6C7466] mr-2">•</span>
                          <span>
                            Envío express disponible con costo adicional
                          </span>
                        </li>
                      </ul>
                    </div>
                  )}
                  {activeTab === "returns" && (
                    <div className="space-y-4 text-sm lg:text-base text-[#2B2B2B]/80 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                      <p className="leading-relaxed">
                        Aceptamos devoluciones dentro de los 30 días posteriores
                        a la compra. El producto debe estar en su estado
                        original y sin usar.
                      </p>
                      <ul className="space-y-2 ml-4">
                        <li className="flex items-start">
                          <span className="text-[#6C7466] mr-2">•</span>
                          <span>
                            Reembolso completo en compras con defectos de
                            fábrica
                          </span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-[#6C7466] mr-2">•</span>
                          <span>Cambio sin costo adicional</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-[#6C7466] mr-2">•</span>
                          <span>Proceso de devolución simple y rápido</span>
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

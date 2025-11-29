"use client";
import * as React from "react";
import Image from "next/image";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Heart,
  Star,
  Plus,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { products, Product } from "@/lib/products";
import { useCart } from "@/context/cart-context";

// ========================================
// 🧩 MAIN COMPONENT
// ========================================
export function ProductGrid({ products: propProducts }: { products?: Product[] }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Use passed products or fallback to empty array (or static if we wanted, but let's prefer props)
  const displayProducts = propProducts || products;

  const currentPage = Number(searchParams.get('page')) || 1;
  const ITEMS_PER_PAGE = 8;
  const totalPages = Math.ceil(displayProducts.length / ITEMS_PER_PAGE);

  const currentProducts = displayProducts.slice(
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
        {/* Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 md:pl-12">
          {currentProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
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
    </section>
  );
}

// ========================================
// 🎨 PRODUCT CARD
// ========================================
function ProductCard({
  product,
}: {
  product: Product;
}) {
  const [isFavorite, setIsFavorite] = React.useState(false);
  const { addItem } = useCart();

  return (
    <Link href={`/product/${product.slug}`} className="group cursor-pointer flex flex-col gap-4">
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
            e.preventDefault();
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

        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addItem(product);
          }}
          className="absolute bottom-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#6C7466] shadow-lg translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#6C7466] hover:text-white"
        >
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
    </Link>
  );
}
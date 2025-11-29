"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import {
    X,
    Package,
    TruckIcon,
    ShieldCheck,
    ChevronRight,
    ArrowRight,
    ArrowLeft,
    RefreshCcw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product } from "@/lib/products";
import { useCart } from "@/context/cart-context";

interface ProductViewProps {
    product: Product;
    prevProductSlug?: string;
    nextProductSlug?: string;
    collectionSlug?: string;
}

export function ProductView({ product, prevProductSlug, nextProductSlug, collectionSlug }: ProductViewProps) {
    const { addItem } = useCart();
    const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);
    const [activeTab, setActiveTab] = React.useState<"measurements" | "shipping" | "returns">("measurements");
    const [showMoreDescription, setShowMoreDescription] = React.useState(false);

    // Smooth Zoom Logic
    const [isZooming, setIsZooming] = React.useState(false);
    const [mousePosition, setMousePosition] = React.useState({ x: 50, y: 50 });
    const imageContainerRef = React.useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!imageContainerRef.current) return;
        const { left, top, width, height } = imageContainerRef.current.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMousePosition({ x, y });
    };

    const images = product.images || [product.image];

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row">
            {/* Floating Close Button (Back to Home) */}
            {/* Floating Close Button (Back) */}
            {/* Floating Close Button (Back) */}
            <Link
                href={collectionSlug ? `/collections/${collectionSlug}` : "/"}
                className="fixed top-4 right-4 z-50 p-2 bg-white/50 hover:bg-white rounded-full transition-colors backdrop-blur-md shadow-sm"
            >
                <X className="w-5 h-5 text-[#2B2B2B]" strokeWidth={1.5} />
            </Link>

            {/* LEFT SIDE: Image Gallery */}
            <div className="relative w-full md:w-[55%] lg:w-[60%] shrink-0 bg-[#EBEBE8] overflow-hidden group h-[50vh] md:h-screen sticky top-0">
                {/* Navigation Buttons */}
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

                {/* Image Container */}
                <div
                    ref={imageContainerRef}
                    className="w-full h-full cursor-zoom-in relative"
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
            <div className="flex-1 w-full md:w-[45%] lg:w-[40%] flex flex-col min-h-screen bg-[#FDFBF7]">

                {/* PRODUCT NAVIGATION ARROWS (Desktop: Fixed sides) */}
                {prevProductSlug && (
                    <Link
                        href={`/product/${prevProductSlug}`}
                        className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-white/40 hover:bg-white backdrop-blur-md rounded-full shadow-sm text-[#2B2B2B] transition-all hover:scale-105"
                        title="Previous Product"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                )}
                {nextProductSlug && (
                    <Link
                        href={`/product/${nextProductSlug}`}
                        className="hidden md:flex fixed right-4 top-1/2 -translate-y-1/2 z-40 p-3 bg-white/40 hover:bg-white backdrop-blur-md rounded-full shadow-sm text-[#2B2B2B] transition-all hover:scale-105"
                        title="Next Product"
                        style={{ right: '1rem' }}
                    >
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                )}
                {/* Scrollable Content Area */}
                <div className="flex-1 p-6 md:p-8 lg:p-12 pb-32"> {/* Added pb-32 for footer space */}

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                        <Link href="/" className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-gray-400 hover:text-[#6C7466] uppercase transition-colors">
                            Home
                        </Link>
                        <span className="h-px w-4 bg-[#6C7466]/30"></span>
                        <span className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-[#6C7466] uppercase truncate">
                            {product.category}
                        </span>
                    </div>

                    {/* Header Info */}
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-[#2B2B2B] mb-2 md:mb-4 leading-[1.1]">
                        {product.name}
                    </h1>
                    <p className="text-xl md:text-2xl lg:text-3xl font-light text-[#6C7466] mb-6 md:mb-8">
                        ${product.price.toLocaleString("en-US")} <span className="text-xs text-gray-400">MXN</span>
                    </p>

                    {/* Description */}
                    <div className="mb-8 text-gray-500 font-light leading-relaxed text-sm md:text-base">
                        <p>
                            {showMoreDescription ? (
                                <div dangerouslySetInnerHTML={{ __html: product.description || "" }} />
                            ) : (
                                <div dangerouslySetInnerHTML={{
                                    __html: (product.description?.substring(0, 180) || "") + (product.description && product.description.length > 180 ? "..." : "")
                                }} />
                            )}
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

                {/* Footer Actions (Fixed at bottom right on desktop, fixed bottom on mobile) */}
                <div className="p-6 md:p-8 lg:p-10 border-t border-[#6C7466]/10 bg-[#FDFBF7] shrink-0 sticky bottom-0 z-40">
                    <Button
                        onClick={() => addItem(product)}
                        className="w-full bg-[#2B2B2B] text-white hover:bg-[#6C7466] transition-colors h-12 md:h-14 rounded-none text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-3"
                    >
                        Add to Cart — ${product.price.toLocaleString("en-US")}
                    </Button>
                    <div className="flex justify-center items-center gap-3 text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure</span>
                        <span>•</span>
                        <span>Worldwide Shipping</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

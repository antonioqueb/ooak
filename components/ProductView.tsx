"use client";

import * as React from "react";
import Image from "next/image";
import { ImageZoom } from "@/components/ImageZoom";
import Link from "next/link";
import {
    ShieldCheck,
    ChevronRight,
    ArrowRight,
    ArrowLeft,
    Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Product } from "@/lib/products";
import { useCart } from "@/context/cart-context";

interface ProductViewProps {
    product: Product;
    collectionSlug?: string;
}

type MediaItem =
    | { type: "image"; src: string }
    | { type: "video"; src: string; poster?: string; mimetype?: string };

export function ProductView({ product, collectionSlug }: ProductViewProps) {
    const { addItem, isInCart } = useCart();
    const alreadyInCart = isInCart(product.id);
    const [selectedMediaIndex, setSelectedMediaIndex] = React.useState(0);
    const [showMoreDescription, setShowMoreDescription] = React.useState(false);
    const videoRef = React.useRef<HTMLVideoElement | null>(null);

    const media: MediaItem[] = React.useMemo(() => {
        const images = (product.images && product.images.length > 0)
            ? product.images
            : [product.image];
        const [mainImage, ...restImages] = images;
        const items: MediaItem[] = [{ type: "image", src: mainImage }];
        if (product.hasVideo && product.video?.url) {
            items.push({
                type: "video",
                src: product.video.url,
                poster: product.video.poster,
                mimetype: product.video.mimetype,
            });
        }
        for (const img of restImages) {
            items.push({ type: "image", src: img });
        }
        return items;
    }, [product.image, product.images, product.hasVideo, product.video]);

    const currentMedia = media[selectedMediaIndex] ?? media[0];

    React.useEffect(() => {
        if (currentMedia?.type !== "video" && videoRef.current) {
            videoRef.current.pause();
        }
    }, [currentMedia]);

    const handlePrevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedMediaIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
    };

    const handleNextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedMediaIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
    };

    const goToPrev = React.useCallback(() => {
        setSelectedMediaIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
    }, [media.length]);

    const goToNext = React.useCallback(() => {
        setSelectedMediaIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
    }, [media.length]);

    React.useEffect(() => {
        if (media.length <= 1) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const tag = target?.tagName;
            if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
            if (e.key === "ArrowLeft") {
                goToPrev();
            } else if (e.key === "ArrowRight") {
                goToNext();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [goToPrev, goToNext, media.length]);

    const swipeRef = React.useRef<{ x: number; y: number } | null>(null);
    const SWIPE_THRESHOLD = 50;

    const handleGalleryTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length !== 1) return;
        swipeRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
        };
    };

    const handleGalleryTouchEnd = (e: React.TouchEvent) => {
        const start = swipeRef.current;
        swipeRef.current = null;
        if (!start) return;
        if (e.changedTouches.length === 0) return;
        if (media.length <= 1) return;
        const dx = e.changedTouches[0].clientX - start.x;
        const dy = e.changedTouches[0].clientY - start.y;
        if (Math.abs(dx) < SWIPE_THRESHOLD) return;
        if (Math.abs(dx) < Math.abs(dy) * 1.5) return;
        if (dx < 0) {
            goToNext();
        } else {
            goToPrev();
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row">
            {/* LEFT SIDE: Image Gallery */}
            <div
                className="relative w-full md:w-[55%] lg:w-[60%] shrink-0 bg-white overflow-hidden group h-[50vh] md:h-screen sticky top-0"
                onTouchStart={handleGalleryTouchStart}
                onTouchEnd={handleGalleryTouchEnd}
            >
                {/* Navigation Buttons */}
                {media.length > 1 && (
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

                {/* Media Container */}
                <div className="w-full h-full relative flex items-center justify-center p-8 bg-white">
                    {currentMedia?.type === "video" ? (
                        <video
                            ref={videoRef}
                            key={currentMedia.src}
                            src={currentMedia.src}
                            poster={currentMedia.poster}
                            controls
                            playsInline
                            preload="metadata"
                            className="w-full h-full object-contain"
                        >
                            {currentMedia.mimetype && (
                                <source src={currentMedia.src} type={currentMedia.mimetype} />
                            )}
                        </video>
                    ) : (
                        <ImageZoom
                            src={currentMedia?.src ?? product.image}
                            alt={product.name}
                        />
                    )}
                    {product.isSold && (
                        <div className="absolute top-8 -right-12 z-30 rotate-45 bg-[#2B2B2B] text-white px-16 py-2 text-[10px] md:text-xs font-bold tracking-[0.3em] uppercase shadow-lg pointer-events-none">
                            Sold
                        </div>
                    )}
                </div>

                {/* Thumbnails */}
                {media.length > 1 && (
                    <div className="absolute bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-2 py-2 bg-white/60 backdrop-blur-md rounded-lg shadow-sm max-w-[calc(100%-1.5rem)] overflow-x-auto scrollbar-hide">
                        {media.map((item, index) => {
                            const isActive = selectedMediaIndex === index;
                            const thumbSrc = item.type === "video"
                                ? (item.poster ?? product.image)
                                : item.src;
                            const ariaLabel = item.type === "video"
                                ? "Ver video del producto"
                                : `Ver imagen ${index + 1}`;
                            return (
                                <button
                                    key={`thumb-${index}`}
                                    onClick={(e) => { e.stopPropagation(); setSelectedMediaIndex(index); }}
                                    onTouchStart={(e) => e.stopPropagation()}
                                    onTouchEnd={(e) => e.stopPropagation()}
                                    aria-label={ariaLabel}
                                    className={cn(
                                        "relative shrink-0 w-14 h-14 md:w-16 md:h-16 overflow-hidden rounded-sm transition-all duration-200 border-2 bg-white",
                                        isActive
                                            ? "border-[#2B2B2B] opacity-100"
                                            : "border-transparent opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <Image
                                        src={thumbSrc}
                                        alt={`Miniatura ${index + 1}`}
                                        fill
                                        sizes="64px"
                                        className="object-cover"
                                        unoptimized
                                    />
                                    {item.type === "video" && (
                                        <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                                            <Play className="w-4 h-4 text-white fill-white" />
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* RIGHT SIDE: Details */}
            <div className="flex-1 w-full md:w-[45%] lg:w-[40%] flex flex-col min-h-screen bg-[#FDFBF7]">

                {/* Scrollable Content Area */}
                <div className="flex-1 p-6 md:p-8 lg:p-12 pb-32"> {/* Added pb-32 for footer space */}

                    {/* Breadcrumb */}
                    <div className="flex items-center gap-3 mb-4 md:mb-6">
                        <Link href="/" className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-gray-400 hover:text-[#6C7466] uppercase transition-colors">
                            Home
                        </Link>
                        <span className="h-px w-4 bg-[#6C7466]/30"></span>
                        <Link
                            href={collectionSlug ? `/collections/${collectionSlug}` : "/"}
                            className="text-[10px] md:text-xs font-bold tracking-[0.25em] text-[#6C7466] hover:text-[#2B2B2B] uppercase truncate transition-colors"
                        >
                            {product.category}
                        </Link>
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
                        {(() => {
                            const shortHtml =
                                product.shortDescription ||
                                (product.description
                                    ? product.description.length > 180
                                        ? product.description.substring(0, 180) + "..."
                                        : product.description
                                    : "");
                            const longHtml = product.longDescription || "";
                            const hasMore = Boolean(longHtml);

                            return (
                                <>
                                    <div className="prose prose-sm max-w-none text-gray-500">
                                        <div dangerouslySetInnerHTML={{ __html: shortHtml }} />
                                        {hasMore && showMoreDescription && (
                                            <div className="mt-4" dangerouslySetInnerHTML={{ __html: longHtml }} />
                                        )}
                                    </div>
                                    {hasMore && (
                                        <button
                                            onClick={() => setShowMoreDescription(!showMoreDescription)}
                                            className="text-[#6C7466] text-[10px] md:text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2 hover:text-[#2B2B2B] transition-colors"
                                        >
                                            {showMoreDescription ? "Read Less" : "Read More"}
                                            <ChevronRight className={cn("w-3 h-3 transition-transform", showMoreDescription && "rotate-90")} />
                                        </button>
                                    )}
                                </>
                            );
                        })()}
                    </div>

                    <div className="border-t border-b border-[#6C7466]/10 py-4 md:py-6 mb-6">
                        <div className="mb-4">
                            <span className="text-[10px] md:text-xs font-bold tracking-widest uppercase text-[#2B2B2B] pb-1 border-b-2 border-[#2B2B2B]">
                                Details
                            </span>
                        </div>

                        <div className="min-h-[80px]">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><span className="block text-[10px] text-gray-400 uppercase">Dimensions</span><span className="text-[#2B2B2B]">{product.dimensions?.height} x {product.dimensions?.width} x {product.dimensions?.depth}</span></div>
                                {product.dimensions?.weight && parseFloat(String(product.dimensions.weight)) !== 0 && !isNaN(parseFloat(String(product.dimensions.weight))) && (
                                    <div><span className="block text-[10px] text-gray-400 uppercase">Weight</span><span className="text-[#2B2B2B]">{product.dimensions.weight}</span></div>
                                )}
                                <div className="col-span-2"><span className="block text-[10px] text-gray-400 uppercase">Material</span><span className="text-[#2B2B2B]">{product.material}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions (Fixed at bottom right on desktop, fixed bottom on mobile) */}
                <div className="p-6 md:p-8 lg:p-10 border-t border-[#6C7466]/10 bg-[#FDFBF7] shrink-0 sticky bottom-0 z-40">
                    <Button
                        onClick={() => addItem(product)}
                        disabled={product.isSold || alreadyInCart}
                        className="w-full bg-[#2B2B2B] text-white hover:bg-[#6C7466] transition-colors h-12 md:h-14 rounded-none text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase mb-3 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
                    >
                        {product.isSold
                            ? "Sold"
                            : alreadyInCart
                                ? "In Cart — One of a Kind"
                                : `Add to Cart — $${product.price.toLocaleString("en-US")}`}
                    </Button>
                    <div className="flex justify-center items-center gap-3 text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Secure</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

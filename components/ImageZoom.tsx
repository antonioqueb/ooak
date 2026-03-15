"use client";

import * as React from "react";
import Image from "next/image";

interface ImageZoomProps {
    src: string;
    alt: string;
    zoomScale?: number;
    lensSize?: number;
}

export function ImageZoom({
    src,
    alt,
    zoomScale = 2.5,
    lensSize = 150,
}: ImageZoomProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isZooming, setIsZooming] = React.useState(false);
    const [cursorPos, setCursorPos] = React.useState({ x: 0, y: 0 });
    const [imgNaturalSize, setImgNaturalSize] = React.useState({ w: 0, h: 0 });
    const [containerSize, setContainerSize] = React.useState({ w: 0, h: 0 });
    const [isTouchDevice, setIsTouchDevice] = React.useState(false);

    // Detect touch device
    React.useEffect(() => {
        setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    }, []);

    // Track container size
    React.useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setContainerSize({
                    w: entry.contentRect.width,
                    h: entry.contentRect.height,
                });
            }
        });
        observer.observe(container);
        return () => observer.disconnect();
    }, []);

    // Reset zoom when image changes
    React.useEffect(() => {
        setIsZooming(false);
    }, [src]);

    const actualLensSize = isTouchDevice ? Math.max(120, lensSize) : lensSize;

    const getCursorPosition = (
        e: React.MouseEvent | React.TouchEvent
    ): { x: number; y: number } | null => {
        const container = containerRef.current;
        if (!container) return null;
        const rect = container.getBoundingClientRect();
        let clientX: number, clientY: number;
        if ("touches" in e) {
            if (e.touches.length === 0) return null;
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }
        return {
            x: Math.max(0, Math.min(clientX - rect.left, rect.width)),
            y: Math.max(0, Math.min(clientY - rect.top, rect.height)),
        };
    };

    // ---------- Mouse handlers (desktop) ----------
    const handleMouseEnter = () => {
        if (!isTouchDevice) setIsZooming(true);
    };
    const handleMouseLeave = () => {
        if (!isTouchDevice) setIsZooming(false);
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isTouchDevice) {
            const pos = getCursorPosition(e);
            if (pos) setCursorPos(pos);
        }
    };

    // ---------- Touch handlers (mobile) ----------
    const handleTouchStart = (e: React.TouchEvent) => {
        if (isTouchDevice) {
            e.preventDefault();
            setIsZooming(true);
            const pos = getCursorPosition(e);
            if (pos) setCursorPos(pos);
        }
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (isTouchDevice && isZooming) {
            e.preventDefault();
            const pos = getCursorPosition(e);
            if (pos) setCursorPos(pos);
        }
    };
    const handleTouchEnd = () => {
        if (isTouchDevice) setIsZooming(false);
    };

    // Compute the background-position for the zoom lens
    const getBackgroundProps = (): React.CSSProperties => {
        if (containerSize.w === 0 || containerSize.h === 0) return {};

        // Percentages relative to container
        const pctX = (cursorPos.x / containerSize.w) * 100;
        const pctY = (cursorPos.y / containerSize.h) * 100;

        return {
            backgroundImage: `url(${src})`,
            backgroundSize: `${containerSize.w * zoomScale}px ${containerSize.h * zoomScale}px`,
            backgroundPosition: `${pctX}% ${pctY}%`,
            backgroundRepeat: "no-repeat",
        };
    };

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden"
            style={{ cursor: isZooming ? "none" : "zoom-in" }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Base product image */}
            <Image
                src={src}
                alt={alt}
                fill
                className="object-contain pointer-events-none select-none"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
                onLoad={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                }}
            />

            {/* Magnifying-glass lens */}
            {isZooming && (
                <div
                    className="pointer-events-none absolute z-40"
                    style={{
                        width: actualLensSize,
                        height: actualLensSize,
                        borderRadius: "50%",
                        left: cursorPos.x - actualLensSize / 2,
                        top: cursorPos.y - actualLensSize / 2,
                        ...getBackgroundProps(),
                        border: "3px solid rgba(255,255,255,0.6)",
                        boxShadow:
                            "0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.08), inset 0 0 30px rgba(255,255,255,0.08)",
                        backdropFilter: "blur(1px)",
                        transition: "opacity 0.15s ease, transform 0.1s ease",
                        animation: "lensIn 0.2s ease-out",
                    }}
                />
            )}

            {/* Crosshair dot at cursor when zooming */}
            {isZooming && (
                <div
                    className="pointer-events-none absolute z-50"
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(0,0,0,0.3)",
                        left: cursorPos.x - 3,
                        top: cursorPos.y - 3,
                    }}
                />
            )}

            {/* Hint label */}
            {!isZooming && (
                <div
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none
                        px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md
                        text-white text-[10px] font-semibold tracking-widest uppercase
                        opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                    {isTouchDevice ? "Tap to zoom" : "Hover to zoom"}
                </div>
            )}

            {/* Keyframe animation injected via style tag */}
            <style jsx>{`
                @keyframes lensIn {
                    0% {
                        opacity: 0;
                        transform: scale(0.7);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
}

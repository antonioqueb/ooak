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
    zoomScale = 3.5,
    lensSize = 220,
}: ImageZoomProps) {
    const containerRef = React.useRef<HTMLDivElement>(null);

    const [isZooming, setIsZooming] = React.useState(false);
    const [cursorPos, setCursorPos] = React.useState({ x: 0, y: 0 });
    const [imgNaturalSize, setImgNaturalSize] = React.useState({ w: 0, h: 0 });
    const [containerSize, setContainerSize] = React.useState({ w: 0, h: 0 });
    const [isTouchDevice, setIsTouchDevice] = React.useState(false);
    const [isMobileModalOpen, setIsMobileModalOpen] = React.useState(false);

    // ----- mobile zoom state -----
    const [viewportSize, setViewportSize] = React.useState({ w: 0, h: 0 });
    const [mobileTranslate, setMobileTranslate] = React.useState({ x: 0, y: 0 });

    const dragRef = React.useRef<{
        active: boolean;
        lastX: number;
        lastY: number;
    }>({
        active: false,
        lastX: 0,
        lastY: 0,
    });

    const mobileGestureRef = React.useRef<{
        justOpenedFromTouch: boolean;
    }>({
        justOpenedFromTouch: false,
    });

    const rafRef = React.useRef<number | null>(null);
    const pendingTranslateRef = React.useRef<{ x: number; y: number } | null>(null);

    React.useEffect(() => {
        setIsTouchDevice("ontouchstart" in window || navigator.maxTouchPoints > 0);
    }, []);

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

    React.useEffect(() => {
        setIsZooming(false);
        setIsMobileModalOpen(false);
        setMobileTranslate({ x: 0, y: 0 });
        dragRef.current.active = false;
        mobileGestureRef.current.justOpenedFromTouch = false;

        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        pendingTranslateRef.current = null;
    }, [src]);

    React.useEffect(() => {
        if (!isMobileModalOpen) return;

        const updateViewport = () => {
            setViewportSize({
                w: window.innerWidth,
                h: window.innerHeight,
            });
        };

        updateViewport();
        window.addEventListener("resize", updateViewport);

        return () => {
            window.removeEventListener("resize", updateViewport);
        };
    }, [isMobileModalOpen]);

    React.useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    const actualLensSize = isTouchDevice ? Math.max(120, lensSize) : lensSize;

    const clamp = (value: number, min: number, max: number) =>
        Math.min(Math.max(value, min), max);

    const getCursorPosition = (
        e: React.MouseEvent | React.TouchEvent
    ): { x: number; y: number } | null => {
        const container = containerRef.current;
        if (!container) return null;

        const rect = container.getBoundingClientRect();

        let clientX: number;
        let clientY: number;

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

    // área real visible de la imagen usando object-contain
    const getContainedImageRect = (
        boxW: number,
        boxH: number,
        imgW: number,
        imgH: number
    ) => {
        if (!boxW || !boxH || !imgW || !imgH) {
            return { x: 0, y: 0, w: boxW, h: boxH };
        }

        const boxRatio = boxW / boxH;
        const imgRatio = imgW / imgH;

        let w = 0;
        let h = 0;

        if (imgRatio > boxRatio) {
            w = boxW;
            h = boxW / imgRatio;
        } else {
            h = boxH;
            w = boxH * imgRatio;
        }

        return {
            x: (boxW - w) / 2,
            y: (boxH - h) / 2,
            w,
            h,
        };
    };

    const getMobileBaseSize = () => {
        const rect = getContainedImageRect(
            viewportSize.w,
            viewportSize.h,
            imgNaturalSize.w,
            imgNaturalSize.h
        );

        return { w: rect.w, h: rect.h };
    };

    const getZoomedImageMetrics = () => {
        const base = getMobileBaseSize();
        const zoomedW = base.w * zoomScale;
        const zoomedH = base.h * zoomScale;

        return {
            baseW: base.w,
            baseH: base.h,
            zoomedW,
            zoomedH,
        };
    };

    const clampMobileTranslate = React.useCallback(
        (x: number, y: number) => {
            const { zoomedW, zoomedH } = getZoomedImageMetrics();

            const minX = Math.min(0, viewportSize.w - zoomedW);
            const maxX = 0;

            const minY = Math.min(0, viewportSize.h - zoomedH);
            const maxY = 0;

            return {
                x:
                    zoomedW > viewportSize.w
                        ? clamp(x, minX, maxX)
                        : (viewportSize.w - zoomedW) / 2,
                y:
                    zoomedH > viewportSize.h
                        ? clamp(y, minY, maxY)
                        : (viewportSize.h - zoomedH) / 2,
            };
        },
        [viewportSize.w, viewportSize.h, zoomScale, imgNaturalSize.w, imgNaturalSize.h]
    );

    const setMobileTranslateSmooth = React.useCallback((next: { x: number; y: number }) => {
        pendingTranslateRef.current = next;

        if (rafRef.current !== null) return;

        rafRef.current = requestAnimationFrame(() => {
            if (pendingTranslateRef.current) {
                setMobileTranslate(pendingTranslateRef.current);
            }
            pendingTranslateRef.current = null;
            rafRef.current = null;
        });
    }, []);

    // ---------- Mouse handlers (desktop) ----------
    const handleMouseEnter = () => {
        if (!isTouchDevice) setIsZooming(true);
    };

    const handleMouseLeave = () => {
        if (!isTouchDevice) setIsZooming(false);
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isTouchDevice) {
            if (!isZooming) setIsZooming(true);
            const pos = getCursorPosition(e);
            if (pos) setCursorPos(pos);
        }
    };

    // ---------- Mobile open at touched point ----------
    const openMobileZoomAtPoint = (clientX: number, clientY: number) => {
        const container = containerRef.current;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (!container || !imgNaturalSize.w || !imgNaturalSize.h) {
            setViewportSize({ w: vw, h: vh });
            setIsMobileModalOpen(true);
            return { x: 0, y: 0 };
        }

        const rect = container.getBoundingClientRect();
        const localX = clientX - rect.left;
        const localY = clientY - rect.top;

        const contained = getContainedImageRect(
            rect.width,
            rect.height,
            imgNaturalSize.w,
            imgNaturalSize.h
        );

        const relativeX = clamp(localX - contained.x, 0, contained.w);
        const relativeY = clamp(localY - contained.y, 0, contained.h);

        const u = contained.w ? relativeX / contained.w : 0.5;
        const v = contained.h ? relativeY / contained.h : 0.5;

        const targetRect = getContainedImageRect(
            vw,
            vh,
            imgNaturalSize.w,
            imgNaturalSize.h
        );

        const zoomedW = targetRect.w * zoomScale;
        const zoomedH = targetRect.h * zoomScale;

        const rawX = vw / 2 - u * zoomedW;
        const rawY = vh / 2 - v * zoomedH;

        const minX = Math.min(0, vw - zoomedW);
        const minY = Math.min(0, vh - zoomedH);

        const nextTranslate = {
            x: zoomedW > vw ? clamp(rawX, minX, 0) : (vw - zoomedW) / 2,
            y: zoomedH > vh ? clamp(rawY, minY, 0) : (vh - zoomedH) / 2,
        };

        setViewportSize({ w: vw, h: vh });
        setMobileTranslate(nextTranslate);
        setIsMobileModalOpen(true);

        return nextTranslate;
    };

    const handleContainerClick = () => {
        // En móvil no usamos click para evitar dobles disparos y "saltos".
        if (isTouchDevice) return;
    };

    const handleContainerTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!isTouchDevice) return;
        if (e.touches.length !== 1) return;
        if (isMobileModalOpen) return;

        const touch = e.touches[0];
        const nextTranslate = openMobileZoomAtPoint(touch.clientX, touch.clientY);

        dragRef.current = {
            active: true,
            lastX: touch.clientX,
            lastY: touch.clientY,
        };

        mobileGestureRef.current.justOpenedFromTouch = true;
        pendingTranslateRef.current = nextTranslate;
    };

    // ---------- Mobile pan ----------
    const handleMobileTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
        if (e.touches.length !== 1) return;

        const touch = e.touches[0];

        dragRef.current = {
            active: true,
            lastX: touch.clientX,
            lastY: touch.clientY,
        };

        if (mobileGestureRef.current.justOpenedFromTouch) {
            mobileGestureRef.current.justOpenedFromTouch = false;
        }
    };

    const handleMobileTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
        if (!dragRef.current.active || e.touches.length !== 1) return;

        e.preventDefault();

        const touch = e.touches[0];
        const dx = touch.clientX - dragRef.current.lastX;
        const dy = touch.clientY - dragRef.current.lastY;

        dragRef.current.lastX = touch.clientX;
        dragRef.current.lastY = touch.clientY;

        const next = clampMobileTranslate(
            mobileTranslate.x + dx,
            mobileTranslate.y + dy
        );

        setMobileTranslateSmooth(next);
    };

    const handleMobileTouchEnd = () => {
        dragRef.current.active = false;
        mobileGestureRef.current.justOpenedFromTouch = false;
    };

    const handleCloseMobile = () => {
        setIsMobileModalOpen(false);
        dragRef.current.active = false;
        mobileGestureRef.current.justOpenedFromTouch = false;

        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
        }
        pendingTranslateRef.current = null;
    };

    const getBackgroundProps = (): React.CSSProperties => {
        if (containerSize.w === 0 || containerSize.h === 0) return {};

        const pctX = (cursorPos.x / containerSize.w) * 100;
        const pctY = (cursorPos.y / containerSize.h) * 100;

        return {
            backgroundImage: `url(${src})`,
            backgroundSize: `${containerSize.w * zoomScale}px ${containerSize.h * zoomScale}px`,
            backgroundPosition: `${pctX}% ${pctY}%`,
            backgroundRepeat: "no-repeat",
        };
    };

    const lensLeft = cursorPos.x - actualLensSize / 2;
    const lensTop = cursorPos.y - actualLensSize / 2;
    const mobileMetrics = getZoomedImageMetrics();

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full overflow-hidden"
            style={{ cursor: isZooming ? "none" : "zoom-in" }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
            onClick={handleContainerClick}
            onTouchStart={handleContainerTouchStart}
        >
            <Image
                src={src}
                alt={alt}
                fill
                className="object-contain pointer-events-none select-none"
                sizes="(max-width: 768px) 100vw, 60vw"
                priority
                unoptimized
                onLoad={(e) => {
                    const img = e.currentTarget as HTMLImageElement;
                    setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
                }}
            />

            {isZooming && !isTouchDevice && (
                <div
                    className="pointer-events-none absolute z-40"
                    style={{
                        width: actualLensSize,
                        height: actualLensSize,
                        borderRadius: "50%",
                        left: lensLeft,
                        top: lensTop,
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

            {isZooming && !isTouchDevice && (
                <div
                    className="pointer-events-none absolute z-50"
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        backgroundColor: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(0,0,0,0.3)",
                        left: lensLeft + actualLensSize / 2 - 3,
                        top: lensTop + actualLensSize / 2 - 3,
                    }}
                />
            )}

            {!isZooming && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-semibold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {isTouchDevice ? "Tap to zoom" : "Hover to zoom"}
                </div>
            )}

            {isMobileModalOpen && isTouchDevice && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 overflow-hidden touch-none"
                    onClick={handleCloseMobile}
                >
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCloseMobile();
                        }}
                        className="fixed top-6 right-6 z-[120] flex flex-col items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md p-3 transition-colors active:scale-95 border border-white/20"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                        >
                            <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
                        </svg>
                        <span className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-70">
                            Cerrar
                        </span>
                    </button>

                    <div
                        className="absolute inset-0 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        onTouchStart={handleMobileTouchStart}
                        onTouchMove={handleMobileTouchMove}
                        onTouchEnd={handleMobileTouchEnd}
                        onTouchCancel={handleMobileTouchEnd}
                    >
                        <div
                            className="absolute top-0 left-0 will-change-transform"
                            style={{
                                width: `${mobileMetrics.zoomedW}px`,
                                height: `${mobileMetrics.zoomedH}px`,
                                transform: `translate3d(${mobileTranslate.x}px, ${mobileTranslate.y}px, 0)`,
                                transition: dragRef.current.active ? "none" : "none",
                            }}
                        >
                            <Image
                                src={src}
                                alt={alt}
                                width={Math.max(1, Math.round(mobileMetrics.zoomedW))}
                                height={Math.max(1, Math.round(mobileMetrics.zoomedH))}
                                className="block select-none pointer-events-none"
                                unoptimized
                                priority
                                draggable={false}
                            />
                        </div>
                    </div>
                </div>
            )}

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                        @keyframes lensIn {
                            0% { opacity: 0; transform: scale(0.7); }
                            100% { opacity: 1; transform: scale(1); }
                        }
                    `,
                }}
            />
        </div>
    );
}
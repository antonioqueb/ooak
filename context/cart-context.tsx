"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { Product } from "@/lib/products";

export interface CartItem extends Product {
    quantity: number;
}

export const TAX_RATE = 0.16;

// Máximo de unidades que se pueden llevar de un producto. Piezas únicas (o
// productos de un backend anterior sin available_qty): 1.
export function getMaxQuantity(product: Product): number {
    if (product.isSold) return 0;
    const qty = product.availableQty;
    if (typeof qty === "number" && Number.isFinite(qty)) {
        return Math.max(Math.floor(qty), 0);
    }
    return 1;
}

// Un producto se trata como "one of a kind" en la UI cuando solo se puede
// llevar una unidad.
export function isSinglePiece(product: Product): boolean {
    return getMaxQuantity(product) <= 1;
}

export function formatStockLimitMessage(max: number): string {
    return max === 1
        ? "Only 1 piece available"
        : `Only ${max} pieces available`;
}

export interface StockNotice {
    productId: string;
    message: string;
}

interface CartContextType {
    items: CartItem[];
    isCartOpen: boolean;
    addItem: (product: Product, quantity?: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    getItemQuantity: (productId: string) => number;
    isInCart: (productId: string) => boolean;
    clearCart: () => void;
    toggleCart: () => void;
    // Aviso "Only N pieces available". Se limpia solo tras unos segundos.
    stockNotice: StockNotice | null;
    showStockNotice: (productId: string, max: number) => void;
    cartSubtotal: number;
    cartTax: number;
    cartTotal: number;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STOCK_NOTICE_MS = 4000;

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [stockNotice, setStockNotice] = useState<StockNotice | null>(null);
    const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem("cart");
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Failed to parse cart from localStorage", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever items change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("cart", JSON.stringify(items));
        }
    }, [items, isLoaded]);

    useEffect(() => () => {
        if (noticeTimer.current) clearTimeout(noticeTimer.current);
    }, []);

    const showStockNotice = useCallback((productId: string, max: number) => {
        if (noticeTimer.current) clearTimeout(noticeTimer.current);
        setStockNotice({ productId, message: formatStockLimitMessage(max) });
        noticeTimer.current = setTimeout(() => setStockNotice(null), STOCK_NOTICE_MS);
    }, []);

    const addItem = (product: Product, quantity: number = 1) => {
        if (product.isSold) return;
        const max = getMaxQuantity(product);
        if (max <= 0) return;

        const existing = items.find((item) => item.id === product.id);
        const current = existing?.quantity ?? 0;
        const requested = current + Math.max(Math.floor(quantity), 1);
        const next = Math.min(requested, max);

        if (requested > max) {
            showStockNotice(product.id, max);
        }
        if (next === current) {
            setIsCartOpen(true);
            return;
        }

        setItems((prev) => {
            if (prev.some((item) => item.id === product.id)) {
                return prev.map((item) =>
                    item.id === product.id ? { ...item, quantity: next } : item
                );
            }
            return [...prev, { ...product, quantity: next }];
        });
        setIsCartOpen(true);
    };

    const removeItem = (productId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== productId));
    };

    // Fija la cantidad de un ítem. Si supera lo disponible, regresa al máximo
    // y muestra el aviso. Con 0 o menos, se quita del carrito.
    const updateQuantity = (productId: string, quantity: number) => {
        const item = items.find((i) => i.id === productId);
        if (!item) return;

        const max = getMaxQuantity(item);
        const wanted = Math.floor(Number(quantity));
        if (!Number.isFinite(wanted) || wanted <= 0) {
            removeItem(productId);
            return;
        }

        const next = Math.min(wanted, max);
        if (wanted > max) {
            showStockNotice(productId, max);
        }
        if (next <= 0) {
            removeItem(productId);
            return;
        }

        setItems((prev) =>
            prev.map((i) => (i.id === productId ? { ...i, quantity: next } : i))
        );
    };

    const getItemQuantity = (productId: string) =>
        items.find((item) => item.id === productId)?.quantity ?? 0;

    const isInCart = (productId: string) =>
        items.some((item) => item.id === productId);

    const clearCart = () => {
        setItems([]);
    };

    const toggleCart = () => {
        setIsCartOpen((prev) => !prev);
    };

    const cartSubtotal = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    const cartTax = Math.round(cartSubtotal * TAX_RATE * 100) / 100;
    const cartTotal = Math.round((cartSubtotal + cartTax) * 100) / 100;

    const cartCount = items.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                isCartOpen,
                addItem,
                removeItem,
                updateQuantity,
                getItemQuantity,
                isInCart,
                clearCart,
                toggleCart,
                stockNotice,
                showStockNotice,
                cartSubtotal,
                cartTax,
                cartTotal,
                cartCount,
            }}
        >
            {children}
            {stockNotice && (
                <div
                    role="alert"
                    aria-live="polite"
                    className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-[#2B2B2B] text-white px-5 py-3 rounded-sm shadow-lg text-[11px] font-bold tracking-[0.2em] uppercase animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-none"
                >
                    {stockNotice.message}
                </div>
            )}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider");
    }
    return context;
}

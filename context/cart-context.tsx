"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/lib/products";

export interface CartItem extends Product {
    quantity: number;
}

export const TAX_RATE = 0.16;

interface CartContextType {
    items: CartItem[];
    isCartOpen: boolean;
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    isInCart: (productId: string) => boolean;
    clearCart: () => void;
    toggleCart: () => void;
    cartSubtotal: number;
    cartTax: number;
    cartTotal: number;
    cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

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

    const addItem = (product: Product) => {
        if (product.isSold) return;
        setItems((prev) => {
            if (prev.some((item) => item.id === product.id)) return prev;
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeItem = (productId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== productId));
    };

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
                isInCart,
                clearCart,
                toggleCart,
                cartSubtotal,
                cartTax,
                cartTotal,
                cartCount,
            }}
        >
            {children}
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

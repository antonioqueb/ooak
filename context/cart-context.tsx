"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Product } from "@/lib/products";

export interface CartItem extends Product {
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    isCartOpen: boolean;
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    toggleCart: () => void;
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
        setItems((prev) => {
            const existing = prev.find((item) => item.id === product.id);
            if (existing) {
                return prev.map((item) =>
                    item.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }
            return [...prev, { ...product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const removeItem = (productId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== productId));
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity < 1) {
            removeItem(productId);
            return;
        }
        setItems((prev) =>
            prev.map((item) =>
                item.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const toggleCart = () => {
        setIsCartOpen((prev) => !prev);
    };

    const cartTotal = items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    const cartCount = items.reduce((count, item) => count + item.quantity, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                isCartOpen,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                toggleCart,
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

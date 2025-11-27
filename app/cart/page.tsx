"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { cn } from "@/lib/utils";

export default function CartPage() {
    const { items, removeItem, updateQuantity, cartTotal } = useCart();

    if (items.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FDFBF7] text-[#2B2B2B]">
                <h1 className="text-3xl font-serif mb-4">Your cart is empty</h1>
                <p className="text-gray-500 mb-8">Looks like you haven't added any treasures yet.</p>
                <Button asChild className="bg-[#2B2B2B] text-white hover:bg-[#6C7466]">
                    <Link href="/">Explore Collection</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="flex items-center gap-4 mb-12">
                    <Link href="/" className="text-[#6C7466] hover:text-[#2B2B2B] transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-serif text-[#2B2B2B]">Shopping Cart</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Cart Items List */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-[#6C7466]/10 text-xs font-bold tracking-widest uppercase text-gray-400">
                            <div className="col-span-6">Product</div>
                            <div className="col-span-2 text-center">Quantity</div>
                            <div className="col-span-2 text-right">Total</div>
                            <div className="col-span-2"></div>
                        </div>

                        {items.map((item) => (
                            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center border-b border-[#6C7466]/10 pb-8 last:border-0">
                                {/* Product Info */}
                                <div className="md:col-span-6 flex gap-4">
                                    <div className="relative w-24 h-32 bg-[#EBEBE8] shrink-0 rounded-sm overflow-hidden">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex flex-col justify-center">
                                        <h3 className="text-lg font-serif text-[#2B2B2B] mb-1">{item.name}</h3>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">{item.category}</p>
                                        <p className="text-sm text-[#6C7466] md:hidden">${item.price.toLocaleString("en-US")}</p>
                                    </div>
                                </div>

                                {/* Quantity */}
                                <div className="md:col-span-2 flex justify-center">
                                    <div className="flex items-center border border-[#6C7466]/20 rounded-sm">
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            className="p-2 hover:bg-[#6C7466]/5 transition-colors"
                                        >
                                            <Minus className="w-3 h-3 text-[#6C7466]" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium text-[#2B2B2B]">
                                            {item.quantity}
                                        </span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            className="p-2 hover:bg-[#6C7466]/5 transition-colors"
                                        >
                                            <Plus className="w-3 h-3 text-[#6C7466]" />
                                        </button>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="md:col-span-2 text-right hidden md:block">
                                    <p className="text-base font-medium text-[#2B2B2B]">
                                        ${(item.price * item.quantity).toLocaleString("en-US")}
                                    </p>
                                </div>

                                {/* Remove */}
                                <div className="md:col-span-2 flex justify-end">
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        aria-label="Remove item"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-8 rounded-sm shadow-sm sticky top-32">
                            <h2 className="text-xl font-serif text-[#2B2B2B] mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${cartTotal.toLocaleString("en-US")}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className="text-xs text-gray-400">Calculated at checkout</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax</span>
                                    <span className="text-xs text-gray-400">Calculated at checkout</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4 mb-8">
                                <div className="flex justify-between items-end">
                                    <span className="text-base font-bold text-[#2B2B2B]">Total</span>
                                    <span className="text-2xl font-serif text-[#2B2B2B]">${cartTotal.toLocaleString("en-US")}</span>
                                </div>
                            </div>

                            <Button
                                asChild
                                className="w-full bg-[#2B2B2B] text-white hover:bg-[#6C7466] h-12 rounded-none text-xs font-bold tracking-[0.2em] uppercase mb-4"
                            >
                                <Link href="/checkout">Proceed to Checkout</Link>
                            </Button>

                            <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Secure Checkout</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

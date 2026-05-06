"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { useCart } from "@/context/cart-context";

export function CartSidebar() {
    const { items, isCartOpen, toggleCart, removeItem, cartSubtotal } = useCart();

    const formatMoney = (value: number) =>
        value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    return (
        <Sheet open={isCartOpen} onOpenChange={toggleCart}>
            <SheetContent className="w-full sm:max-w-md flex flex-col bg-[#FDFBF7] border-l border-[#6C7466]/10 p-0">
                <SheetHeader className="px-6 py-4 border-b border-[#6C7466]/10 flex flex-row items-center justify-between space-y-0">
                    <SheetTitle className="text-lg font-serif text-[#2B2B2B] flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-[#6C7466]" />
                        Your Cart
                    </SheetTitle>
                    {/* Close button is handled by Sheet primitive, but we can add custom if needed */}
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-60">
                            <ShoppingBag className="w-12 h-12 text-[#6C7466]" strokeWidth={1} />
                            <p className="text-sm font-light text-[#2B2B2B]">Your cart is empty</p>
                            <Button
                                variant="outline"
                                onClick={toggleCart}
                                className="border-[#6C7466] text-[#6C7466] hover:bg-[#6C7466] hover:text-white"
                            >
                                Continue Shopping
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="relative w-20 h-24 bg-[#EBEBE8] shrink-0 rounded-sm overflow-hidden">
                                        <Image
                                            src={item.image}
                                            alt={item.name}
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between py-1">
                                        <div>
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="text-sm font-medium text-[#2B2B2B] line-clamp-2 leading-tight">
                                                    {item.name}
                                                </h3>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">{item.category}</p>
                                        </div>

                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] tracking-widest uppercase text-gray-400">
                                                One of a Kind
                                            </span>
                                            <p className="text-sm font-medium text-[#2B2B2B]">
                                                ${formatMoney(item.price)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="p-6 border-t border-[#6C7466]/10 bg-[#FDFBF7] space-y-4">
                        <div className="flex justify-between items-center text-lg font-serif text-[#2B2B2B]">
                            <span>Subtotal</span>
                            <span>${formatMoney(cartSubtotal)}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center uppercase tracking-widest">
                            Shipping & taxes calculated at checkout
                        </p>
                        <div className="grid gap-3">
                            <Button
                                asChild
                                className="w-full bg-[#2B2B2B] text-white hover:bg-[#6C7466] h-12 rounded-none text-xs font-bold tracking-[0.2em] uppercase"
                                onClick={toggleCart}
                            >
                                <Link href="/checkout">Checkout</Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                className="w-full border-[#6C7466]/20 text-[#6C7466] hover:bg-[#6C7466]/5 h-12 rounded-none text-xs font-bold tracking-[0.2em] uppercase"
                                onClick={toggleCart}
                            >
                                <Link href="/cart">View Cart</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}

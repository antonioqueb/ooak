"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/cart-context";

export default function CheckoutPage() {
    const { items, cartTotal, clearCart } = useCart();
    const router = useRouter();
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setIsProcessing(false);
        setIsSuccess(true);
        clearCart();
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-serif text-[#2B2B2B] mb-4">Order Confirmed!</h1>
                <p className="text-gray-500 max-w-md mb-8">
                    Thank you for your purchase. Your natural treasures will be on their way soon. You will receive a confirmation email shortly.
                </p>
                <Button asChild className="bg-[#2B2B2B] text-white hover:bg-[#6C7466] h-12 px-8 rounded-none text-xs font-bold tracking-[0.2em] uppercase">
                    <Link href="/">Return to Home</Link>
                </Button>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6">
                <p className="text-gray-500 mb-4">Your cart is empty.</p>
                <Button asChild variant="link">
                    <Link href="/">Continue Shopping</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-6xl">
                <div className="flex items-center gap-4 mb-12">
                    <Link href="/cart" className="text-[#6C7466] hover:text-[#2B2B2B] transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-3xl md:text-4xl font-serif text-[#2B2B2B]">Checkout</h1>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
                    {/* Checkout Form */}
                    <div>
                        <form onSubmit={handleSubmit} className="space-y-8">
                            {/* Contact Info */}
                            <section>
                                <h2 className="text-lg font-bold text-[#2B2B2B] uppercase tracking-widest mb-6">Contact Information</h2>
                                <div className="space-y-4">
                                    <Input required type="email" placeholder="Email Address" className="bg-white border-[#6C7466]/20 h-12" />
                                </div>
                            </section>

                            {/* Shipping Address */}
                            <section>
                                <h2 className="text-lg font-bold text-[#2B2B2B] uppercase tracking-widest mb-6">Shipping Address</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input required placeholder="First Name" className="bg-white border-[#6C7466]/20 h-12" />
                                    <Input required placeholder="Last Name" className="bg-white border-[#6C7466]/20 h-12" />
                                    <Input required placeholder="Address" className="col-span-2 bg-white border-[#6C7466]/20 h-12" />
                                    <Input required placeholder="Apartment, suite, etc." className="col-span-2 bg-white border-[#6C7466]/20 h-12" />
                                    <Input required placeholder="City" className="bg-white border-[#6C7466]/20 h-12" />
                                    <Input required placeholder="Postal Code" className="bg-white border-[#6C7466]/20 h-12" />
                                </div>
                            </section>

                            {/* Payment (Simulated) */}
                            <section>
                                <h2 className="text-lg font-bold text-[#2B2B2B] uppercase tracking-widest mb-6">Payment</h2>
                                <div className="bg-white border border-[#6C7466]/20 p-6 rounded-sm text-center text-gray-500 text-sm">
                                    <p>This is a simulated checkout.</p>
                                    <p>No real payment will be processed.</p>
                                </div>
                            </section>

                            <Button
                                type="submit"
                                disabled={isProcessing}
                                className="w-full bg-[#2B2B2B] text-white hover:bg-[#6C7466] h-14 rounded-none text-xs font-bold tracking-[0.2em] uppercase"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    `Pay $${cartTotal.toLocaleString("en-US")}`
                                )}
                            </Button>
                        </form>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-[#EBEBE8]/30 p-8 rounded-sm h-fit">
                        <h2 className="text-lg font-serif text-[#2B2B2B] mb-6">Order Summary</h2>
                        <div className="space-y-4 mb-6">
                            {items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-12 h-12 bg-[#EBEBE8] rounded-sm overflow-hidden">
                                            <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-[#2B2B2B]">{item.name}</p>
                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="font-medium text-[#2B2B2B]">${(item.price * item.quantity).toLocaleString("en-US")}</p>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-[#6C7466]/10 pt-4 space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>${cartTotal.toLocaleString("en-US")}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Shipping</span>
                                <span>Free</span>
                            </div>
                        </div>

                        <div className="border-t border-[#6C7466]/10 pt-4 mt-4">
                            <div className="flex justify-between items-end">
                                <span className="text-base font-bold text-[#2B2B2B]">Total</span>
                                <span className="text-2xl font-serif text-[#2B2B2B]">${cartTotal.toLocaleString("en-US")}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

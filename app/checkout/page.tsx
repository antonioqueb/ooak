```
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
    const { items, cartTotal } = useCart();
    const [clientSecret, setClientSecret] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (items.length > 0) {
            fetch("/api/checkout_sessions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ items }),
            })
                .then((res) => res.json())
                .then((data) => setClientSecret(data.clientSecret));
        }
    }, [items]);

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
                    {/* Embedded Checkout Form */}
                    <div className="bg-white p-6 rounded-md shadow-sm border border-[#6C7466]/10">
                        {clientSecret ? (
                            <EmbeddedCheckoutProvider
                                stripe={stripePromise}
                                options={{ clientSecret }}
                            >
                                <EmbeddedCheckout />
                            </EmbeddedCheckoutProvider>
                        ) : (
                            <div className="flex justify-center py-12">
                                <p className="text-gray-500">Loading checkout...</p>
                            </div>
                        )}
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
                                <span>Calculated at checkout</span>
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

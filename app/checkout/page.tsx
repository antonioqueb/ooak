"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/context/cart-context";
import { loadStripe } from "@stripe/stripe-js";

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export default function CheckoutPage() {
    const { items, cartTotal } = useCart();
    const [isProcessing, setIsProcessing] = React.useState(false);

    const handleStripeCheckout = async () => {
        setIsProcessing(true);

        try {
            const response = await fetch('/api/checkout_sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items }),
            });

            const { sessionId, error } = await response.json();

            if (error) {
                console.error('Error creating checkout session:', error);
                alert('Payment failed: ' + error);
                setIsProcessing(false);
                return;
            }

            const stripe = await stripePromise;
            if (!stripe) {
                console.error('Stripe failed to load');
                setIsProcessing(false);
                return;
            }

            const { error: stripeError } = await stripe.redirectToCheckout({
                sessionId,
            });

            if (stripeError) {
                console.error('Stripe redirect error:', stripeError);
                alert(stripeError.message);
                setIsProcessing(false);
            }
        } catch (err) {
            console.error('Checkout error:', err);
            alert('An unexpected error occurred.');
            setIsProcessing(false);
        }
    };

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
                    {/* Checkout Options */}
                    <div>
                        <div className="space-y-8">
                            <section>
                                <h2 className="text-lg font-bold text-[#2B2B2B] uppercase tracking-widest mb-6">Express Checkout</h2>
                                <p className="text-gray-500 mb-6 text-sm">
                                    Complete your purchase securely with Stripe. You will be redirected to a secure payment page to enter your shipping and payment details.
                                </p>

                                <Button
                                    onClick={handleStripeCheckout}
                                    disabled={isProcessing}
                                    className="w-full bg-[#635BFF] hover:bg-[#5851E1] text-white h-14 rounded-md text-sm font-bold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Pay with <span className="font-bold text-lg">Stripe</span> <CreditCard className="w-5 h-5 ml-1" />
                                        </>
                                    )}
                                </Button>
                            </section>

                            <div className="relative flex py-5 items-center">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-widest">Secure Payment</span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div>

                            <div className="flex justify-center gap-4 opacity-50 grayscale">
                                {/* Add payment icons here if available, or just text */}
                                <div className="h-8 w-12 bg-gray-200 rounded"></div>
                                <div className="h-8 w-12 bg-gray-200 rounded"></div>
                                <div className="h-8 w-12 bg-gray-200 rounded"></div>
                                <div className="h-8 w-12 bg-gray-200 rounded"></div>
                            </div>
                        </div>
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

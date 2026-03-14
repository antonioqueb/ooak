"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, User, Mail, Phone, MapPin, ChevronRight, ShieldCheck, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/cart-context";
import { loadStripe } from "@stripe/stripe-js";
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface CustomerData {
    name: string;
    email: string;
    phone: string;
    shipping_name: string;
    shipping_line1: string;
    shipping_line2: string;
    shipping_city: string;
    shipping_state: string;
    shipping_postal_code: string;
    shipping_country: string;
}

const ALLOWED_COUNTRIES = [
    { code: "MX", name: "Mexico" },
    { code: "US", name: "United States" },
    { code: "CA", name: "Canada" },
];

export default function CheckoutPage() {
    const { items, cartTotal } = useCart();
    const [step, setStep] = React.useState<"details" | "payment">("details");
    const [clientSecret, setClientSecret] = React.useState<string | null>(null);
    const [isLoadingPayment, setIsLoadingPayment] = React.useState(false);
    const [errors, setErrors] = React.useState<Partial<Record<keyof CustomerData, string>>>({});

    const [customerData, setCustomerData] = React.useState<CustomerData>({
        name: "",
        email: "",
        phone: "",
        shipping_name: "",
        shipping_line1: "",
        shipping_line2: "",
        shipping_city: "",
        shipping_state: "",
        shipping_postal_code: "",
        shipping_country: "MX",
    });

    const [sameAsShipping, setSameAsShipping] = React.useState(true);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCustomerData((prev) => ({ ...prev, [name]: value }));
        // Clear error on change
        if (errors[name as keyof CustomerData]) {
            setErrors((prev) => ({ ...prev, [name]: undefined }));
        }
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof CustomerData, string>> = {};

        if (!customerData.name.trim()) newErrors.name = "Full name is required";
        if (!customerData.email.trim()) newErrors.email = "Email is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) newErrors.email = "Invalid email";
        if (!customerData.phone.trim()) newErrors.phone = "Phone is required";
        if (!customerData.shipping_line1.trim()) newErrors.shipping_line1 = "Address is required";
        if (!customerData.shipping_city.trim()) newErrors.shipping_city = "City is required";
        if (!customerData.shipping_state.trim()) newErrors.shipping_state = "State is required";
        if (!customerData.shipping_postal_code.trim()) newErrors.shipping_postal_code = "Postal code is required";
        if (!customerData.shipping_country) newErrors.shipping_country = "Country is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleContinueToPayment = async () => {
        if (!validate()) return;

        // Auto-fill shipping name if same as buyer
        const finalData = {
            ...customerData,
            shipping_name: sameAsShipping ? customerData.name : (customerData.shipping_name || customerData.name),
        };

        setIsLoadingPayment(true);

        try {
            const res = await fetch("/api/checkout_sessions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items,
                    customer: finalData,
                }),
            });

            const data = await res.json();

            if (data.error) {
                console.error("Checkout session error:", data.error);
                setIsLoadingPayment(false);
                return;
            }

            setClientSecret(data.clientSecret);
            setStep("payment");
        } catch (err) {
            console.error("Error creating checkout session:", err);
        } finally {
            setIsLoadingPayment(false);
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
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    {step === "payment" ? (
                        <button
                            onClick={() => setStep("details")}
                            className="text-[#6C7466] hover:text-[#2B2B2B] transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                    ) : (
                        <Link href="/cart" className="text-[#6C7466] hover:text-[#2B2B2B] transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                    )}
                    <h1 className="text-3xl md:text-4xl font-serif text-[#2B2B2B]">Checkout</h1>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center gap-3 mb-12">
                    <div className={`flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase ${step === "details" ? "text-[#6C7466]" : "text-gray-400"}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step === "details" ? "bg-[#6C7466] text-white" : "bg-[#6C7466] text-white"}`}>1</span>
                        Your Details
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                    <div className={`flex items-center gap-2 text-xs font-bold tracking-[0.15em] uppercase ${step === "payment" ? "text-[#6C7466]" : "text-gray-300"}`}>
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] ${step === "payment" ? "bg-[#6C7466] text-white" : "bg-gray-200 text-gray-400"}`}>2</span>
                        Payment
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">

                    {/* LEFT COLUMN: Form or Stripe */}
                    <div className="lg:col-span-7">
                        {step === "details" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">

                                {/* Personal Information */}
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <User className="w-4 h-4 text-[#6C7466]" />
                                        <h2 className="text-lg font-serif text-[#2B2B2B]">Personal Information</h2>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2">
                                                Full Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={customerData.name}
                                                onChange={handleChange}
                                                placeholder="e.g. María García López"
                                                className={`w-full h-12 px-4 bg-white border ${errors.name ? "border-red-400" : "border-[#6C7466]/20"} text-[#2B2B2B] text-sm focus:outline-none focus:border-[#6C7466] transition-colors placeholder:text-gray-300`}
                                            />
                                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2">
                                                Email *
                                            </label>
                                            <input
                                                type="email"
                                                name="email"
                                                value={customerData.email}
                                                onChange={handleChange}
                                                placeholder="email@example.com"
                                                className={`w-full h-12 px-4 bg-white border ${errors.email ? "border-red-400" : "border-[#6C7466]/20"} text-[#2B2B2B] text-sm focus:outline-none focus:border-[#6C7466] transition-colors placeholder:text-gray-300`}
                                            />
                                            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2">
                                                Phone *
                                            </label>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={customerData.phone}
                                                onChange={handleChange}
                                                placeholder="+52 81 1234 5678"
                                                className={`w-full h-12 px-4 bg-white border ${errors.phone ? "border-red-400" : "border-[#6C7466]/20"} text-[#2B2B2B] text-sm focus:outline-none focus:border-[#6C7466] transition-colors placeholder:text-gray-300`}
                                            />
                                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-[#6C7466]/10" />

                                {/* Shipping Address */}
                                <div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <MapPin className="w-4 h-4 text-[#6C7466]" />
                                        <h2 className="text-lg font-serif text-[#2B2B2B]">Shipping Address</h2>
                                    </div>

                                    {/* Same name toggle */}
                                    <div className="mb-4">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={sameAsShipping}
                                                onChange={(e) => setSameAsShipping(e.target.checked)}
                                                className="w-4 h-4 accent-[#6C7466]"
                                            />
                                            <span className="text-sm text-gray-600 group-hover:text-[#2B2B2B] transition-colors">
                                                Ship to the same name as above
                                            </span>
                                        </label>
                                    </div>

                                    {!sameAsShipping && (
                                        <div className="mb-4">
                                            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2">
                                                Recipient Name
                                            </label>
                                            <input
                                                type="text"
                                                name="shipping_name"
                                                value={customerData.shipping_name}
                                                onChange={handleChange}
                                                placeholder="Name of the person receiving the package"
                                                className="w-full h-12 px-4 bg-white border border-[#6C7466]/20 text-[#2B2B2B] text-sm focus:outline-none focus:border-[#6C7466] transition-colors placeholder:text-gray-300"
                                            />
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2">
                                                Street Address *
                                            </label>
                                            <input
                                                type="text"
                                                name="shipping_line1"
                                                value={customerData.shipping_line1}
                                                onChange={handleChange}
                                                placeholder="Street, number, neighborhood"
                                                className={`w-full h-12 px-4 bg-white border ${errors.shipping_line1 ? "border-red-400" : "border-[#6C7466]/20"} text-[#2B2B2B] text-sm focus:outline-none focus:border-[#6C7466] transition-colors placeholder:text-gray-300`}
                                            />
                                            {errors.shipping_line1 && <p className="text-red-500 text-xs mt-1">{errors.shipping_line1}</p>}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2">
                                                Apt, Suite, etc. (optional)
                                            </label>
                                            <input
                                                type="text"
                                                name="shipping_line2"
                                                value={customerData.shipping_line2}
                                                onChange={handleChange}
                                                placeholder="Apartment, suite, unit, floor"
                                                className="w-full h-12 px-4 bg-white border border-[#6C7466]/20 text-[#2B2B2B] text-sm focus:outline-none focus:border-[#6C7466] transition-colors placeholder:text-gray-300"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2">
                                                City *
                                            </label>
                                            <input
                                                type="text"
                                                name="shipping_city"
                                                value={customerData.shipping_city}
                                                onChange={handleChange}
                                                placeholder="City"
                                                className={`w-full h-12 px-4 bg-white border ${errors.shipping_city ? "border-red-400" : "border-[#6C7466]/20"} text-[#2B2B2B] text-sm focus:outline-none focus:border-[#6C7466] transition-colors placeholder:text-gray-300`}
                                            />
                                            {errors.shipping_city && <p className="text-red-500 text-xs mt-1">{errors.shipping_city}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2">
                                                State / Province *
                                            </label>
                                            <input
                                                type="text"
                                                name="shipping_state"
                                                value={customerData.shipping_state}
                                                onChange={handleChange}
                                                placeholder="State"
                                                className={`w-full h-12 px-4 bg-white border ${errors.shipping_state ? "border-red-400" : "border-[#6C7466]/20"} text-[#2B2B2B] text-sm focus:outline-none focus:border-[#6C7466] transition-colors placeholder:text-gray-300`}
                                            />
                                            {errors.shipping_state && <p className="text-red-500 text-xs mt-1">{errors.shipping_state}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2">
                                                Postal Code *
                                            </label>
                                            <input
                                                type="text"
                                                name="shipping_postal_code"
                                                value={customerData.shipping_postal_code}
                                                onChange={handleChange}
                                                placeholder="64000"
                                                className={`w-full h-12 px-4 bg-white border ${errors.shipping_postal_code ? "border-red-400" : "border-[#6C7466]/20"} text-[#2B2B2B] text-sm focus:outline-none focus:border-[#6C7466] transition-colors placeholder:text-gray-300`}
                                            />
                                            {errors.shipping_postal_code && <p className="text-red-500 text-xs mt-1">{errors.shipping_postal_code}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold tracking-[0.15em] uppercase text-gray-500 mb-2">
                                                Country *
                                            </label>
                                            <select
                                                name="shipping_country"
                                                value={customerData.shipping_country}
                                                onChange={handleChange}
                                                className={`w-full h-12 px-4 bg-white border ${errors.shipping_country ? "border-red-400" : "border-[#6C7466]/20"} text-[#2B2B2B] text-sm focus:outline-none focus:border-[#6C7466] transition-colors appearance-none`}
                                            >
                                                {ALLOWED_COUNTRIES.map((c) => (
                                                    <option key={c.code} value={c.code}>{c.name}</option>
                                                ))}
                                            </select>
                                            {errors.shipping_country && <p className="text-red-500 text-xs mt-1">{errors.shipping_country}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Continue Button */}
                                <Button
                                    onClick={handleContinueToPayment}
                                    disabled={isLoadingPayment}
                                    className="w-full bg-[#2B2B2B] text-white hover:bg-[#6C7466] h-14 rounded-none text-xs font-bold tracking-[0.2em] uppercase transition-colors"
                                >
                                    {isLoadingPayment ? (
                                        <span className="flex items-center gap-2">
                                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                            Preparing payment...
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-2">
                                            Continue to Payment <ChevronRight className="w-4 h-4" />
                                        </span>
                                    )}
                                </Button>

                                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                                    <Lock className="w-3 h-3" />
                                    <span>Your data is encrypted and secure</span>
                                </div>
                            </div>
                        )}

                        {step === "payment" && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                                <div className="bg-white p-6 rounded-sm shadow-sm border border-[#6C7466]/10">
                                    {/* Customer summary */}
                                    <div className="mb-6 p-4 bg-[#FDFBF7] border border-[#6C7466]/10 rounded-sm">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#6C7466]">Shipping to</span>
                                            <button
                                                onClick={() => setStep("details")}
                                                className="text-[10px] font-bold tracking-[0.15em] uppercase text-[#6C7466] hover:text-[#2B2B2B] transition-colors underline underline-offset-2"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                        <p className="text-sm text-[#2B2B2B] font-medium">{sameAsShipping ? customerData.name : (customerData.shipping_name || customerData.name)}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {customerData.shipping_line1}
                                            {customerData.shipping_line2 && `, ${customerData.shipping_line2}`}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {customerData.shipping_city}, {customerData.shipping_state} {customerData.shipping_postal_code}
                                        </p>
                                        <p className="text-xs text-gray-500">{customerData.email} · {customerData.phone}</p>
                                    </div>

                                    {clientSecret ? (
                                        <EmbeddedCheckoutProvider
                                            stripe={stripePromise}
                                            options={{ clientSecret }}
                                        >
                                            <EmbeddedCheckout />
                                        </EmbeddedCheckoutProvider>
                                    ) : (
                                        <div className="flex justify-center py-12">
                                            <p className="text-gray-500">Loading payment form...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Order Summary (always visible) */}
                    <div className="lg:col-span-5">
                        <div className="bg-white p-8 rounded-sm shadow-sm sticky top-32 border border-[#6C7466]/10">
                            <h2 className="text-lg font-serif text-[#2B2B2B] mb-6">Order Summary</h2>

                            <div className="space-y-4 mb-6">
                                {items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-12 h-12 bg-[#EBEBE8] rounded-sm overflow-hidden shrink-0">
                                                <img src={item.image} alt={item.name} className="object-cover w-full h-full" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-[#2B2B2B] text-sm leading-tight">{item.name}</p>
                                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-medium text-[#2B2B2B] shrink-0">${(item.price * item.quantity).toLocaleString("en-US")}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-[#6C7466]/10 pt-4 space-y-2 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal</span>
                                    <span>${cartTotal.toLocaleString("en-US")}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Tax</span>
                                    <span className="text-xs text-[#6C7466] font-medium">Included</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Shipping</span>
                                    <span className="text-xs text-gray-400">Free</span>
                                </div>
                            </div>

                            <div className="border-t border-[#6C7466]/10 pt-4 mt-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-base font-bold text-[#2B2B2B]">Total</span>
                                    <span className="text-2xl font-serif text-[#2B2B2B]">${cartTotal.toLocaleString("en-US")}</span>
                                </div>
                                <p className="text-[10px] text-[#6C7466] mt-1 text-right">Tax included</p>
                            </div>

                            <div className="mt-6 flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase tracking-widest">
                                <ShieldCheck className="w-3 h-3" />
                                <span>Secure Checkout · Powered by Stripe</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
"use client";

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [orderName, setOrderName] = useState<string | null>(null);

    useEffect(() => {
        if (!sessionId) {
            setStatus('success'); // Assume success if no session_id (e.g. direct visit or dev)
            return;
        }

        // Call our internal API to confirm order and sync with Odoo
        fetch('/api/checkout/confirm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setOrderName(data.odoo_order);
                    setStatus('success');
                } else {
                    console.error("Sync failed:", data.error);
                    setStatus('error');
                }
            })
            .catch(err => {
                console.error("Sync error:", err);
                setStatus('error');
            });
    }, [sessionId]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
                <Loader2 className="w-10 h-10 text-[#6C7466] animate-spin mb-4" />
                <h1 className="text-2xl font-serif text-[#2B2B2B] mb-2">Finalizing your order...</h1>
                <p className="text-gray-500">Please do not close this window.</p>
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-8">
                    <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h1 className="text-3xl font-serif text-[#2B2B2B] mb-4">Order Confirmed, but...</h1>
                <p className="text-gray-500 max-w-md mb-10 text-lg leading-relaxed">
                    Your payment was successful, but we encountered an issue syncing your order details.
                    Please contact support with your payment reference.
                </p>
                <Button asChild className="bg-[#2B2B2B] text-white hover:bg-[#6C7466] h-12 px-8 rounded-full">
                    <Link href="/contact">Contact Support</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-in zoom-in duration-500">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-[#2B2B2B] mb-6">Payment Successful!</h1>
            <p className="text-gray-500 max-w-md mb-10 text-lg leading-relaxed">
                Thank you for your purchase. Your order {orderName ? `(${orderName})` : ''} has been confirmed and will be shipped shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild className="bg-[#2B2B2B] text-white hover:bg-[#6C7466] h-12 px-8 rounded-full text-xs font-bold tracking-[0.2em] uppercase">
                    <Link href="/">Return to Home</Link>
                </Button>
                <Button asChild variant="outline" className="border-[#2B2B2B] text-[#2B2B2B] hover:bg-[#2B2B2B] hover:text-white h-12 px-8 rounded-full text-xs font-bold tracking-[0.2em] uppercase">
                    <Link href="/projects">View Projects <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}

import React from 'react';
import Link from 'next/link';
import { XCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function CancelPage() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-8 animate-in zoom-in duration-500">
                <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-[#2B2B2B] mb-6">Payment Cancelled</h1>
            <p className="text-gray-500 max-w-md mb-10 text-lg leading-relaxed">
                Your payment was cancelled and you have not been charged. You can try again or continue shopping.
            </p>
            <Button asChild className="bg-[#2B2B2B] text-white hover:bg-[#6C7466] h-12 px-8 rounded-full text-xs font-bold tracking-[0.2em] uppercase">
                <Link href="/checkout">Try Again</Link>
            </Button>
        </div>
    );
}

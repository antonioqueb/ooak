import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

export default function SuccessPage() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-in zoom-in duration-500">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl md:text-5xl font-serif text-[#2B2B2B] mb-6">Payment Successful!</h1>
            <p className="text-gray-500 max-w-md mb-10 text-lg leading-relaxed">
                Thank you for your purchase. Your order has been confirmed and will be shipped shortly. You will receive an email with your order details.
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

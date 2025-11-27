import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LegalPage() {
    return (
        <div className="min-h-screen bg-[#FDFBF7] pt-32 pb-20 px-6">
            <div className="container mx-auto max-w-3xl">
                <h1 className="text-3xl md:text-4xl font-serif text-[#2B2B2B] mb-8">Legal Information</h1>

                <div className="prose prose-stone max-w-none space-y-8 text-gray-600">
                    <section>
                        <h2 className="text-xl font-bold text-[#2B2B2B] mb-4">Terms and Conditions</h2>
                        <p>
                            Welcome to One of a Kind. By accessing our website, you agree to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[#2B2B2B] mb-4">Privacy Policy</h2>
                        <p>
                            Your privacy is important to us. It is One of a Kind's policy to respect your privacy regarding any information we may collect from you across our website. We only ask for personal information when we truly need it to provide a service to you.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[#2B2B2B] mb-4">Shipping and Delivery</h2>
                        <p>
                            We ship worldwide. All orders are processed within 2-3 business days. Shipping charges for your order will be calculated and displayed at checkout.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-[#2B2B2B] mb-4">Returns and Exchanges</h2>
                        <p>
                            We accept returns up to 30 days after delivery, if the item is unused and in its original condition, and we will refund the full order amount minus the shipping costs for the return.
                        </p>
                    </section>
                </div>

                <div className="mt-12 pt-8 border-t border-[#6C7466]/10">
                    <Button asChild variant="outline" className="rounded-none border-[#6C7466] text-[#6C7466] hover:bg-[#6C7466] hover:text-white transition-colors">
                        <Link href="/">Return to Home</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}

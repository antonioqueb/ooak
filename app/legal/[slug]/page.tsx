import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';

interface LegalPageProps {
    params: Promise<{ slug: string }>;
}

async function getLegalPage(slug: string) {
    try {
        const res = await fetch(`https://odoo-ooak.alphaqueb.com/api/legal/page/${slug}`, {
            next: { revalidate: 3600 }, // Revalidate every hour
        });

        if (!res.ok) return null;

        const json = await res.json();
        return json.data;
    } catch (error) {
        console.error('Error fetching legal page:', error);
        return null;
    }
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
    const { slug } = await params;
    const page = await getLegalPage(slug);

    if (!page) {
        return {
            title: 'Page Not Found',
        };
    }

    return {
        title: page.meta_title || page.title,
        description: page.meta_description,
    };
}

export default async function LegalPage({ params }: LegalPageProps) {
    const { slug } = await params;
    const page = await getLegalPage(slug);

    if (!page) {
        notFound();
    }

    // Enforce HTTPS in content
    const secureContent = page.content.replace(/http:\/\/odoo-ooak\.alphaqueb\.com/g, 'https://odoo-ooak.alphaqueb.com');

    return (
        <main className="min-h-screen bg-[#FDFBF7] pt-32 pb-20">
            <div className="container mx-auto px-6 max-w-4xl">
                {/* Back Button */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-[#6C7466] hover:text-[#2B2B2B] transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-sm font-medium">Back to Home</span>
                    </Link>
                </div>

                {/* Header */}
                <header className="mb-12 border-b border-[#6C7466]/10 pb-8">
                    <h1 className="text-4xl md:text-5xl font-serif text-[#2B2B2B] mb-4">
                        {page.title}
                    </h1>
                    {page.updated_at && (
                        <p className="text-[#6C7466]/70 text-sm">
                            Last updated: {new Date(page.updated_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </p>
                    )}
                </header>

                {/* Content */}
                <article className="
                    prose prose-lg max-w-none
                    prose-headings:font-serif prose-headings:text-[#2B2B2B]
                    prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4
                    prose-p:text-[#2B2B2B]/80 prose-p:leading-relaxed
                    prose-a:text-[#6C7466] prose-a:no-underline hover:prose-a:underline
                    prose-strong:text-[#2B2B2B] prose-strong:font-medium
                    prose-ul:list-disc prose-ul:pl-4 prose-ul:my-6
                    prose-li:text-[#2B2B2B]/80 prose-li:mb-2
                ">
                    <div dangerouslySetInnerHTML={{ __html: secureContent }} />
                </article>
            </div>
        </main>
    );
}

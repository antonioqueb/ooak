"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Product } from "@/lib/products";
import { getAllProducts } from "@/lib/api";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface SearchOverlayProps {
    open: boolean;
    onClose: () => void;
}

const stripHtml = (value: string | undefined) =>
    value ? value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";

const normalize = (value: string) =>
    value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "");

const tokenize = (value: string) => normalize(value).split(/\s+/).filter(Boolean);

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
    const [query, setQuery] = React.useState("");
    const [products, setProducts] = React.useState<Product[] | null>(null);
    const [loading, setLoading] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);

    const debouncedQuery = useDebouncedValue(query, 350);

    React.useEffect(() => {
        if (!open) return;
        if (products !== null) return;

        let cancelled = false;
        setLoading(true);
        getAllProducts()
            .then((data) => {
                if (!cancelled) setProducts(data);
            })
            .catch(() => {
                if (!cancelled) setProducts([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, products]);

    React.useEffect(() => {
        if (open) {
            const id = setTimeout(() => inputRef.current?.focus(), 100);
            return () => clearTimeout(id);
        }
        setQuery("");
    }, [open]);

    React.useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, onClose]);

    if (!open) return null;

    const results = React.useMemo<Product[]>(() => {
        if (!products) return [];
        const tokens = tokenize(debouncedQuery);
        if (tokens.length === 0) return [];

        return products
            .map((p) => {
                const haystack = normalize(
                    [
                        p.name,
                        p.category,
                        stripHtml(p.shortDescription || p.description),
                        stripHtml(p.longDescription),
                        p.material || "",
                    ].join(" ")
                );

                let score = 0;
                for (const token of tokens) {
                    const index = haystack.indexOf(token);
                    if (index === -1) return null;
                    score += token.length / (index + 1);
                    if (normalize(p.name).includes(token)) score += 10;
                }
                return { product: p, score };
            })
            .filter((entry): entry is { product: Product; score: number } => entry !== null)
            .sort((a, b) => b.score - a.score)
            .slice(0, 24)
            .map((entry) => entry.product);
    }, [products, debouncedQuery]);

    const isSearching = query !== debouncedQuery;
    const showEmpty = !loading && !isSearching && debouncedQuery.trim().length > 0 && results.length === 0;

    return (
        <div className="fixed inset-0 z-[60] animate-in fade-in duration-300">
            <div
                className="absolute inset-0 bg-[#2B2B2B]/40 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="absolute top-0 left-0 right-0 bg-[#FDFBF7] shadow-xl animate-in slide-in-from-top duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[#6C7466]">
                            Search the Collection
                        </span>
                        <button
                            onClick={onClose}
                            className="p-2 text-[#6C7466] hover:text-[#2B2B2B] transition-colors"
                            aria-label="Close search"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative border-b border-[#6C7466]/30 focus-within:border-[#2B2B2B] transition-colors">
                        <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6C7466]" />
                        <input
                            ref={inputRef}
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search by name, category, material..."
                            className="w-full pl-10 pr-12 py-4 bg-transparent text-2xl md:text-3xl font-serif text-[#2B2B2B] placeholder:text-gray-300 focus:outline-none"
                        />
                        {isSearching || (loading && query) ? (
                            <Loader2 className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6C7466] animate-spin" />
                        ) : null}
                    </div>

                    <p className="mt-2 text-[10px] tracking-[0.2em] uppercase text-gray-400">
                        Press <kbd className="px-1.5 py-0.5 border border-[#6C7466]/20 rounded text-[9px]">Esc</kbd> to close
                    </p>
                </div>

                <div className="container mx-auto px-4 sm:px-6 lg:px-8 pb-10 max-h-[70vh] overflow-y-auto">
                    {loading && products === null && (
                        <div className="flex items-center justify-center py-20 text-[#6C7466] gap-3">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span className="text-xs tracking-[0.2em] uppercase">Loading catalog</span>
                        </div>
                    )}

                    {!loading && products !== null && debouncedQuery.trim().length === 0 && (
                        <div className="py-16 text-center">
                            <p className="text-sm font-light text-gray-400">
                                Begin typing to discover {products.length} pieces in our archive.
                            </p>
                        </div>
                    )}

                    {showEmpty && (
                        <div className="py-16 text-center">
                            <p className="text-base font-serif text-[#2B2B2B] mb-2">No matches found</p>
                            <p className="text-xs tracking-[0.2em] uppercase text-gray-400">
                                Try a different word or browse the collection
                            </p>
                        </div>
                    )}

                    {results.length > 0 && (
                        <>
                            <p className="text-[10px] tracking-[0.3em] uppercase text-[#6C7466] mb-4">
                                {results.length} {results.length === 1 ? "Result" : "Results"}
                            </p>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                {results.map((product) => (
                                    <li key={product.id}>
                                        <Link
                                            href={`/product/${product.slug}`}
                                            onClick={onClose}
                                            className="group flex items-center gap-4 py-3 border-b border-[#6C7466]/10 hover:border-[#6C7466]/40 transition-colors"
                                        >
                                            <div className="relative w-16 h-20 bg-white shrink-0 overflow-hidden rounded-sm border border-[#6C7466]/10">
                                                {product.image && (
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        fill
                                                        className={cn(
                                                            "object-contain transition-transform duration-700 group-hover:scale-105",
                                                            product.isSold && "opacity-60 grayscale"
                                                        )}
                                                        sizes="64px"
                                                    />
                                                )}
                                                {product.isSold && (
                                                    <span className="absolute inset-x-0 bottom-0 bg-[#2B2B2B] text-white text-[8px] tracking-[0.2em] uppercase text-center py-0.5">
                                                        Sold
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[9px] tracking-[0.25em] uppercase text-gray-400 mb-0.5 truncate">
                                                    {product.category}
                                                </p>
                                                <p className="text-sm md:text-base font-serif text-[#2B2B2B] group-hover:text-[#6C7466] transition-colors truncate">
                                                    {product.name}
                                                </p>
                                            </div>
                                            <span className="text-sm font-medium text-[#2B2B2B] shrink-0">
                                                ${product.price.toLocaleString("en-US")}
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

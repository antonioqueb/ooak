"use client";

import * as React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantityStepperProps {
    value: number;
    max: number;
    min?: number;
    // Se llama con el valor que pidió el usuario (sin recortar). Quien lo
    // consume decide el tope y muestra el aviso "Only N pieces available".
    onChange: (next: number) => void;
    size?: "sm" | "md";
    className?: string;
}

// Selector -/+ para productos con más de una pieza disponible. No muestra el
// máximo: solo se entera el usuario cuando intenta pasarse.
export function QuantityStepper({
    value,
    max,
    min = 1,
    onChange,
    size = "md",
    className,
}: QuantityStepperProps) {
    const [draft, setDraft] = React.useState(String(value));

    React.useEffect(() => {
        setDraft(String(value));
    }, [value]);

    const commit = (raw: string) => {
        const parsed = parseInt(raw, 10);
        if (!Number.isFinite(parsed)) {
            setDraft(String(value));
            return;
        }
        onChange(parsed);
        setDraft(String(Math.min(Math.max(parsed, min), max)));
    };

    const btn = cn(
        "flex items-center justify-center text-[#2B2B2B] transition-colors hover:bg-[#6C7466]/10 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed",
        size === "sm" ? "w-7 h-7" : "w-10 h-10"
    );

    return (
        <div
            className={cn(
                "inline-flex items-stretch border border-[#6C7466]/30 bg-white rounded-sm",
                className
            )}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                aria-label="Decrease quantity"
                className={btn}
                disabled={value <= min}
                onClick={() => onChange(value - 1)}
            >
                <Minus className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
            </button>
            <input
                type="number"
                inputMode="numeric"
                min={min}
                aria-label="Quantity"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={(e) => commit(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        commit((e.target as HTMLInputElement).value);
                    }
                }}
                className={cn(
                    "text-center text-[#2B2B2B] bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
                    size === "sm" ? "w-9 text-xs" : "w-12 text-sm"
                )}
            />
            <button
                type="button"
                aria-label="Increase quantity"
                className={btn}
                onClick={() => onChange(value + 1)}
            >
                <Plus className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
            </button>
        </div>
    );
}

// Cálculo AUTORITATIVO del carrito en el servidor. Compartido por todas las
// pasarelas (Stripe, PayPal) para que ambas cobren exactamente lo mismo.
// Solo confiamos en el slug y la cantidad que envía el navegador; precio y
// peso se obtienen siempre de Odoo.
import { getShippingCostForWeight } from '@/lib/shipping';
import { fetchShippingRates } from '@/lib/shipping-rates';
import { fetchProductPricing } from '@/lib/api';

export const TAX_RATE = 0.16;
export const MAX_ITEMS = 50;
const SLUG_RE = /^[a-z0-9-]+$/i;

export interface CartLine {
    slug: string;
    name: string;
    quantity: number;
    unitAmountCents: number;
}

export interface PricedCart {
    lines: CartLine[];
    subtotalCents: number;
    taxCents: number;
    shippingCents: number;
    totalCents: number;
}

export type PricingError = { error: string; status: number };

export interface CustomerInput {
    name: string;
    email: string;
    phone?: string;
    shipping_name?: string;
    shipping_line1?: string;
    shipping_line2?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_postal_code?: string;
    shipping_country?: string;
}

export function isPricingError(x: PricedCart | PricingError): x is PricingError {
    return (x as PricingError).error !== undefined;
}

function parseItem(raw: any): { slug: string; quantity: number } | null {
    if (!raw || typeof raw.slug !== 'string' || !SLUG_RE.test(raw.slug)) {
        return null;
    }
    const quantity = Number(raw.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
        return null;
    }
    return { slug: raw.slug, quantity };
}

// Valida los datos del cliente y los normaliza (recortados) para guardarlos en
// la pasarela. Devuelve null si faltan datos obligatorios.
export function normalizeCustomer(customer: any): CustomerInput | null {
    if (!customer || typeof customer.name !== 'string' || typeof customer.email !== 'string'
        || !customer.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)) {
        return null;
    }
    const s = (v: unknown, max: number) => String(v ?? '').substring(0, max);
    return {
        name: s(customer.name, 200),
        email: s(customer.email, 200),
        phone: s(customer.phone, 50),
        shipping_name: s(customer.shipping_name || customer.name, 200),
        shipping_line1: s(customer.shipping_line1, 200),
        shipping_line2: s(customer.shipping_line2, 200),
        shipping_city: s(customer.shipping_city, 100),
        shipping_state: s(customer.shipping_state, 100),
        shipping_postal_code: s(customer.shipping_postal_code, 20),
        shipping_country: s(customer.shipping_country, 10),
    };
}

export async function priceCart(items: unknown): Promise<PricedCart | PricingError> {
    if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
        return { error: 'Invalid cart', status: 400 };
    }

    const parsed = items.map(parseItem);
    if (parsed.some((p) => p === null)) {
        return { error: 'Invalid item in cart', status: 400 };
    }
    const cleanItems = parsed as { slug: string; quantity: number }[];

    const shippingRates = await fetchShippingRates();
    const lines: CartLine[] = [];
    let subtotalCents = 0;
    let shippingTotal = 0;

    for (const item of cleanItems) {
        const pricing = await fetchProductPricing(item.slug);

        if (!pricing) {
            return { error: `Product not available: ${item.slug}`, status: 400 };
        }
        if (pricing.is_sold) {
            return { error: `Product already sold: ${item.slug}`, status: 409 };
        }
        if (!(pricing.price > 0)) {
            return { error: `Invalid product price: ${item.slug}`, status: 400 };
        }

        const unitAmountCents = Math.round(pricing.price * 100);
        lines.push({ slug: item.slug, name: pricing.name, quantity: item.quantity, unitAmountCents });

        subtotalCents += unitAmountCents * item.quantity;
        // Envío calculado con el peso REAL del backend.
        shippingTotal += getShippingCostForWeight(pricing.weight_kg, shippingRates) * item.quantity;
    }

    const taxCents = Math.round(subtotalCents * TAX_RATE);
    const shippingCents = Math.round(shippingTotal * 100);

    return {
        lines,
        subtotalCents,
        taxCents,
        shippingCents,
        totalCents: subtotalCents + taxCents + shippingCents,
    };
}

// Re-verifica en Odoo que ninguna pieza del pedido se haya vendido entre la
// creación de la orden y la captura del pago (piezas únicas).
export async function anyItemSold(slugs: string[]): Promise<string | null> {
    for (const slug of slugs) {
        const pricing = await fetchProductPricing(slug);
        if (!pricing || pricing.is_sold) return slug;
    }
    return null;
}

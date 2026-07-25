import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getShippingCostForWeight } from '@/lib/shipping';
import { fetchShippingRates } from '@/lib/shipping-rates';
import { fetchProductPricing } from '@/lib/api';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-10-28.acacia',
});

const TAX_RATE = 0.16;
const MAX_ITEMS = 50;
const SLUG_RE = /^[a-z0-9-]+$/i;

// Valida y normaliza un item recibido del cliente. Solo confiamos en el slug
// y la cantidad; el precio y el peso se obtienen del backend (Odoo).
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

export async function POST(req: Request) {
    try {
        const { items, customer } = await req.json();

        if (!Array.isArray(items) || items.length === 0 || items.length > MAX_ITEMS) {
            return NextResponse.json({ error: 'Invalid cart' }, { status: 400 });
        }

        if (!customer || typeof customer.name !== 'string' || typeof customer.email !== 'string'
            || !customer.name.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(customer.email)) {
            return NextResponse.json({ error: 'Missing or invalid customer information' }, { status: 400 });
        }

        // 1. Validar estructura de cada item.
        const parsed = items.map(parseItem);
        if (parsed.some((p) => p === null)) {
            return NextResponse.json({ error: 'Invalid item in cart' }, { status: 400 });
        }
        const cleanItems = parsed as { slug: string; quantity: number }[];

        // 2. Obtener precio y peso AUTORITATIVOS desde Odoo (nunca del cliente).
        const shippingRates = await fetchShippingRates();
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        let subtotalCents = 0;
        let shippingTotal = 0;

        for (const item of cleanItems) {
            const pricing = await fetchProductPricing(item.slug);

            if (!pricing) {
                return NextResponse.json(
                    { error: `Product not available: ${item.slug}` },
                    { status: 400 }
                );
            }
            if (pricing.is_sold) {
                return NextResponse.json(
                    { error: `Product already sold: ${item.slug}` },
                    { status: 409 }
                );
            }
            if (!(pricing.price > 0)) {
                return NextResponse.json(
                    { error: `Invalid product price: ${item.slug}` },
                    { status: 400 }
                );
            }

            const unitAmount = Math.round(pricing.price * 100);

            lineItems.push({
                price_data: {
                    currency: 'mxn',
                    product_data: {
                        name: pricing.name,
                        metadata: { sku: item.slug },
                    },
                    unit_amount: unitAmount,
                    tax_behavior: 'exclusive',
                },
                quantity: item.quantity,
            });

            subtotalCents += unitAmount * item.quantity;
            // Envío calculado con el peso REAL del backend.
            shippingTotal += getShippingCostForWeight(pricing.weight_kg, shippingRates) * item.quantity;
        }

        // 3. IVA sobre el subtotal autoritativo.
        const taxCents = Math.round(subtotalCents * TAX_RATE);
        if (taxCents > 0) {
            lineItems.push({
                price_data: {
                    currency: 'mxn',
                    product_data: { name: 'VAT (IVA 16%)' },
                    unit_amount: taxCents,
                    tax_behavior: 'exclusive',
                },
                quantity: 1,
            });
        }

        // 4. Envío.
        const shippingCents = Math.round(shippingTotal * 100);
        if (shippingCents > 0) {
            lineItems.push({
                price_data: {
                    currency: 'mxn',
                    product_data: { name: 'Shipping' },
                    unit_amount: shippingCents,
                    tax_behavior: 'exclusive',
                },
                quantity: 1,
            });
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            ui_mode: 'embedded',
            customer_email: customer.email,
            return_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                customer_name: String(customer.name).substring(0, 200),
                customer_email: String(customer.email).substring(0, 200),
                customer_phone: String(customer.phone || '').substring(0, 50),
                shipping_name: String(customer.shipping_name || customer.name).substring(0, 200),
                shipping_line1: String(customer.shipping_line1 || '').substring(0, 200),
                shipping_line2: String(customer.shipping_line2 || '').substring(0, 200),
                shipping_city: String(customer.shipping_city || '').substring(0, 100),
                shipping_state: String(customer.shipping_state || '').substring(0, 100),
                shipping_postal_code: String(customer.shipping_postal_code || '').substring(0, 20),
                shipping_country: String(customer.shipping_country || '').substring(0, 10),
            },
        });

        return NextResponse.json({ clientSecret: session.client_secret });
    } catch (err) {
        console.error('Error creating checkout session:', err);
        return NextResponse.json({ error: 'Unable to create checkout session' }, { status: 500 });
    }
}

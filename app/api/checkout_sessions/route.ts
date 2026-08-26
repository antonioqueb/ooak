import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { priceCart, isPricingError, normalizeCustomer } from '@/lib/checkout-pricing';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-10-28.acacia',
});

export async function POST(req: Request) {
    try {
        const { items, customer: rawCustomer } = await req.json();

        const customer = normalizeCustomer(rawCustomer);
        if (!customer) {
            return NextResponse.json({ error: 'Missing or invalid customer information' }, { status: 400 });
        }

        // Precio, IVA y envío AUTORITATIVOS desde Odoo (nunca del cliente).
        const priced = await priceCart(items);
        if (isPricingError(priced)) {
            return NextResponse.json({ error: priced.error }, { status: priced.status });
        }

        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priced.lines.map((line) => ({
            price_data: {
                currency: 'mxn',
                product_data: {
                    name: line.name,
                    metadata: { sku: line.slug },
                },
                unit_amount: line.unitAmountCents,
                tax_behavior: 'exclusive',
            },
            quantity: line.quantity,
        }));

        if (priced.taxCents > 0) {
            lineItems.push({
                price_data: {
                    currency: 'mxn',
                    product_data: { name: 'VAT (IVA 16%)' },
                    unit_amount: priced.taxCents,
                    tax_behavior: 'exclusive',
                },
                quantity: 1,
            });
        }

        if (priced.shippingCents > 0) {
            lineItems.push({
                price_data: {
                    currency: 'mxn',
                    product_data: { name: 'Shipping' },
                    unit_amount: priced.shippingCents,
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
                customer_name: customer.name,
                customer_email: customer.email,
                customer_phone: customer.phone || '',
                shipping_name: customer.shipping_name || customer.name,
                shipping_line1: customer.shipping_line1 || '',
                shipping_line2: customer.shipping_line2 || '',
                shipping_city: customer.shipping_city || '',
                shipping_state: customer.shipping_state || '',
                shipping_postal_code: customer.shipping_postal_code || '',
                shipping_country: customer.shipping_country || '',
            },
        });

        return NextResponse.json({ clientSecret: session.client_secret });
    } catch (err) {
        console.error('Error creating checkout session:', err);
        return NextResponse.json({ error: 'Unable to create checkout session' }, { status: 500 });
    }
}

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-10-28.acacia',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const ODOO_URL = 'https://erp.oneofakind.com.mx/api/sales/create_from_stripe';
const ODOO_TOKEN = process.env.ODOO_API_TOKEN;

async function syncWithOdoo(session: Stripe.Checkout.Session, lineItems: Stripe.ApiList<Stripe.LineItem>) {
    const meta = session.metadata || {};

    const payload = {
        stripe_session_id: session.id,
        customer: {
            name: meta.customer_name || session.customer_details?.name || 'Unknown',
            email: meta.customer_email || session.customer_details?.email || '',
            phone: meta.customer_phone || session.customer_details?.phone || null,
            address: {
                line1: meta.shipping_line1 || null,
                line2: meta.shipping_line2 || null,
                city: meta.shipping_city || null,
                state: meta.shipping_state || null,
                country: meta.shipping_country || null,
                postal_code: meta.shipping_postal_code || null,
            }
        },
        shipping: {
            name: meta.shipping_name || meta.customer_name || 'Unknown',
            address: {
                line1: meta.shipping_line1 || null,
                line2: meta.shipping_line2 || null,
                city: meta.shipping_city || null,
                state: meta.shipping_state || null,
                country: meta.shipping_country || null,
                postal_code: meta.shipping_postal_code || null,
            }
        },
        items: lineItems.data.map((item: any) => ({
            product_name: item.description,
            quantity: item.quantity,
            price_unit: item.amount_total / 100,
            sku: item.price?.product?.metadata?.sku || null
        }))
    };

    console.log('📦 Sending payload to Odoo (Webhook):', JSON.stringify(payload, null, 2));

    const response = await fetch(ODOO_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ODOO_TOKEN}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Odoo Sync Error:', errorText);
        throw new Error(`Odoo responded with ${response.status}`);
    }

    const json = await response.json();
    console.log('✅ Orden creada en Odoo (Webhook):', json.data?.order_name);
    return json;
}

export async function POST(req: Request) {
    const body = await req.text();
    const sig = (await headers()).get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        if (!endpointSecret) throw new Error('Missing STRIPE_WEBHOOK_SECRET');
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook Error: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
                expand: ['data.price.product']
            });

            await syncWithOdoo(session, lineItems);

        } catch (error) {
            console.error('Error syncing with Odoo:', error);
            return NextResponse.json({ error: 'Error syncing with Odoo' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}

export async function GET() {
    return NextResponse.json({ status: 'Webhook endpoint is active' });
}
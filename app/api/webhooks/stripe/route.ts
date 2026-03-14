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
    const payload = {
        stripe_session_id: session.id,
        customer: {
            name: session.customer_details?.name || session.shipping_details?.name || 'Unknown',
            email: session.customer_details?.email,
            phone: session.customer_details?.phone || null,
            address: {
                line1: session.customer_details?.address?.line1 || null,
                line2: session.customer_details?.address?.line2 || null,
                city: session.customer_details?.address?.city || null,
                state: session.customer_details?.address?.state || null,
                country: session.customer_details?.address?.country || null,
                postal_code: session.customer_details?.address?.postal_code || null,
            }
        },
        shipping: {
            name: session.shipping_details?.name || session.customer_details?.name || 'Unknown',
            address: {
                line1: session.shipping_details?.address?.line1 || null,
                line2: session.shipping_details?.address?.line2 || null,
                city: session.shipping_details?.address?.city || null,
                state: session.shipping_details?.address?.state || null,
                country: session.shipping_details?.address?.country || null,
                postal_code: session.shipping_details?.address?.postal_code || null,
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
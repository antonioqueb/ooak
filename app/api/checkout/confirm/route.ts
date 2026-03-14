import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-10-28.acacia',
});

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

    console.log('📦 Sending payload to Odoo:', JSON.stringify(payload, null, 2));

    const response = await fetch(ODOO_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ODOO_TOKEN}`
        },
        body: JSON.stringify(payload)
    });

    console.log('📡 Odoo Response Status:', response.status);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Odoo Sync Error:', errorText);
        throw new Error(`Odoo responded with ${response.status}`);
    }

    const json = await response.json();
    console.log('✅ Orden creada en Odoo:', json.data?.order_name);
    return json;
}

export async function POST(req: Request) {
    console.log('🔵 /api/checkout/confirm called');

    if (!process.env.STRIPE_SECRET_KEY) console.error('🔴 Missing STRIPE_SECRET_KEY');
    if (!process.env.ODOO_API_TOKEN) console.error('🔴 Missing ODOO_API_TOKEN');

    try {
        const body = await req.json();
        const { session_id } = body;

        if (!session_id) {
            return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.retrieve(session_id, {
            expand: ['shipping_details'],
        });

        if (session.payment_status !== 'paid') {
            return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
        }

        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product']
        });

        const result = await syncWithOdoo(session, lineItems);

        return NextResponse.json({
            success: true,
            odoo_order: result.data?.order_name,
            shipping_address: result.data?.shipping_address,
        });

    } catch (error: any) {
        console.error('🔴 Error confirming checkout:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
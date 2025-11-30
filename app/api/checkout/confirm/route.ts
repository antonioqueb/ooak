import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-10-28.acacia',
});

const ODOO_URL = 'https://odoo-ooak.alphaqueb.com/api/sales/create_from_stripe';
const ODOO_TOKEN = process.env.ODOO_API_TOKEN;

async function syncWithOdoo(session: Stripe.Checkout.Session, lineItems: Stripe.ApiList<Stripe.LineItem>) {
    // Prepare Payload
    const payload = {
        stripe_session_id: session.id,
        customer: {
            name: session.customer_details?.name,
            email: session.customer_details?.email,
            address: {
                line1: session.shipping_details?.address?.line1,
                line2: session.shipping_details?.address?.line2,
                city: session.shipping_details?.address?.city,
                state: session.shipping_details?.address?.state,
                country: session.shipping_details?.address?.country,
                postal_code: session.shipping_details?.address?.postal_code,
            }
        },
        items: lineItems.data.map((item: any) => ({
            product_name: item.description,
            quantity: item.quantity,
            price_unit: item.amount_total / 100, // Stripe uses cents
            // Try to get SKU from product metadata if available
            sku: item.price?.product?.metadata?.sku || null
        }))
    };

    console.log('📦 Sending payload to Odoo (Success Page):', JSON.stringify(payload, null, 2));

    // Send to Odoo
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
        console.log('🔵 Request body:', body);
        const { session_id } = body;

        if (!session_id) {
            console.error('🔴 Missing session_id in body');
            return NextResponse.json({ error: 'Missing session_id' }, { status: 400 });
        }

        console.log(`🔵 Retrieving session: ${session_id}`);
        // 1. Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(session_id);
        console.log(`🔵 Session status: ${session.payment_status}`);

        // 2. Verify payment status
        if (session.payment_status !== 'paid') {
            console.error('🔴 Payment not paid');
            return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
        }

        // 3. Fetch line items
        console.log('🔵 Fetching line items...');
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
            expand: ['data.price.product']
        });
        console.log(`🔵 Found ${lineItems.data.length} items`);

        // 4. Sync with Odoo
        const result = await syncWithOdoo(session, lineItems);

        return NextResponse.json({ success: true, odoo_order: result.data?.order_name });

    } catch (error: any) {
        console.error('🔴 Error confirming checkout:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

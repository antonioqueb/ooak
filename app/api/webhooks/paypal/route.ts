import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { verifyPayPalWebhook, getPayPalOrder, isOrderCaptured } from '@/lib/paypal';
import { syncPayPalOrderWithOdoo } from '@/lib/odoo-paypal-sync';

// Respaldo: si el navegador se cierra antes de que /capture sincronice con
// Odoo, PayPal notifica la captura aquí. Odoo deduplica por paypal_order_id.
export async function POST(req: Request) {
    const body = await req.text();

    let verified = false;
    try {
        verified = await verifyPayPalWebhook(await headers(), body);
    } catch (err: any) {
        console.error(`PayPal webhook verification error: ${err.message}`);
        return NextResponse.json({ error: 'Webhook verification failed' }, { status: 400 });
    }
    if (!verified) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
        // El recurso es la captura; la orden viene en supplementary_data o en
        // el link "up".
        const orderId: string | undefined =
            event.resource?.supplementary_data?.related_ids?.order_id
            || event.resource?.links?.find((l: any) => l.rel === 'up')?.href?.split('/').pop();

        if (!orderId) {
            console.error('PayPal webhook: capture without order id');
            return NextResponse.json({ received: true });
        }

        try {
            const order = await getPayPalOrder(orderId);
            if (isOrderCaptured(order)) {
                await syncPayPalOrderWithOdoo(order);
            }
        } catch (error) {
            console.error('Error syncing PayPal order with Odoo (webhook):', error);
            // 500 para que PayPal reintente.
            return NextResponse.json({ error: 'Error syncing with Odoo' }, { status: 500 });
        }
    }

    return NextResponse.json({ received: true });
}

export async function GET() {
    return NextResponse.json({ status: 'PayPal webhook endpoint is active' });
}

import { NextResponse } from 'next/server';
import { findUnavailableItem } from '@/lib/checkout-pricing';
import {
    getPayPalOrder,
    capturePayPalOrder,
    isOrderCaptured,
    PayPalApiError,
    decodeCustomId,
    type PayPalOrder,
} from '@/lib/paypal';
import { syncPayPalOrderWithOdoo } from '@/lib/odoo-paypal-sync';

const ORDER_ID_RE = /^[A-Z0-9]{5,40}$/i;

// Captura el pago de una orden aprobada por el comprador y crea la venta en
// Odoo. Idempotente: si la orden ya estaba capturada, solo re-sincroniza.
export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
    const { id } = await ctx.params;
    if (!ORDER_ID_RE.test(id)) {
        return NextResponse.json({ error: 'Invalid order id' }, { status: 400 });
    }

    let order: PayPalOrder;
    try {
        order = await getPayPalOrder(id);
    } catch (err) {
        console.error('PayPal get order error:', err);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!isOrderCaptured(order)) {
        if (order.status !== 'APPROVED') {
            return NextResponse.json({ error: 'Order not approved by payer' }, { status: 400 });
        }

        // Re-verificar disponibilidad (pieza única o cantidad) en Odoo antes de cobrar.
        const orderItems = (order.purchase_units[0]?.items || [])
            .filter((i) => Boolean(i.sku))
            .map((i) => ({ slug: i.sku as string, quantity: Number(i.quantity) || 1 }));
        const unavailable = await findUnavailableItem(orderItems);
        if (unavailable) {
            return NextResponse.json({ error: unavailable }, { status: 409 });
        }

        try {
            order = await capturePayPalOrder(id);
        } catch (err) {
            if (err instanceof PayPalApiError && err.issue === 'ORDER_ALREADY_CAPTURED') {
                order = await getPayPalOrder(id);
            } else {
                if (err instanceof PayPalApiError) {
                    console.error('PayPal capture error:', err.status, JSON.stringify(err.body));
                } else {
                    console.error('PayPal capture error:', err);
                }
                const issue = err instanceof PayPalApiError ? err.issue : undefined;
                const message = issue === 'INSTRUMENT_DECLINED'
                    ? 'Payment declined. Please try another payment method.'
                    : 'Unable to capture payment';
                return NextResponse.json({ error: message, issue }, { status: 402 });
            }
        }

        if (!isOrderCaptured(order)) {
            return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
        }
    }

    // El pago ya está hecho: cualquier fallo de aquí en adelante no debe
    // reportarse como fallo de pago.
    const deliveryMethod = decodeCustomId(order.purchase_units[0]?.custom_id).delivery_method;
    try {
        const result = await syncPayPalOrderWithOdoo(order);
        return NextResponse.json({
            success: true,
            paypal_order_id: order.id,
            odoo_order: result.data?.order_name,
            delivery_method: deliveryMethod,
        });
    } catch (error) {
        console.error('🔴 Error syncing PayPal order with Odoo:', error);
        return NextResponse.json({ success: true, paypal_order_id: order.id, sync_error: true, delivery_method: deliveryMethod });
    }
}

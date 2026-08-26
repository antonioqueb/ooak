import { NextResponse } from 'next/server';
import { priceCart, isPricingError, normalizeCustomer } from '@/lib/checkout-pricing';
import { createPayPalOrder, PayPalApiError } from '@/lib/paypal';

// Crea una orden de PayPal con el monto calculado en el servidor.
// Devuelve { id } para que los botones de PayPal abran el flujo de aprobación.
export async function POST(req: Request) {
    try {
        const { items, customer: rawCustomer } = await req.json();

        const customer = normalizeCustomer(rawCustomer);
        if (!customer) {
            return NextResponse.json({ error: 'Missing or invalid customer information' }, { status: 400 });
        }

        const priced = await priceCart(items);
        if (isPricingError(priced)) {
            return NextResponse.json({ error: priced.error }, { status: priced.status });
        }

        const origin = req.headers.get('origin') || '';
        const order = await createPayPalOrder(priced, customer, origin);

        return NextResponse.json({ id: order.id });
    } catch (err) {
        if (err instanceof PayPalApiError) {
            console.error('PayPal create order error:', err.status, JSON.stringify(err.body));
        } else {
            console.error('Error creating PayPal order:', err);
        }
        return NextResponse.json({ error: 'Unable to create PayPal order' }, { status: 500 });
    }
}

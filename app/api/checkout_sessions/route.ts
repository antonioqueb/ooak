import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-10-28.acacia',
});

export async function POST(req: Request) {
    try {
        const { items, customer } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
        }

        if (!customer || !customer.name || !customer.email) {
            return NextResponse.json({ error: 'Missing customer information' }, { status: 400 });
        }

        const lineItems = items.map((item: any) => {
            return {
                price_data: {
                    currency: 'mxn',
                    product_data: {
                        name: item.name,
                        images: item.image ? [item.image.startsWith('http') ? item.image : `https://oneofakind.com${item.image}`] : [],
                        description: item.description ? item.description.substring(0, 100) : undefined,
                        metadata: {
                            sku: item.slug
                        }
                    },
                    unit_amount: Math.round(item.price * 100),
                },
                quantity: item.quantity,
            };
        });

        // Guardar todos los datos del cliente en metadata de la sesión de Stripe.
        // Stripe metadata tiene límite de 500 chars por value y 50 keys.
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            ui_mode: 'embedded',
            customer_email: customer.email,
            return_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
            // NO pedimos dirección ni teléfono en Stripe, ya lo tenemos
            // shipping_address_collection y phone_number_collection se omiten
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
    } catch (err: any) {
        console.error('Error creating checkout session:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
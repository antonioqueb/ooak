import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-10-28.acacia', // Updated to match the installed library version (v17.3.1)
});

export async function POST(req: Request) {
    try {
        const { items } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
        }

        // Map cart items to Stripe line items
        const lineItems = items.map((item: any) => {
            return {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                        images: item.image ? [item.image.startsWith('http') ? item.image : `https://oneofakind.alphaqueb.com${item.image}`] : [],
                        description: item.description ? item.description.substring(0, 100) : undefined,
                        metadata: {
                            sku: item.slug // Assuming slug is used as SKU/Internal Reference
                        }
                    },
                    unit_amount: Math.round(item.price * 100), // Stripe expects cents
                },
                quantity: item.quantity,
            };
        });

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            ui_mode: 'embedded',
            return_url: `${req.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
            // automatic_tax: { enabled: true }, // Disabled to avoid configuration error
            shipping_address_collection: {
                allowed_countries: ['US', 'MX', 'CA'],
            },
        });

        return NextResponse.json({ clientSecret: session.client_secret });
    } catch (err: any) {
        console.error('Error creating checkout session:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

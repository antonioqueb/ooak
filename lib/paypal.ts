// Cliente mínimo para la REST API de PayPal (Orders v2 + webhooks).
// Solo server-side: usa el Client Secret.
import type { PricedCart, CustomerInput } from '@/lib/checkout-pricing';

const PAYPAL_ENV = process.env.PAYPAL_ENV === 'live' ? 'live' : 'sandbox';
export const PAYPAL_BASE_URL = PAYPAL_ENV === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

export const PAYPAL_CURRENCY = 'MXN';
export const PAYPAL_BRAND_NAME = 'One of a Kind';

export interface PayPalAmount { currency_code: string; value: string }

export interface PayPalOrder {
    id: string;
    status: 'CREATED' | 'SAVED' | 'APPROVED' | 'VOIDED' | 'COMPLETED' | 'PAYER_ACTION_REQUIRED';
    payer?: {
        email_address?: string;
        name?: { given_name?: string; surname?: string };
        phone?: { phone_number?: { national_number?: string } };
    };
    purchase_units: Array<{
        reference_id?: string;
        custom_id?: string;
        amount: PayPalAmount & { breakdown?: Record<string, PayPalAmount> };
        items?: Array<{ name: string; sku?: string; quantity: string; unit_amount: PayPalAmount }>;
        shipping?: {
            name?: { full_name?: string };
            address?: {
                address_line_1?: string;
                address_line_2?: string;
                admin_area_2?: string;
                admin_area_1?: string;
                postal_code?: string;
                country_code?: string;
            };
        };
        payments?: {
            captures?: Array<{ id: string; status: string; amount: PayPalAmount }>;
        };
    }>;
}

export class PayPalApiError extends Error {
    status: number;
    issue?: string;
    body: any;
    constructor(status: number, body: any) {
        super(`PayPal responded with ${status}: ${body?.name || body?.message || 'unknown'}`);
        this.status = status;
        this.body = body;
        this.issue = body?.details?.[0]?.issue;
    }
}

// Token de acceso (client_credentials) con caché en memoria hasta su expiración.
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
    if (!CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('Missing NEXT_PUBLIC_PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET');
    }
    if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
        return tokenCache.token;
    }
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const res = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
        cache: 'no-store',
    });
    const json = await res.json();
    if (!res.ok) throw new PayPalApiError(res.status, json);
    tokenCache = { token: json.access_token, expiresAt: Date.now() + json.expires_in * 1000 };
    return json.access_token;
}

async function paypalFetch<T>(path: string, init: RequestInit & { idempotencyKey?: string } = {}): Promise<T> {
    const token = await getAccessToken();
    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers as Record<string, string> | undefined),
    };
    if (init.idempotencyKey) headers['PayPal-Request-Id'] = init.idempotencyKey;

    const res = await fetch(`${PAYPAL_BASE_URL}${path}`, { ...init, headers, cache: 'no-store' });
    const text = await res.text();
    const json = text ? JSON.parse(text) : {};
    if (!res.ok) throw new PayPalApiError(res.status, json);
    return json as T;
}

const money = (cents: number): PayPalAmount => ({
    currency_code: PAYPAL_CURRENCY,
    value: (cents / 100).toFixed(2),
});

function splitName(full: string): { given_name: string; surname: string } {
    const parts = full.trim().split(/\s+/);
    if (parts.length === 1) return { given_name: parts[0], surname: '' };
    return { given_name: parts[0], surname: parts.slice(1).join(' ') };
}

// Crea una orden con intent CAPTURE. El monto es el calculado en el servidor.
// El teléfono va en custom_id porque PayPal no tiene metadata libre.
export async function createPayPalOrder(
    priced: PricedCart,
    customer: CustomerInput,
    origin: string,
): Promise<PayPalOrder> {
    const body = {
        intent: 'CAPTURE',
        purchase_units: [
            {
                reference_id: 'default',
                description: `${PAYPAL_BRAND_NAME} order`,
                custom_id: `phone:${customer.phone || ''}`.substring(0, 127),
                amount: {
                    ...money(priced.totalCents),
                    breakdown: {
                        item_total: money(priced.subtotalCents),
                        tax_total: money(priced.taxCents),
                        shipping: money(priced.shippingCents),
                    },
                },
                items: priced.lines.map((line) => ({
                    name: line.name.substring(0, 127),
                    sku: line.slug.substring(0, 127),
                    quantity: String(line.quantity),
                    unit_amount: money(line.unitAmountCents),
                    category: 'PHYSICAL_GOODS',
                })),
                shipping: {
                    name: { full_name: (customer.shipping_name || customer.name).substring(0, 300) },
                    address: {
                        address_line_1: customer.shipping_line1 || '',
                        address_line_2: customer.shipping_line2 || undefined,
                        admin_area_2: customer.shipping_city || '',
                        admin_area_1: customer.shipping_state || '',
                        postal_code: customer.shipping_postal_code || '',
                        country_code: (customer.shipping_country || 'MX').toUpperCase(),
                    },
                },
            },
        ],
        payment_source: {
            paypal: {
                email_address: customer.email,
                name: splitName(customer.name),
                experience_context: {
                    brand_name: PAYPAL_BRAND_NAME,
                    shipping_preference: 'SET_PROVIDED_ADDRESS',
                    user_action: 'PAY_NOW',
                    return_url: `${origin}/success`,
                    cancel_url: `${origin}/cancel`,
                },
            },
        },
    };

    return paypalFetch<PayPalOrder>('/v2/checkout/orders', {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

export function getPayPalOrder(orderId: string): Promise<PayPalOrder> {
    return paypalFetch<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}`, { method: 'GET' });
}

export function capturePayPalOrder(orderId: string): Promise<PayPalOrder> {
    return paypalFetch<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
        method: 'POST',
        body: '{}',
        idempotencyKey: `capture-${orderId}`,
    });
}

// Verifica la firma de un webhook contra PayPal. Devuelve true solo si PayPal
// responde SUCCESS.
export async function verifyPayPalWebhook(headers: Headers, rawBody: string): Promise<boolean> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    if (!webhookId) throw new Error('Missing PAYPAL_WEBHOOK_ID');

    const payload = {
        auth_algo: headers.get('paypal-auth-algo'),
        cert_url: headers.get('paypal-cert-url'),
        transmission_id: headers.get('paypal-transmission-id'),
        transmission_sig: headers.get('paypal-transmission-sig'),
        transmission_time: headers.get('paypal-transmission-time'),
        webhook_id: webhookId,
        webhook_event: JSON.parse(rawBody),
    };
    if (Object.values(payload).some((v) => v === null || v === undefined)) return false;

    const result = await paypalFetch<{ verification_status: string }>(
        '/v1/notifications/verify-webhook-signature',
        { method: 'POST', body: JSON.stringify(payload) },
    );
    return result.verification_status === 'SUCCESS';
}

export function isOrderCaptured(order: PayPalOrder): boolean {
    if (order.status === 'COMPLETED') return true;
    return order.purchase_units.some((pu) =>
        pu.payments?.captures?.some((c) => c.status === 'COMPLETED'),
    );
}

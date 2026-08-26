import { NextRequest, NextResponse } from 'next/server';

// Rate limiting básico en memoria (ventana deslizante por IP + ruta).
// Nota: el estado es por instancia; con `output: standalone` (proceso Node
// persistente) es efectivo. Para múltiples réplicas conviene un store
// compartido (Redis/Upstash).
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Límites por ruta (peticiones por ventana de 60s).
const LIMITS: { prefix: string; max: number }[] = [
    { prefix: '/api/checkout_sessions', max: 10 },
    { prefix: '/api/checkout/confirm', max: 15 },
    { prefix: '/api/paypal/orders', max: 15 },
    { prefix: '/api/newsletter/subscribe', max: 5 },
];

const WINDOW_MS = 60_000;

function getClientIp(req: NextRequest): string {
    const fwd = req.headers.get('x-forwarded-for');
    if (fwd) return fwd.split(',')[0].trim();
    return req.headers.get('x-real-ip') || 'unknown';
}

export function middleware(req: NextRequest) {
    // Los webhooks (Stripe/PayPal) NO se limitan: reintentan legítimamente y
    // ya están protegidos por firma.
    const path = req.nextUrl.pathname;
    const rule = LIMITS.find((r) => path.startsWith(r.prefix));

    if (!rule || req.method !== 'POST') {
        return NextResponse.next();
    }

    const key = `${getClientIp(req)}:${rule.prefix}`;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || now > bucket.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
        return NextResponse.next();
    }

    if (bucket.count >= rule.max) {
        const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
        return NextResponse.json(
            { error: 'Too many requests' },
            { status: 429, headers: { 'Retry-After': String(retryAfter) } }
        );
    }

    bucket.count += 1;
    return NextResponse.next();
}

export const config = {
    matcher: ['/api/checkout_sessions', '/api/checkout/confirm', '/api/paypal/orders/:path*', '/api/newsletter/subscribe'],
};

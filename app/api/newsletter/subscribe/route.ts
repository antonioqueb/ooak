import { NextResponse } from 'next/server';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const email = typeof body?.email === 'string' ? body.email.trim() : '';

        // Validar el email antes de reenviar a Odoo (evita basura/abuso).
        if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
            return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
        }

        const res = await fetch('https://erp.oneofakind.com.mx/api/newsletter/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Solo reenviamos el email saneado, no el body completo del cliente.
            body: JSON.stringify({ email }),
        });

        const data = await res.json();

        // Pass through the status code from the backend
        return NextResponse.json(data, { status: res.status });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

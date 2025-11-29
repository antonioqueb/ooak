import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // El servidor de Next.js hace la petición a Odoo (esto evita el CORS del navegador)
        const res = await fetch('https://odoo-ooak.alphaqueb.com/api/the-brand/content', {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Para evitar caché y siempre traer datos frescos
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Error fetching from Odoo' }, { status: res.status });
        }

        const data = await res.json();

        // Devolvemos los datos al frontend
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

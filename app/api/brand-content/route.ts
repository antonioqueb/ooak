import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // El servidor de Next.js hace la petición a Odoo (esto evita el CORS del navegador)
        const res = await fetch('https://erp.oneofakind.com.mx/api/the-brand/content', {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Para evitar caché y siempre traer datos frescos
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Error fetching from Odoo' }, { status: res.status });
        }

        const data = await res.json();

        // Convertir todas las URLs http a https para evitar contenido mixto
        const jsonString = JSON.stringify(data).replace(/http:\/\/odoo-ooak\.alphaqueb\.com/g, 'https://erp.oneofakind.com.mx');
        const secureData = JSON.parse(jsonString);

        // Devolvemos los datos al frontend
        return NextResponse.json(secureData);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

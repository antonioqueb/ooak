import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await fetch('https://erp.oneofakind.com.mx/odoo/api/footer/content', {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Error fetching footer content' }, { status: res.status });
        }

        const data = await res.json();

        // Enforce HTTPS
        const jsonString = JSON.stringify(data).replace(/http:\/\/odoo-ooak\.alphaqueb\.com/g, 'https://erp.oneofakind.com.mx/odoo');
        const secureData = JSON.parse(jsonString);

        return NextResponse.json(secureData);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

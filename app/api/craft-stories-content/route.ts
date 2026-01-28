import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await fetch('https://erp.oneofakind.com.mx/api/craft-stories/content', {
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store',
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Error fetching from Odoo' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

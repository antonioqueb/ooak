import { NextResponse } from 'next/server';

const UPSTREAM = 'https://erp.oneofakind.com.mx/api/collections_data';

export async function GET() {
    try {
        const res = await fetch(UPSTREAM, { cache: 'no-store' });
        if (!res.ok) {
            return NextResponse.json(
                { error: 'Upstream error', status: res.status },
                { status: res.status }
            );
        }
        const data = await res.json();
        return NextResponse.json(data);
    } catch (err: any) {
        return NextResponse.json({ error: err?.message || 'Fetch failed' }, { status: 502 });
    }
}

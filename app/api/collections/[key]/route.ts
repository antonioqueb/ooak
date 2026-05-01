import { NextResponse } from 'next/server';

const UPSTREAM_BASE = 'https://erp.oneofakind.com.mx/api/collection';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ key: string }> }
) {
    try {
        const { key } = await params;
        const res = await fetch(`${UPSTREAM_BASE}/${encodeURIComponent(key)}`, {
            cache: 'no-store',
        });
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

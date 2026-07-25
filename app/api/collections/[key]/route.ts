import { NextResponse } from 'next/server';
import { isValidSlug } from '@/lib/validation';

const UPSTREAM_BASE = 'https://erp.oneofakind.com.mx/api/collection';

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ key: string }> }
) {
    try {
        const { key } = await params;
        if (!isValidSlug(key)) {
            return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
        }
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
    } catch (err) {
        console.error('Error fetching collection');
        return NextResponse.json({ error: 'Fetch failed' }, { status: 502 });
    }
}

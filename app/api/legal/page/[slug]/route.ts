import { NextResponse } from 'next/server';
import { getLegalPage } from '@/lib/legal';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params;
    const page = await getLegalPage(slug);

    if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json({ data: page });
}

import { NextResponse } from 'next/server';
import { getLegalPages } from '@/lib/legal';

export async function GET() {
    const pages = await getLegalPages();
    return NextResponse.json({ data: pages });
}

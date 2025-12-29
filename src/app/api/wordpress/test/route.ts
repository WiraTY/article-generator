import { verifyConnection } from '@/lib/services/wordpress';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { url, username, applicationPassword } = body;

        if (!url || !username || !applicationPassword) {
            return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
        }

        const cleanUrl = url.replace(/\/$/, '');
        const success = await verifyConnection({
            url: cleanUrl,
            username,
            applicationPassword
        });

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Connection failed. Check credentials.' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

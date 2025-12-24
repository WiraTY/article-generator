import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';

export async function GET() {
    try {
        const session = await getSession();

        if (!session) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
        }

        return NextResponse.json({
            user: {
                id: session.userId,
                email: session.email,
                name: session.name,
                role: session.role
            }
        });
    } catch (error: any) {
        console.error('Get session error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

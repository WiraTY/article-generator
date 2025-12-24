import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export interface SessionUser {
    userId: number;
    email: string;
    name: string;
    role: 'super_admin' | 'author' | 'user';
    token: string;
}

export async function getSession(): Promise<SessionUser | null> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');

    if (!sessionCookie) {
        return null;
    }

    try {
        return JSON.parse(sessionCookie.value) as SessionUser;
    } catch {
        return null;
    }
}

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

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
        const { verifySession } = await import('./jwt');
        const payload = await verifySession(sessionCookie.value);

        if (!payload) return null;

        return {
            userId: payload.userId,
            email: payload.email,
            name: payload.name,
            role: payload.role,
            token: sessionCookie.value // Keep the JWT as the token reference
        };
    } catch {
        return null;
    }
}

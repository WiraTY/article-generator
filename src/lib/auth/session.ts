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

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Check if the current request is from an authenticated admin
 * Returns null if authenticated, or a 401 response if not
 */
export async function requireAuth(): Promise<NextResponse | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session?.value) {
        return NextResponse.json(
            { error: 'Unauthorized - Please login first' },
            { status: 401 }
        );
    }

    // TODO: In future, validate session against database
    // For now, we just check if cookie exists
    return null;
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifySession } from '@/lib/auth/jwt';

export async function middleware(request: NextRequest) {
    // 1. Define paths to protect
    // We want to protect /admin/* and /api/*
    // But exclude public paths like login, images, etc.
    const path = request.nextUrl.pathname;

    // Exclude public paths
    if (
        path.startsWith('/api/auth/login') ||
        path.startsWith('/api/auth/logout') || // Logout is technically fine to be public, or protected. keeping it open is fine.
        path.startsWith('/admin/login') ||
        path.startsWith('/_next') ||
        path.startsWith('/favicon.ico') ||
        path === '/admin/login'
    ) {
        return NextResponse.next();
    }

    // Identify if it's a protected route
    const isProtectedAdmin = path.startsWith('/admin');
    const isProtectedApi = path.startsWith('/api');

    if (!isProtectedAdmin && !isProtectedApi) {
        return NextResponse.next();
    }

    // 2. Check Session
    const cookie = request.cookies.get('admin_session');

    // If no cookie, redirect or 401
    if (!cookie?.value) {
        if (isProtectedApi) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        } else {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // 3. Verify JWT
    const session = await verifySession(cookie.value);
    if (!session) {
        if (isProtectedApi) {
            return NextResponse.json({ error: 'Invalid Session' }, { status: 401 });
        } else {
            return NextResponse.redirect(new URL('/admin/login', request.url));
        }
    }

    // 4. Proceed
    return NextResponse.next();
}

export const config = {
    matcher: [
        '/admin/:path*',
        '/api/:path*'
    ]
};

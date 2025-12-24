import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Simple session token generation
function generateToken(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
    initializeDatabase();

    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        // Find user by email
        const user = await db.select().from(users).where(eq(users.email, email)).limit(1);

        if (user.length === 0) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // Check password
        const isValidPassword = bcrypt.compareSync(password, user[0].password);
        if (!isValidPassword) {
            return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
        }

        // Check if user has admin access (must be super_admin or author)
        if (user[0].role === 'user') {
            return NextResponse.json({ error: 'You do not have admin access' }, { status: 403 });
        }

        // Generate session token
        const token = generateToken();

        // Create session data (stored in cookie)
        const sessionData = JSON.stringify({
            userId: user[0].id,
            email: user[0].email,
            name: user[0].name,
            role: user[0].role,
            token: token
        });

        // Set HTTP-only cookie
        const cookieStore = await cookies();
        cookieStore.set('admin_session', sessionData, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/'
        });

        return NextResponse.json({
            success: true,
            user: {
                id: user[0].id,
                email: user[0].email,
                name: user[0].name,
                role: user[0].role
            }
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

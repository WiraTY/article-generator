import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

// Helper to check if user is super_admin
async function isSuperAdmin(): Promise<boolean> {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    if (!sessionCookie) return false;
    try {
        const session = JSON.parse(sessionCookie.value);
        return session.role === 'super_admin';
    } catch {
        return false;
    }
}

// GET /api/users - Get all users (Super Admin only)
export async function GET() {
    initializeDatabase();

    if (!await isSuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const allUsers = await db.select({
            id: users.id,
            email: users.email,
            name: users.name,
            role: users.role,
            createdAt: users.createdAt
        }).from(users).orderBy(desc(users.createdAt));

        return NextResponse.json(allUsers);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/users - Create new user (Super Admin only)
export async function POST(request: NextRequest) {
    initializeDatabase();

    if (!await isSuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { email, password, name, role } = await request.json();

        if (!email || !password || !name || !role) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        // Check if email already exists
        const existing = await db.select().from(users).where(eq(users.email, email));
        if (existing.length > 0) {
            return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
        }

        const hashedPassword = bcrypt.hashSync(password, 12);

        const result = await db.insert(users).values({
            email,
            password: hashedPassword,
            name,
            role
        }).returning();

        return NextResponse.json({
            id: result[0].id,
            email: result[0].email,
            name: result[0].name,
            role: result[0].role
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/users - Update user (Super Admin only)
export async function PUT(request: NextRequest) {
    initializeDatabase();

    if (!await isSuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { id, name, role, password } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        const updateData: any = {};
        if (name) updateData.name = name;
        if (role) updateData.role = role;
        if (password) updateData.password = bcrypt.hashSync(password, 12);

        await db.update(users).set(updateData).where(eq(users.id, id));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/users - Delete user (Super Admin only)
export async function DELETE(request: NextRequest) {
    initializeDatabase();

    if (!await isSuperAdmin()) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        await db.delete(users).where(eq(users.id, parseInt(id)));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

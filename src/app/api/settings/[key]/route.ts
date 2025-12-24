import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

let initialized = false;
function ensureInit() {
    if (!initialized) {
        initializeDatabase();
        initialized = true;
    }
}

// GET /api/settings/[key] - Get a setting by key
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ key: string }> }
) {
    ensureInit();
    try {
        const { key } = await params;
        const result = await db.select().from(settings).where(eq(settings.key, key));

        if (result.length === 0) {
            return NextResponse.json({ key, value: '' });
        }

        return NextResponse.json(result[0]);
    } catch (error: any) {
        console.error('Get setting error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/settings/[key] - Update or create a setting
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ key: string }> }
) {
    ensureInit();
    try {
        const { key } = await params;
        const { value } = await request.json();

        // Check if setting exists
        const existing = await db.select().from(settings).where(eq(settings.key, key));

        let result;
        if (existing.length > 0) {
            // Update existing
            result = await db.update(settings)
                .set({ value, updatedAt: new Date().toISOString() })
                .where(eq(settings.key, key))
                .returning();
        } else {
            // Insert new
            result = await db.insert(settings)
                .values({ key, value })
                .returning();
        }

        return NextResponse.json(result[0]);
    } catch (error: any) {
        console.error('Update setting error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

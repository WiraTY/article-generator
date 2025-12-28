import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

// POST /api/analytics/view - Increment views for an article
export async function POST(request: NextRequest) {
    await initializeDatabase();
    try {
        const { id, slug } = await request.json();

        if (id) {
            await db.update(articles)
                .set({ views: sql`${articles.views} + 1` })
                .where(eq(articles.id, id));
        } else if (slug) {
            await db.update(articles)
                .set({ views: sql`${articles.views} + 1` })
                .where(eq(articles.slug, slug));
        } else {
            return NextResponse.json({ error: 'Missing id or slug' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

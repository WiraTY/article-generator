import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

let initialized = false;
async function ensureInit() {
    if (!initialized) {
        await initializeDatabase();
        initialized = true;
    }
}

// POST /api/articles/[slug]/undo - Undo last regeneration (swap content back)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    await ensureInit();
    try {
        const { slug } = await params;

        // Get existing article
        const existing = await db.select().from(articles).where(eq(articles.slug, slug));
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        const article = existing[0];

        // Check if there's a previous version to restore
        if (!article.previousContentHtml) {
            return NextResponse.json({ error: 'No previous version available to undo' }, { status: 400 });
        }

        // Swap: current becomes previous, previous becomes current
        console.log('[Undo] Before swap - contentHtml length:', article.contentHtml?.length);
        console.log('[Undo] Before swap - previousContentHtml length:', article.previousContentHtml?.length);

        const result = await db.update(articles)
            .set({
                contentHtml: article.previousContentHtml,
                previousContentHtml: article.contentHtml // Allow re-undo (swap back)
            })
            .where(eq(articles.id, article.id))
            .returning();

        console.log('[Undo] After swap - new contentHtml length:', result[0]?.contentHtml?.length);
        console.log('[Undo] After swap - new previousContentHtml length:', result[0]?.previousContentHtml?.length);

        return NextResponse.json({
            ...result[0],
            message: 'Content restored to previous version'
        });
    } catch (error: any) {
        console.error('Undo article error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

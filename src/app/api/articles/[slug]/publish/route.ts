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

// POST /api/articles/[slug]/publish - Publish an article locally
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    await ensureInit();
    try {
        const { slug } = await params;

        // Find the article
        const existingArticle = await db.select().from(articles).where(eq(articles.slug, slug));
        if (existingArticle.length === 0) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Update status to published and set publishedAt
        await db.update(articles)
            .set({
                status: 'published',
                publishedAt: new Date()
            })
            .where(eq(articles.slug, slug));

        return NextResponse.json({ success: true, message: 'Article published successfully' });
    } catch (error: any) {
        console.error('Publish article error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

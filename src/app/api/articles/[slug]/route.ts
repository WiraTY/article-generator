import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { articles, comments, generationJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

let initialized = false;
async function ensureInit() {
    if (!initialized) {
        await initializeDatabase();
        initialized = true;
    }
}

// GET /api/articles/[slug] - Get single article
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    await ensureInit();
    try {
        const { slug } = await params;
        const article = await db.select().from(articles).where(eq(articles.slug, slug));

        if (article.length === 0) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        return NextResponse.json(article[0]);
    } catch (error: any) {
        console.error('Get article error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/articles/[slug] - Update article (using id from body)
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    await ensureInit();
    try {
        const { slug } = await params;
        const { title, metaDescription, contentHtml, imageUrl, imageAlt, mainKeyword, tags } = await request.json();

        // Get article by slug first
        const existing = await db.select().from(articles).where(eq(articles.slug, slug));
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // Convert tags from comma-separated string to JSON array if needed
        let tagsJson = tags;
        if (tags && typeof tags === 'string' && !tags.startsWith('[')) {
            tagsJson = JSON.stringify(tags.split(',').map((t: string) => t.trim()).filter((t: string) => t));
        }

        const result = await db.update(articles)
            .set({
                title,
                metaDescription,
                contentHtml,
                imageUrl,
                imageAlt,
                mainKeyword,
                tags: tagsJson
            })
            .where(eq(articles.id, existing[0].id))
            .returning();

        return NextResponse.json(result[0]);
    } catch (error: any) {
        console.error('Update article error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/articles/[slug]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    await ensureInit();
    try {
        const { slug } = await params;
        const existing = await db.select().from(articles).where(eq(articles.slug, slug));
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        const articleId = existing[0].id;

        // Delete related records first (cascade manually)
        await db.delete(comments).where(eq(comments.articleId, articleId));
        await db.delete(generationJobs).where(eq(generationJobs.articleId, articleId));

        // Now delete the article
        await db.delete(articles).where(eq(articles.id, articleId));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete article error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

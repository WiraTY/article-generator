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

interface PreviousData {
    contentHtml: string;
    title: string;
    metaDescription: string;
    tags: string;
}

// POST /api/articles/[slug]/undo - Undo last regeneration (restore all fields)
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

        // Try to parse previousContentHtml as JSON (new format)
        let previousData: PreviousData | null = null;
        let isJsonFormat = false;

        try {
            const parsed = JSON.parse(article.previousContentHtml);
            // Check if it has the expected structure
            if (parsed && typeof parsed === 'object' && 'contentHtml' in parsed) {
                previousData = parsed as PreviousData;
                isJsonFormat = true;
            }
        } catch {
            // Not JSON, treat as old format (just HTML content)
            isJsonFormat = false;
        }

        // Save current state as JSON for re-undo
        const currentData = JSON.stringify({
            contentHtml: article.contentHtml,
            title: article.title,
            metaDescription: article.metaDescription,
            tags: article.tags
        });

        if (isJsonFormat && previousData) {
            // New format: restore all fields
            console.log('[Undo] Restoring from JSON format - all fields');

            const result = await db.update(articles)
                .set({
                    contentHtml: previousData.contentHtml,
                    title: previousData.title,
                    metaDescription: previousData.metaDescription,
                    tags: previousData.tags,
                    previousContentHtml: currentData // Save current for re-undo
                })
                .where(eq(articles.id, article.id))
                .returning();

            return NextResponse.json({
                ...result[0],
                message: 'All content restored to previous version (title, meta, tags, and content)'
            });
        } else {
            // Old format: just swap contentHtml (backwards compatibility)
            console.log('[Undo] Restoring from old format - content only');

            // Check if previous content is actually different
            if (article.previousContentHtml === article.contentHtml) {
                return NextResponse.json({ error: 'Previous version is identical to current version' }, { status: 400 });
            }

            const result = await db.update(articles)
                .set({
                    contentHtml: article.previousContentHtml,
                    previousContentHtml: article.contentHtml // Allow re-undo (swap back)
                })
                .where(eq(articles.id, article.id))
                .returning();

            return NextResponse.json({
                ...result[0],
                message: 'Content restored to previous version (content only - old format)'
            });
        }
    } catch (error: any) {
        console.error('Undo article error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

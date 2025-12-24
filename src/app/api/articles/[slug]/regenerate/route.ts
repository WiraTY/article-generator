import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { articles, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generateArticle } from '@/lib/services/aiService';

let initialized = false;
function ensureInit() {
    if (!initialized) {
        initializeDatabase();
        initialized = true;
    }
}

// POST /api/articles/[slug]/regenerate - Regenerate article content with custom prompt
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    ensureInit();
    try {
        const { slug } = await params;
        const { customPrompt } = await request.json();

        // Get existing article
        const existing = await db.select().from(articles).where(eq(articles.slug, slug));
        if (existing.length === 0) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        const article = existing[0];

        // Fetch product knowledge from settings
        let productKnowledge = '';
        try {
            const pkResult = await db.select().from(settings).where(eq(settings.key, 'productKnowledge'));
            if (pkResult.length > 0) {
                productKnowledge = pkResult[0].value;
            }
        } catch (e) {
            console.log('No product knowledge found');
        }

        // Generate new article content using AI
        const generatedArticle = await generateArticle(
            article.mainKeyword || article.title,
            'informational', // Default intent
            customPrompt || '',
            productKnowledge
        );

        // Save current content to previousContentHtml for undo
        // Then update with new content
        const result = await db.update(articles)
            .set({
                previousContentHtml: article.contentHtml, // Save current for undo
                contentHtml: generatedArticle.content_html,
                title: generatedArticle.title,
                metaDescription: generatedArticle.meta_description,
                tags: JSON.stringify(generatedArticle.tags || [])
            })
            .where(eq(articles.id, article.id))
            .returning();

        return NextResponse.json({
            ...result[0],
            canUndo: true
        });
    } catch (error: any) {
        console.error('Regenerate article error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

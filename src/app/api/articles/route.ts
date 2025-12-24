import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { articles, keywords, settings } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { generateArticle } from '@/lib/services/aiService';
import slugify from 'slugify';

// Initialize database on first request
let initialized = false;
function ensureInit() {
    if (!initialized) {
        initializeDatabase();
        initialized = true;
    }
}

// GET /api/articles - Get all articles
export async function GET() {
    ensureInit();
    try {
        const allArticles = await db.select({
            id: articles.id,
            title: articles.title,
            slug: articles.slug,
            metaDescription: articles.metaDescription,
            mainKeyword: articles.mainKeyword,
            tags: articles.tags,
            author: articles.author,
            imageUrl: articles.imageUrl,
            imageAlt: articles.imageAlt,
            previousContentHtml: articles.previousContentHtml,
            publishedAt: articles.publishedAt
        }).from(articles).orderBy(desc(articles.publishedAt));

        return NextResponse.json(allArticles);
    } catch (error: any) {
        console.error('Get articles error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/articles - Generate new article
export async function POST(request: NextRequest) {
    ensureInit();
    try {
        const { keywordId, keyword, intent, customPrompt } = await request.json();

        if (!keyword || !intent) {
            return NextResponse.json({ error: 'Keyword and intent are required' }, { status: 400 });
        }

        // Fetch product knowledge from settings
        let productKnowledge = '';
        try {
            const pkResult = await db.select().from(settings).where(eq(settings.key, 'productKnowledge'));
            if (pkResult.length > 0) {
                productKnowledge = pkResult[0].value;
            }
        } catch (e) {
            console.log('No product knowledge found, continuing without it');
        }

        // Generate article using AI
        const generatedArticle = await generateArticle(keyword, intent, customPrompt || '', productKnowledge);

        // Create URL-friendly slug
        const slug = slugify(keyword, { lower: true, strict: true });

        // Check if slug already exists
        const existingArticle = await db.select().from(articles).where(eq(articles.slug, slug));
        const finalSlug = existingArticle.length > 0
            ? `${slug}-${Date.now()}`
            : slug;

        // Generate featured image URL and alt text
        const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(finalSlug)}/800/400`;
        const imageAlt = `Ilustrasi ${generatedArticle.title}`;

        // Save to database
        const result = await db.insert(articles).values({
            keywordId: keywordId || null,
            title: generatedArticle.title,
            slug: finalSlug,
            metaDescription: generatedArticle.meta_description,
            contentHtml: generatedArticle.content_html,
            mainKeyword: keyword,
            tags: JSON.stringify(generatedArticle.tags || []),
            author: 'Admin',
            imageUrl: imageUrl,
            imageAlt: imageAlt,
            publishedAt: new Date()
        }).returning();

        // Update keyword status if keywordId provided
        if (keywordId) {
            await db.update(keywords)
                .set({ status: 'published' })
                .where(eq(keywords.id, keywordId));
        }

        return NextResponse.json(result[0]);
    } catch (error: any) {
        console.error('Generate article error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { generationJobs, articles, keywords, settings } from '@/lib/db/schema';
import { desc, eq, inArray } from 'drizzle-orm';
import { generateArticle } from '@/lib/services/aiService';
import slugify from 'slugify';

let initialized = false;
async function ensureInit() {
    if (!initialized) {
        await initializeDatabase();
        initialized = true;
    }
}

// GET /api/jobs - Get active jobs
export async function GET() {
    await ensureInit();
    try {
        const activeJobs = await db.select()
            .from(generationJobs)
            .where(inArray(generationJobs.status, ['pending', 'processing']))
            .orderBy(desc(generationJobs.createdAt));

        return NextResponse.json(activeJobs);
    } catch (error: any) {
        console.error('Get jobs error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/jobs - Create a new generation or regeneration job
export async function POST(request: NextRequest) {
    await ensureInit();
    try {
        const { jobType = 'generate', keywordId, keyword, intent, customPrompt, articleSlug, useCustomOnly = false } = await request.json();

        if (!keyword || !intent) {
            return NextResponse.json({ error: 'Keyword and intent are required' }, { status: 400 });
        }

        // For regenerate jobs, articleSlug is required
        if (jobType === 'regenerate' && !articleSlug) {
            return NextResponse.json({ error: 'Article slug is required for regenerate jobs' }, { status: 400 });
        }

        // Create the job
        const result = await db.insert(generationJobs).values({
            jobType,
            keywordId: keywordId || null,
            keyword,
            intent,
            customPrompt: customPrompt || null,
            useCustomOnly: useCustomOnly || false,
            articleSlug: articleSlug || null,
            status: 'pending'
        }).returning();

        const job = result[0];

        // Start processing in the background (fire-and-forget)
        processJobInBackground(job.id);

        return NextResponse.json(job);
    } catch (error: any) {
        console.error('Create job error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/jobs - Cancel a pending job (query param: id)
export async function DELETE(request: NextRequest) {
    await ensureInit();
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
        }

        const jobId = parseInt(id);

        // Get the job to check its status
        const jobs = await db.select().from(generationJobs).where(eq(generationJobs.id, jobId));
        if (jobs.length === 0) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        const job = jobs[0];

        // Can only cancel pending jobs (processing jobs are already in progress)
        if (job.status !== 'pending') {
            return NextResponse.json({
                error: job.status === 'processing' ? 'Cannot cancel a job that is already processing' : 'Job is already finished'
            }, { status: 400 });
        }

        // Mark as cancelled
        await db.update(generationJobs)
            .set({ status: 'cancelled', updatedAt: new Date().toISOString() })
            .where(eq(generationJobs.id, jobId));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Cancel job error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Background processing function
async function processJobInBackground(jobId: number) {
    try {
        // Check if job was cancelled before we start
        const jobCheck = await db.select().from(generationJobs).where(eq(generationJobs.id, jobId));
        if (jobCheck.length === 0 || jobCheck[0].status === 'cancelled') {
            console.log(`Job ${jobId} was cancelled, skipping.`);
            return;
        }

        // Update status to processing
        await db.update(generationJobs)
            .set({ status: 'processing', updatedAt: new Date().toISOString() })
            .where(eq(generationJobs.id, jobId));

        // Get the job details
        const jobs = await db.select().from(generationJobs).where(eq(generationJobs.id, jobId));
        if (jobs.length === 0) return;

        const job = jobs[0];

        // Fetch product knowledge if enabled
        let productKnowledge = '';
        try {
            const [pkRes, epkRes] = await Promise.all([
                db.select().from(settings).where(eq(settings.key, 'productKnowledge')),
                db.select().from(settings).where(eq(settings.key, 'enableProductKnowledge'))
            ]);

            const isEnabled = epkRes.length === 0 || epkRes[0].value !== 'disabled';

            if (isEnabled && pkRes.length > 0) {
                productKnowledge = pkRes[0].value;
            }
        } catch (e) {
            console.log('Error fetching product knowledge:', e);
        }

        // Generate article using AI
        const generatedArticle = await generateArticle(
            job.keyword,
            job.intent,
            job.customPrompt || '',
            productKnowledge,
            job.useCustomOnly || false
        );

        // Handle based on job type
        if (job.jobType === 'regenerate' && job.articleSlug) {
            // Regenerate: Update existing article
            const existingArticles = await db.select().from(articles).where(eq(articles.slug, job.articleSlug));
            if (existingArticles.length === 0) {
                throw new Error('Article not found for regeneration');
            }

            const existingArticle = existingArticles[0];

            // Save previous data as JSON for complete undo
            const previousData = JSON.stringify({
                contentHtml: existingArticle.contentHtml,
                title: existingArticle.title,
                metaDescription: existingArticle.metaDescription,
                tags: existingArticle.tags
            });

            // Update the article with new content
            await db.update(articles)
                .set({
                    previousContentHtml: previousData, // Store JSON with all fields
                    contentHtml: generatedArticle.content_html,
                    title: generatedArticle.title,
                    metaDescription: generatedArticle.meta_description,
                    tags: JSON.stringify(generatedArticle.tags || [])
                })
                .where(eq(articles.id, existingArticle.id));

            // Mark job as completed
            await db.update(generationJobs)
                .set({
                    status: 'completed',
                    articleId: existingArticle.id,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(generationJobs.id, jobId));

            console.log(`✓ Regenerate job ${jobId} completed, article updated: ${job.articleSlug}`);

        } else {
            // Generate: Create new article
            const slug = slugify(job.keyword, { lower: true, strict: true });

            // Check if slug already exists
            const existingArticle = await db.select().from(articles).where(eq(articles.slug, slug));
            const finalSlug = existingArticle.length > 0
                ? `${slug}-${Date.now()}`
                : slug;

            // Generate featured image URL and alt text
            const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(finalSlug)}/800/400`;
            const imageAlt = `Ilustrasi ${generatedArticle.title}`;

            // Save article to database
            const articleResult = await db.insert(articles).values({
                keywordId: job.keywordId || null,
                title: generatedArticle.title,
                slug: finalSlug,
                metaDescription: generatedArticle.meta_description,
                contentHtml: generatedArticle.content_html,
                mainKeyword: job.keyword,
                tags: JSON.stringify(generatedArticle.tags || []),
                author: 'Admin',
                imageUrl: imageUrl,
                imageAlt: imageAlt,
                publishedAt: new Date()
            }).returning();

            // Update keyword status if keywordId provided
            if (job.keywordId) {
                await db.update(keywords)
                    .set({ status: 'published' })
                    .where(eq(keywords.id, job.keywordId));
            }

            // Mark job as completed
            await db.update(generationJobs)
                .set({
                    status: 'completed',
                    articleId: articleResult[0].id,
                    updatedAt: new Date().toISOString()
                })
                .where(eq(generationJobs.id, jobId));

            console.log(`✓ Generate job ${jobId} completed, article created: ${finalSlug}`);
        }

    } catch (error: any) {
        console.error(`Job ${jobId} failed:`, error);

        // Mark job as failed
        await db.update(generationJobs)
            .set({
                status: 'failed',
                error: error.message,
                updatedAt: new Date().toISOString()
            })
            .where(eq(generationJobs.id, jobId));
    }
}

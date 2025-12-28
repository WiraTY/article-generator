import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { generationJobs, articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

let initialized = false;
async function ensureInit() {
    if (!initialized) {
        await initializeDatabase();
        initialized = true;
    }
}

// GET /api/jobs/[id] - Get job status
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    await ensureInit();
    try {
        const { id } = await params;
        const jobId = parseInt(id);

        if (isNaN(jobId)) {
            return NextResponse.json({ error: 'Invalid job ID' }, { status: 400 });
        }

        const jobs = await db.select().from(generationJobs).where(eq(generationJobs.id, jobId));

        if (jobs.length === 0) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        const job = jobs[0];

        // If job is completed, also fetch the article details
        let article = null;
        if (job.status === 'completed' && job.articleId) {
            const articleResults = await db.select({
                id: articles.id,
                title: articles.title,
                slug: articles.slug
            }).from(articles).where(eq(articles.id, job.articleId));

            if (articleResults.length > 0) {
                article = articleResults[0];
            }
        }

        return NextResponse.json({
            ...job,
            article
        });
    } catch (error: any) {
        console.error('Get job error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

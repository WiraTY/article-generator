import { NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { articles, comments, keywords } from '@/lib/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export async function GET() {
    await initializeDatabase();
    try {
        // Parallel fetching for performance
        const [
            totalArticlesRes,
            totalKeywordsRes,
            pendingKeywordsRes,
            totalCommentsRes,
            totalViewsRes,
            topViewedRes,
            mostEngagedRes,
            recentActivityRes
        ] = await Promise.all([
            db.select({ count: sql<number>`count(*)` }).from(articles),
            db.select({ count: sql<number>`count(*)` }).from(keywords),
            db.select({ count: sql<number>`count(*)` }).from(keywords).where(eq(keywords.status, 'new')),
            db.select({ count: sql<number>`count(*)` }).from(comments),
            db.select({ sum: sql<number>`sum(${articles.views})` }).from(articles),

            // Top 5 viewed articles
            db.select().from(articles).orderBy(desc(articles.views)).limit(5),

            // Top 5 most engaged articles (by comments count) - using subquery or simple left join approach
            // Simple approach: Get articles with comment counts
            db.select({
                id: articles.id,
                title: articles.title,
                slug: articles.slug,
                views: articles.views,
                commentCount: sql<number>`count(${comments.id})`
            })
                .from(articles)
                .leftJoin(comments, eq(articles.id, comments.articleId))
                .groupBy(articles.id)
                .orderBy(desc(sql`count(${comments.id})`))
                .limit(5),

            // Recent comments for activity feed
            db.select({
                id: comments.id,
                author: comments.name,
                content: comments.comment,
                articleTitle: articles.title,
                createdAt: comments.createdAt
            })
                .from(comments)
                .leftJoin(articles, eq(comments.articleId, articles.id))
                .orderBy(desc(comments.createdAt))
                .limit(5)
        ]);

        const stats = {
            totalArticles: totalArticlesRes[0]?.count || 0,
            totalKeywords: totalKeywordsRes[0]?.count || 0,
            pendingKeywords: pendingKeywordsRes[0]?.count || 0,
            totalComments: totalCommentsRes[0]?.count || 0,
            totalViews: totalViewsRes[0]?.sum || 0,
            topViewedArticles: topViewedRes,
            mostEngagedArticles: mostEngagedRes,
            recentActivity: recentActivityRes
        };

        return NextResponse.json(stats);
    } catch (error: any) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

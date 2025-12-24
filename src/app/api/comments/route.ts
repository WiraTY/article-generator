import { NextRequest, NextResponse } from 'next/server';
import { db, initializeDatabase } from '@/lib/db';
import { comments, articles, settings } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { cookies } from 'next/headers';

let initialized = false;
async function ensureInit() {
    if (!initialized) {
        await initializeDatabase();
        initialized = true;
    }
}

// Helper to get current session
async function getSession() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');
    if (!sessionCookie) return null;
    try {
        return JSON.parse(sessionCookie.value);
    } catch {
        return null;
    }
}

// GET /api/comments?articleId=X&admin=true - Get comments
export async function GET(request: NextRequest) {
    await ensureInit();
    try {
        const { searchParams } = new URL(request.url);
        const articleId = searchParams.get('articleId');
        const isAdmin = searchParams.get('admin') === 'true';
        const status = searchParams.get('status');

        // Admin mode - get all comments with article info
        if (isAdmin) {
            const session = await getSession();
            if (!session || (session.role !== 'super_admin' && session.role !== 'author')) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }

            let query = db.select({
                id: comments.id,
                articleId: comments.articleId,
                name: comments.name,
                comment: comments.comment,
                status: comments.status,
                createdAt: comments.createdAt,
                articleTitle: articles.title,
                articleSlug: articles.slug
            })
                .from(comments)
                .leftJoin(articles, eq(comments.articleId, articles.id))
                .orderBy(desc(comments.createdAt));

            const allComments = await query;

            // Filter by status if provided
            let filtered = allComments;
            if (status && status !== 'all') {
                filtered = allComments.filter(c => c.status === status);
            }

            return NextResponse.json(filtered);
        }

        // Public mode - only approved comments for specific article
        if (!articleId) {
            return NextResponse.json({ error: 'articleId is required' }, { status: 400 });
        }

        const articleComments = await db.select()
            .from(comments)
            .where(and(
                eq(comments.articleId, parseInt(articleId)),
                eq(comments.status, 'approved')
            ))
            .orderBy(desc(comments.createdAt));

        return NextResponse.json(articleComments);
    } catch (error: any) {
        console.error('Get comments error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST /api/comments - Add a comment (check moderation setting)
export async function POST(request: NextRequest) {
    await ensureInit();
    try {
        const { articleId, name, comment } = await request.json();

        if (!articleId || !name || !comment) {
            return NextResponse.json({ error: 'articleId, name, and comment are required' }, { status: 400 });
        }

        // Check if moderation is enabled
        const moderationSetting = await db.select()
            .from(settings)
            .where(eq(settings.key, 'commentModeration'))
            .limit(1);

        const requireApproval = !moderationSetting.length || moderationSetting[0].value !== 'disabled';
        const initialStatus = requireApproval ? 'pending' : 'approved';

        const result = await db.insert(comments).values({
            articleId: parseInt(articleId),
            name: name.trim(),
            comment: comment.trim(),
            status: initialStatus
        }).returning();

        return NextResponse.json({
            ...result[0],
            message: requireApproval ? 'Comment submitted for approval' : 'Comment posted'
        });
    } catch (error: any) {
        console.error('Add comment error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT /api/comments - Approve or reject a comment
export async function PUT(request: NextRequest) {
    await ensureInit();
    try {
        const session = await getSession();
        if (!session || (session.role !== 'super_admin' && session.role !== 'author')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id, status, ids } = await request.json();

        // Bulk update
        if (ids && Array.isArray(ids) && ids.length > 0) {
            for (const commentId of ids) {
                await db.update(comments)
                    .set({
                        status,
                        approvedBy: session.userId,
                        approvedAt: new Date().toISOString()
                    })
                    .where(eq(comments.id, commentId));
            }
            return NextResponse.json({ success: true, updated: ids.length });
        }

        // Single update
        if (!id || !status) {
            return NextResponse.json({ error: 'id and status are required' }, { status: 400 });
        }

        await db.update(comments)
            .set({
                status,
                approvedBy: session.userId,
                approvedAt: new Date().toISOString()
            })
            .where(eq(comments.id, id));

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Update comment error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/comments?id=X - Delete a comment
export async function DELETE(request: NextRequest) {
    await ensureInit();
    try {
        const session = await getSession();
        if (!session || (session.role !== 'super_admin' && session.role !== 'author')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        await db.delete(comments).where(eq(comments.id, parseInt(id)));
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Delete comment error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}


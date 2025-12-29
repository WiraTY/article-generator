import { db } from '@/lib/db';
import { articles, wordpressSettings } from '@/lib/db/schema';
import { createPost, getWordPressConfig } from '@/lib/services/wordpress';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { articleSlug, status } = body;

        // 1. Get Article
        const article = await db.query.articles.findFirst({
            where: eq(articles.slug, articleSlug)
        });

        if (!article) {
            return NextResponse.json({ error: 'Article not found' }, { status: 404 });
        }

        // 2. Get WP Config
        const config = await getWordPressConfig();
        if (!config) {
            return NextResponse.json({ error: 'WordPress not configured' }, { status: 400 });
        }

        // 3. Create Post
        // Note: For MVP we are not uploading the image to WP media library yet, 
        // we just leave the image handling to the user or hotlink if we had an image URL logic.
        // If the article has an image URL from our system (e.g. UploadThing), we can try to use it 
        // but WP needs it to be uploaded to set as featured image properly.
        // For now, we will just post the content.

        // Prepend image if available
        let finalContent = article.contentHtml;
        if (article.imageUrl) {
            // Add image at the top with some basic styling responsiveness
            const cleanImageUrl = article.imageUrl.trim();
            if (cleanImageUrl) {
                finalContent = `<figure class="wp-block-image"><img src="${cleanImageUrl}" alt="${article.imageAlt || article.title}" style="width:100%; height:auto; display:block; margin-bottom: 20px;" /></figure>${finalContent}`;
            }
        }

        const result = await createPost(config, {
            title: article.title,
            content: finalContent,
            status: status || config.defaultStatus || 'draft',
            tags: (() => {
                if (!article.tags) return [];
                try {
                    // Try parsing as JSON array first (e.g. ["tag1", "tag2"])
                    const parsed = JSON.parse(article.tags);
                    if (Array.isArray(parsed)) return parsed.map(t => String(t).trim()).filter(Boolean);
                } catch (e) {
                    // Fallback: handle "tag1", "tag2" or tag1, tag2 formats
                    // Remove brackets if they exist as artifacts
                    const cleanTags = article.tags.replace(/[\[\]"]/g, '');
                    return cleanTags.split(',').map(t => t.trim()).filter(Boolean);
                }
                return article.tags.split(',').map(t => t.trim()).filter(Boolean);
            })(),
            focusKeyword: article.mainKeyword || undefined,
            metaDescription: article.metaDescription || undefined,
            excerpt: article.metaDescription || undefined // Use meta description as excerpt for clean preview
        });

        return NextResponse.json({
            success: true,
            postId: result.id,
            link: result.link
        });

    } catch (error: any) {
        console.error('WP Publish Error:', error);
        return NextResponse.json({ error: error.message || 'Failed to publish' }, { status: 500 });
    }
}

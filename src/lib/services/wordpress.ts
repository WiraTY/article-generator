import { db } from '@/lib/db';
import { wordpressSettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

interface WordPressConfig {
    url: string;
    username: string;
    applicationPassword: string;
    defaultStatus?: 'draft' | 'publish';
}

export async function getWordPressConfig(): Promise<WordPressConfig | null> {
    const settings = await db.select().from(wordpressSettings).limit(1);
    if (!settings.length) return null;
    return settings[0] as unknown as WordPressConfig;
}

export async function verifyConnection(config: WordPressConfig): Promise<boolean> {
    try {
        const auth = btoa(`${config.username}:${config.applicationPassword}`);
        const res = await fetch(`${config.url}/wp-json/wp/v2/users/me`, {
            headers: {
                'Authorization': `Basic ${auth}`
            }
        });
        return res.ok;
    } catch (error) {
        console.error('WP Connection Error:', error);
        return false;
    }
}

// Helper to get or create tag ID
async function getOrCreateTag(config: WordPressConfig, tagName: string): Promise<number | null> {
    const auth = btoa(`${config.username}:${config.applicationPassword}`);
    try {
        // 1. Search for existing tag
        const searchRes = await fetch(`${config.url}/wp-json/wp/v2/tags?search=${encodeURIComponent(tagName)}`, {
            headers: { 'Authorization': `Basic ${auth}` }
        });
        if (searchRes.ok) {
            const tags = await searchRes.json();
            // Filter exact match case-insensitive
            const existing = tags.find((t: any) => t.name.toLowerCase() === tagName.toLowerCase());
            if (existing) return existing.id;
        }

        // 2. Create new tag if not found
        const createRes = await fetch(`${config.url}/wp-json/wp/v2/tags`, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: tagName })
        });

        if (createRes.ok) {
            const newTag = await createRes.json();
            return newTag.id;
        }
    } catch (e) {
        console.error(`Failed to process tag: ${tagName}`, e);
    }
    return null;
}

interface CreatePostParams {
    title: string;
    content: string;
    status?: 'draft' | 'publish';
    categories?: number[];
    tags?: string[]; // Changed to string array for auto-handling
    featuredMediaId?: number;
    metaDescription?: string;
    focusKeyword?: string;
    excerpt?: string; // Standard WP excerpt
}

export async function createPost(config: WordPressConfig, post: CreatePostParams) {
    const auth = btoa(`${config.username}:${config.applicationPassword}`);

    // Process tags first
    let finalTagIds: number[] = [];
    if (post.tags && post.tags.length > 0) {
        // Process in parallel
        const tagPromises = post.tags.map(t => getOrCreateTag(config, t.trim()));
        const tagResults = await Promise.all(tagPromises);
        finalTagIds = tagResults.filter((id): id is number => id !== null);
    }

    // Constructor meta fields for Yoast
    // Try multiple common key variations to maximize compatibility
    const meta: Record<string, any> = {};
    if (post.focusKeyword) {
        meta['_yoast_wpseo_focuskw'] = post.focusKeyword;
        meta['yoast_wpseo_focuskw'] = post.focusKeyword;
    }
    if (post.metaDescription) {
        meta['_yoast_wpseo_metadesc'] = post.metaDescription;
        meta['yoast_wpseo_metadesc'] = post.metaDescription;
    }

    // Debug log
    console.log('Sending to WP:', {
        title: post.title,
        tagsCount: finalTagIds?.length || 0,
        metaKeys: Object.keys(meta),
        hasExcerpt: !!post.excerpt
    });

    const body: any = {
        title: post.title,
        content: post.content,
        status: post.status || 'draft',
        categories: post.categories,
        tags: finalTagIds,
        featured_media: post.featuredMediaId,
        meta: meta
    };

    if (post.excerpt) {
        body.excerpt = post.excerpt;
    }

    const res = await fetch(`${config.url}/wp-json/wp/v2/posts`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    });

    // ... (error handling)
    // ...

    const createdPost = await res.json();
    return createdPost;
}

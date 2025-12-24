import { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { db, initializeDatabase } from '@/lib/db';
import { articles, settings } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import CommentsSection from './CommentsSection';
import SocialShare from './SocialShare';
import FloatingNav from './FloatingNav';
import { ArrowLeft, Calendar, User, Tag, BookOpen, Clock, LogIn, LayoutDashboard } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getArticle(slug: string) {
    initializeDatabase();
    const result = await db.select().from(articles).where(eq(articles.slug, slug));
    return result[0] || null;
}

async function getRelatedArticles(currentSlug: string) {
    initializeDatabase();
    return db.select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        metaDescription: articles.metaDescription,
    }).from(articles)
        .where((articles) => eq(articles.slug, currentSlug) ? undefined : undefined)
        .orderBy(desc(articles.publishedAt))
        .limit(4);
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const article = await getArticle(slug);

    if (!article) {
        return { title: 'Article Not Found' };
    }

    const imageUrl = article.imageUrl || `https://picsum.photos/seed/${article.id}/1200/630`;

    return {
        title: article.title,
        description: article.metaDescription || article.title,
        openGraph: {
            title: article.title,
            description: article.metaDescription || article.title,
            type: 'article',
            images: [imageUrl],
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: article.metaDescription || article.title,
            images: [imageUrl],
        },
    };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const article = await getArticle(slug);
    const session = (await cookies()).get('admin_session');
    const isLoggedIn = !!session?.value;

    if (!article) {
        notFound();
    }

    // Get social share settings
    const socialShareSetting = await db.select().from(settings).where(eq(settings.key, 'socialShare'));
    let shareConfig = { enabled: false, platforms: [] };
    if (socialShareSetting[0]?.value) {
        try { shareConfig = JSON.parse(socialShareSetting[0].value); } catch { }
    }

    // Get branding settings
    const brandingSetting = await db.select().from(settings).where(eq(settings.key, 'branding'));
    let branding = { appName: 'Article Generator', appIcon: '' };
    if (brandingSetting[0]?.value) {
        try { branding = JSON.parse(brandingSetting[0].value); } catch { }
    }

    // Parse tags
    let tags: string[] = [];
    try {
        tags = article.tags ? JSON.parse(article.tags) : [];
    } catch (e) {
        tags = [];
    }

    // Process content for TOC
    let processedContent = article.contentHtml
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ');

    const toc: { id: string; title: string; level: string }[] = [];
    processedContent = processedContent.replace(/<(h[23])>(.*?)<\/\1>/gi, (match, tag, title) => {
        const id = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        toc.push({ id, title, level: tag.toLowerCase() });
        return `<${tag} id="${id}">${title}</${tag}>`;
    });

    const imageSource = article.imageUrl || `https://picsum.photos/seed/${article.id}/1200/600`;

    // Get current article tags for matching
    let currentTags: string[] = [];
    try {
        currentTags = article.tags ? JSON.parse(article.tags) : [];
    } catch { currentTags = []; }

    // Get related articles with tags and images
    const allArticles = await db.select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        metaDescription: articles.metaDescription,
        tags: articles.tags,
        imageUrl: articles.imageUrl,
    }).from(articles).orderBy(desc(articles.publishedAt)).limit(20);

    // Filter out current article and sort by tag match score
    const relatedArticles = allArticles
        .filter(a => a.slug !== slug)
        .map(a => {
            let articleTags: string[] = [];
            try {
                articleTags = a.tags ? JSON.parse(a.tags) : [];
            } catch { articleTags = []; }

            // Calculate match score (number of shared tags)
            const matchScore = currentTags.filter(t =>
                articleTags.some(at => at.toLowerCase() === t.toLowerCase())
            ).length;

            return { ...a, matchScore };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 3);

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation - Same as Home Page */}
            <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2">
                        {branding.appIcon ? (
                            <img src={branding.appIcon} alt={branding.appName} className="w-8 h-8 rounded-lg object-contain" />
                        ) : (
                            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white">
                                <BookOpen className="w-4 h-4" />
                            </div>
                        )}
                        <span className="font-bold tracking-tight text-gray-900">{branding.appName}</span>
                    </Link>

                    {isLoggedIn ? (
                        <Link href="/admin" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors flex items-center gap-2">
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                        </Link>
                    ) : (
                        <Link href="/admin/login" className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                            <LogIn className="w-4 h-4" />
                            Login
                        </Link>
                    )}
                </div>
            </nav>

            <article className="w-full">
                {/* Header */}
                <header className="max-w-screen-md mx-auto px-4 pt-12 pb-8 text-center">
                    {article.mainKeyword && (
                        <div className="mb-4">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                                <Tag className="w-3 h-3" />
                                {article.mainKeyword}
                            </span>
                        </div>
                    )}

                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                        {article.title}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 mb-6">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Recently'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                            <User className="w-4 h-4" />
                            {article.author || 'Editorial Team'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            5 min read
                        </span>
                    </div>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap justify-center gap-2 mt-4">
                            {tags.map((tag, i) => (
                                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors">
                                    <Tag className="w-3 h-3" />
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </header>

                {/* Featured Image */}
                <div className="max-w-screen-lg mx-auto px-4 mb-12">
                    <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 shadow-sm relative group">
                        <img
                            src={imageSource}
                            alt={article.imageAlt || article.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 flex flex-col lg:flex-row gap-12">
                    {/* TOC Sidebar */}
                    {toc.length > 0 && (
                        <aside className="hidden lg:block w-64 flex-shrink-0">
                            <div className="sticky top-24">
                                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-100 pb-2 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-blue-600" />
                                    Table of Contents
                                </h4>
                                <nav className="space-y-1 relative border-l-2 border-gray-100 ml-2 pl-4">
                                    {toc.map((item) => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            className={`block text-sm py-1.5 transition-colors hover:text-blue-600 ${item.level === 'h3' ? 'pl-4 text-gray-500' : 'text-gray-700 font-medium'}`}
                                        >
                                            {item.title}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        </aside>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0 max-w-4xl mx-auto pb-20">
                        {/* Mobile TOC */}
                        {toc.length > 0 && (
                            <div className="lg:hidden mb-10 bg-gray-50 rounded-xl p-5 border border-gray-100">
                                <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                    Table of Contents
                                </h4>
                                <nav className="space-y-2">
                                    {toc.map((item) => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            className={`block text-sm ${item.level === 'h3' ? 'pl-4 text-gray-600' : 'text-gray-800 font-medium'}`}
                                        >
                                            {item.title}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        )}

                        <div
                            className="prose prose-lg prose-gray mx-auto w-full prose-headings:scroll-mt-24 prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-700 prose-img:rounded-xl prose-img:shadow-md"
                            dangerouslySetInnerHTML={{ __html: processedContent }}
                        />

                        {/* Social Share Buttons */}
                        <SocialShare config={shareConfig} title={article.title} />

                        {/* Related Articles */}
                        {relatedArticles.length > 0 && (
                            <div className="mt-16 pt-8 border-t border-gray-100">
                                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    Related Articles
                                </h3>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {relatedArticles.map((related) => (
                                        <Link
                                            key={related.id}
                                            href={`/article/${related.slug}`}
                                            className="group block bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all"
                                        >
                                            <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                                <img
                                                    src={related.imageUrl || `https://picsum.photos/seed/${related.id}/400/225`}
                                                    alt={related.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="p-4">
                                                <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 line-clamp-2 mb-2">
                                                    {related.title}
                                                </h4>
                                                <p className="text-sm text-gray-500 line-clamp-2">
                                                    {related.metaDescription || 'Read more...'}
                                                </p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Comments Section (Client Component) */}
                        <CommentsSection articleId={article.id} />
                    </div>
                </div>
            </article>

            {/* Floating Navigation - TOC (mobile) + Back to Top */}
            <FloatingNav toc={toc} />

            {/* Footer */}
            <footer className="mt-auto border-t border-gray-100 py-12 bg-gray-50">
                <div className="max-w-screen-xl mx-auto px-4 text-center text-sm text-gray-500">
                    © {new Date().getFullYear()} {branding.appName}. All rights reserved.
                </div>
            </footer>
        </div>
    );
}

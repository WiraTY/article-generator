import { cookies } from 'next/headers';
import Link from 'next/link';
import { db, initializeDatabase } from '@/lib/db';
import { articles, settings } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { ArrowRight, PenTool, LayoutDashboard, Search, Calendar, Zap, LogIn } from 'lucide-react';

// Force dynamic rendering for fresh data
export const dynamic = 'force-dynamic';

async function getArticles() {
  await initializeDatabase();
  return db.select({
    id: articles.id,
    title: articles.title,
    slug: articles.slug,
    metaDescription: articles.metaDescription,
    mainKeyword: articles.mainKeyword,
    tags: articles.tags,
    author: articles.author,
    imageUrl: articles.imageUrl,
    publishedAt: articles.publishedAt
  }).from(articles).orderBy(desc(articles.publishedAt));
}

async function getBranding() {
  await initializeDatabase();
  const result = await db.select().from(settings).where(eq(settings.key, 'branding'));
  if (result[0]?.value) {
    try { return JSON.parse(result[0].value); } catch { }
  }
  return { appName: 'Article Generator', appIcon: '' };
}

export default async function HomePage() {
  const articlesList = await getArticles();
  const branding = await getBranding();
  const session = (await cookies()).get('admin_session');
  const isLoggedIn = !!session?.value;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {branding.appIcon ? (
              <img src={branding.appIcon} alt={branding.appName} className="w-8 h-8 rounded-lg object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white">
                <PenTool className="w-4 h-4" />
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

      {/* Hero Section */}
      <header className="py-20 bg-gray-50 border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium mb-6">
            <Zap className="w-3 h-3" />
            <span>AI-Powered Content Engine</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight leading-tight">
            Smart Content for <br className="hidden md:block" /> Modern SEO
          </h1>
          <p className="text-xl text-gray-500 mb-8 max-w-2xl mx-auto leading-relaxed">
            Discover high-quality, SEO-optimized articles generated effortlessly by artificial intelligence.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
            <span>{articlesList.length} Articles Published</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-screen-xl mx-auto px-4 py-12">
        {articlesList.length === 0 ? (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Articles Yet</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">
              Your blog is currently empty. Head over to the admin dashboard to generate your first article.
            </p>
            <Link href="/admin" className="btn-primary">
              Go to Admin
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <>
            {/* Latest Articles Section */}
            <section className="mb-16">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-blue-600" />
                  Latest Articles
                </h2>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {articlesList.slice(0, 4).map((article) => {
                  const imageSource = article.imageUrl || `https://picsum.photos/seed/${article.id}/800/400`;
                  return (
                    <Link
                      key={article.id}
                      href={`/article/${article.slug}`}
                      className="group flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="aspect-video bg-gray-100 relative overflow-hidden">
                        <img
                          src={imageSource}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 font-medium">
                          <Calendar className="w-3 h-3" />
                          {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric'
                          }) : 'Recently'}
                        </div>
                        <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                          {article.title}
                        </h3>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            {/* Topic-Grouped Sections */}
            {(() => {
              // Category mapping - group keywords into general categories
              const GENERAL_CATEGORIES: Record<string, string[]> = {
                'Tips & Panduan': ['tips', 'cara', 'panduan', 'tutorial', 'langkah', 'strategi', 'metode', 'guide', 'how to'],
                'Program & Kelas': ['program', 'kelas', 'kursus', 'course', 'training', 'belajar', 'les', 'pelatihan', 'camp', 'holiday', 'bootcamp'],
                'Biaya & Harga': ['biaya', 'harga', 'tarif', 'price', 'cost', 'paket', 'budget', 'murah', 'diskon', 'promo'],
                'Wisata & Lifestyle': ['wisata', 'liburan', 'travel', 'jalan-jalan', 'kuliner', 'tempat', 'destinasi', 'itinerary', 'rekomendasi'],
                'Review & Info': ['review', 'ulasan', 'pengalaman', 'cerita', 'info', 'sejarah', 'tentang', 'profil', 'terbaik', 'terbaru'],
              };

              // Function to determine category from keyword/title
              const getCategory = (text: string): string => {
                const lowerText = (text || '').toLowerCase();
                for (const [category, keywords] of Object.entries(GENERAL_CATEGORIES)) {
                  if (keywords.some(kw => lowerText.includes(kw))) {
                    return category;
                  }
                }
                return 'Artikel Lainnya';
              };

              // Group articles by general category
              const categoryGroups: Record<string, typeof articlesList> = {};
              articlesList.slice(4).forEach(article => {
                const category = getCategory(article.mainKeyword || article.title);
                if (!categoryGroups[category]) categoryGroups[category] = [];
                categoryGroups[category].push(article);
              });

              // Sort categories by article count (most first)
              const categoryEntries = Object.entries(categoryGroups)
                .filter(([_, arts]) => arts.length >= 1)
                .sort((a, b) => b[1].length - a[1].length);

              return categoryEntries.map(([category, categoryArticles]) => (
                <section key={category} className="mb-12">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
                    <h2 className="text-xl font-bold text-gray-900">{category}</h2>
                    <span className="text-sm text-gray-400">({categoryArticles.length} artikel)</span>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {categoryArticles.slice(0, 6).map((article) => {
                      const imageSource = article.imageUrl || `https://picsum.photos/seed/${article.id}/800/400`;
                      return (
                        <Link
                          key={article.id}
                          href={`/article/${article.slug}`}
                          className="group flex flex-col bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300"
                        >
                          <div className="aspect-video bg-gray-100 relative overflow-hidden">
                            <img
                              src={imageSource}
                              alt={article.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                          <div className="p-5 flex-1 flex flex-col">
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2 font-medium">
                              <Calendar className="w-3 h-3" />
                              {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'short', day: 'numeric'
                              }) : 'Recently'}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                              {article.title}
                            </h3>
                            <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed mb-4 flex-1">
                              {article.metaDescription || 'Click to read this article...'}
                            </p>
                            <div className="flex items-center text-sm font-medium text-blue-600">
                              Read Article
                              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              ));
            })()}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {branding.appIcon ? (
              <img src={branding.appIcon} alt={branding.appName} className="w-6 h-6 rounded object-contain" />
            ) : (
              <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center text-white">
                <PenTool className="w-3 h-3" />
              </div>
            )}
            <span className="font-bold text-gray-900">{branding.appName}</span>
          </div>
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

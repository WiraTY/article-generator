'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Search, Clock, Settings, ExternalLink, TrendingUp, MessageSquare } from 'lucide-react';

interface Stats {
    totalArticles: number;
    totalKeywords: number;
    pendingKeywords: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/dashboard/stats');
                const data = await res.json();
                setStats(data);
            } catch (e) {
                console.error('Failed to fetch stats');
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full spinner"></div>
            </div>
        );
    }

    if (!stats) return <div>Failed to load stats</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Overview of your blog performance</p>
            </div>

            {/* Main Stats Cards */}
            <div className="grid gap-6 md:grid-cols-4">
                <div className="card p-6 border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Articles</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalArticles}</p>
                        </div>
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="card p-6 border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Views</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalViews.toLocaleString()}</p>
                        </div>
                        <div className="bg-green-100 p-2 rounded-lg text-green-600">
                            <ExternalLink className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="card p-6 border-l-4 border-l-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Comments</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalComments}</p>
                        </div>
                        <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="card p-6 border-l-4 border-l-amber-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pending Keywords</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.pendingKeywords}</p>
                        </div>
                        <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                            <Search className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
                {/* Top Viewed Articles */}
                <div className="card overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Most Viewed Articles
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {stats.topViewedArticles.map((article: any, i: number) => (
                            <div key={article.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                <span className="font-bold text-gray-300 text-lg w-6">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <Link href={`/article/${article.slug}`} className="font-medium text-gray-900 hover:text-blue-600 truncate block">
                                        {article.title}
                                    </Link>
                                    <p className="text-xs text-gray-500 mt-1">Published by {article.author} • {new Date(article.publishedAt).toLocaleDateString()}</p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {article.views.toLocaleString()} views
                                    </span>
                                </div>
                            </div>
                        ))}
                        {stats.topViewedArticles.length === 0 && (
                            <div className="p-6 text-center text-gray-500">No data available</div>
                        )}
                    </div>
                </div>

                {/* Most Engaged Articles */}
                <div className="card overflow-hidden">
                    <div className="p-6 border-b border-gray-100 bg-gray-50">
                        <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                            <MessageSquare className="w-5 h-5 text-purple-600" />
                            Highest Engagement
                        </h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {stats.mostEngagedArticles.map((article: any, i: number) => (
                            <div key={article.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                                <span className="font-bold text-gray-300 text-lg w-6">{i + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <Link href={`/article/${article.slug}`} className="font-medium text-gray-900 hover:text-blue-600 truncate block">
                                        {article.title}
                                    </Link>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {article.commentCount} comments
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                        {article.commentCount} comments
                                    </span>
                                </div>
                            </div>
                        ))}
                        {stats.mostEngagedArticles.length === 0 && (
                            <div className="p-6 text-center text-gray-500">No comments yet</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="card overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-gray-600" />
                        Recent Comments
                    </h2>
                </div>
                <div className="divide-y divide-gray-100">
                    {stats.recentActivity.map((comment: any) => (
                        <div key={comment.id} className="p-4">
                            <div className="flex justify-between">
                                <p className="text-sm font-medium text-gray-900">{comment.author}</p>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">"{comment.content}"</p>
                            <p className="text-xs text-gray-500 mt-2">on <span className="font-medium text-gray-700">{comment.articleTitle}</span></p>
                        </div>
                    ))}
                    {stats.recentActivity.length === 0 && (
                        <div className="p-6 text-center text-gray-500">No recent activity</div>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap gap-4">
                <Link href="/admin/keywords" className="btn-secondary">
                    <Search className="w-4 h-4 mr-2" />
                    Research Keywords
                </Link>
                <Link href="/admin/content" className="btn-secondary">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Articles
                </Link>
                <Link href="/admin/settings" className="btn-secondary">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                </Link>
                <Link href="/" className="btn-secondary" target="_blank">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View Live Blog
                </Link>
            </div>
        </div>
    );
}

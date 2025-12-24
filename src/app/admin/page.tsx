'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Search, Clock, Settings, ExternalLink } from 'lucide-react';

interface Stats {
    totalArticles: number;
    totalKeywords: number;
    pendingKeywords: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats>({ totalArticles: 0, totalKeywords: 0, pendingKeywords: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const [articlesRes, keywordsRes] = await Promise.all([
                    fetch('/api/articles'),
                    fetch('/api/keywords')
                ]);
                const articles = await articlesRes.json();
                const keywords = await keywordsRes.json();

                setStats({
                    totalArticles: articles.length,
                    totalKeywords: keywords.length,
                    pendingKeywords: keywords.filter((k: any) => k.status === 'new').length
                });
            } catch (e) {
                console.error('Failed to fetch stats');
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Welcome to your Article Generator admin panel</p>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full spinner"></div>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="card p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalArticles}</p>
                                <p className="text-sm text-gray-500">Total Articles</p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                                <Search className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.totalKeywords}</p>
                                <p className="text-sm text-gray-500">Total Keywords</p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">{stats.pendingKeywords}</p>
                                <p className="text-sm text-gray-500">Pending Keywords</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Link href="/admin/keywords" className="btn-secondary justify-start">
                        <Search className="w-4 h-4 mr-2" />
                        Research Keywords
                    </Link>
                    <Link href="/admin/content" className="btn-secondary justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Generate Articles
                    </Link>
                    <Link href="/admin/settings" className="btn-secondary justify-start">
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                    </Link>
                    <Link href="/" className="btn-secondary justify-start">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Blog
                    </Link>
                </div>
            </div>
        </div>
    );
}

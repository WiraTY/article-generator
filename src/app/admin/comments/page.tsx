'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare, Check, X, Trash2, Filter, ExternalLink, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Comment {
    id: number;
    articleId: number;
    name: string;
    comment: string;
    status: string;
    createdAt: string;
    articleTitle: string | null;
    articleSlug: string | null;
}

export default function CommentsPage() {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('pending');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [filter]);

    async function fetchComments() {
        setLoading(true);
        try {
            const res = await fetch(`/api/comments?admin=true&status=${filter}`);
            if (res.ok) {
                const data = await res.json();
                setComments(data);
            }
        } catch (e) {
            console.error('Failed to fetch comments');
        } finally {
            setLoading(false);
        }
    }

    async function updateStatus(ids: number[], status: string) {
        setUpdating(true);
        try {
            await fetch('/api/comments', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids, status })
            });
            fetchComments();
            setSelectedIds([]);
        } catch (e) {
            alert('Failed to update comments');
        } finally {
            setUpdating(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('Are you sure you want to delete this comment?')) return;
        try {
            await fetch(`/api/comments?id=${id}`, { method: 'DELETE' });
            fetchComments();
        } catch (e) {
            alert('Failed to delete comment');
        }
    }

    function toggleSelect(id: number) {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }

    function toggleSelectAll() {
        if (selectedIds.length === comments.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(comments.map(c => c.id));
        }
    }

    const statusIcon = (status: string) => {
        switch (status) {
            case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
            default: return null;
        }
    };

    const statusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: 'bg-yellow-100 text-yellow-700',
            approved: 'bg-green-100 text-green-700',
            rejected: 'bg-red-100 text-red-700'
        };
        return styles[status] || 'bg-gray-100 text-gray-700';
    };

    const pendingCount = filter === 'pending' ? comments.length : 0;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        <MessageSquare className="w-7 h-7" />
                        Comment Moderation
                    </h1>
                    <p className="text-gray-500 mt-1">Review and moderate user comments</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    {['pending', 'approved', 'rejected', 'all'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilter(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${filter === tab
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <span className="text-sm text-blue-700 font-medium">
                        {selectedIds.length} selected
                    </span>
                    <button
                        onClick={() => updateStatus(selectedIds, 'approved')}
                        disabled={updating}
                        className="btn-primary text-sm py-1.5"
                    >
                        {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        Approve
                    </button>
                    <button
                        onClick={() => updateStatus(selectedIds, 'rejected')}
                        disabled={updating}
                        className="btn-danger text-sm py-1.5"
                    >
                        <X className="w-4 h-4" />
                        Reject
                    </button>
                    <button
                        onClick={() => setSelectedIds([])}
                        className="btn-secondary text-sm py-1.5"
                    >
                        Clear
                    </button>
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading comments...</div>
            ) : comments.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No {filter !== 'all' ? filter : ''} comments found</p>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    {/* Select All Header */}
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center gap-4">
                        <input
                            type="checkbox"
                            checked={selectedIds.length === comments.length && comments.length > 0}
                            onChange={toggleSelectAll}
                            className="w-4 h-4 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-600">
                            {comments.length} comment{comments.length !== 1 ? 's' : ''}
                        </span>
                    </div>

                    {/* Comments List */}
                    <div className="divide-y divide-gray-100">
                        {comments.map((c) => (
                            <div key={c.id} className={`px-6 py-4 flex gap-4 ${selectedIds.includes(c.id) ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedIds.includes(c.id)}
                                    onChange={() => toggleSelect(c.id)}
                                    className="w-4 h-4 mt-1 rounded border-gray-300"
                                />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(c.status)}`}>
                                            {statusIcon(c.status)}
                                            {c.status}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">{c.name}</span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(c.createdAt).toLocaleString()}
                                        </span>
                                    </div>

                                    <p className="text-gray-700 mb-2">{c.comment}</p>

                                    {c.articleTitle && (
                                        <Link
                                            href={`/article/${c.articleSlug}`}
                                            target="_blank"
                                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                                        >
                                            <ExternalLink className="w-3 h-3" />
                                            {c.articleTitle}
                                        </Link>
                                    )}
                                </div>

                                <div className="flex items-start gap-1">
                                    {c.status !== 'approved' && (
                                        <button
                                            onClick={() => updateStatus([c.id], 'approved')}
                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                                            title="Approve"
                                        >
                                            <Check className="w-4 h-4" />
                                        </button>
                                    )}
                                    {c.status !== 'rejected' && (
                                        <button
                                            onClick={() => updateStatus([c.id], 'rejected')}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                            title="Reject"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

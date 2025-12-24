'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Send, Loader2, Clock, CheckCircle } from 'lucide-react';

interface Comment {
    id: number;
    name: string;
    comment: string;
    status?: string; // pending, approved, rejected
    createdAt: string;
}

export default function CommentsSection({ articleId }: { articleId: number }) {
    const [comments, setComments] = useState<Comment[]>([]);
    const [localPendingComments, setLocalPendingComments] = useState<Comment[]>([]);
    const [form, setForm] = useState({ name: '', comment: '' });
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ text: string, type: 'success' | 'info' } | null>(null);

    useEffect(() => {
        fetchComments();
    }, [articleId]);

    async function fetchComments() {
        try {
            const res = await fetch(`/api/comments?articleId=${articleId}`);
            const data = await res.json();
            setComments(data);
        } catch (e) {
            console.error('Failed to fetch comments');
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim() || !form.comment.trim()) return;

        setSubmitting(true);
        setMessage(null);

        try {
            const res = await fetch('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    articleId,
                    name: form.name,
                    comment: form.comment,
                }),
            });

            const newComment = await res.json();

            if (res.ok) {
                setForm({ name: '', comment: '' });

                if (newComment.status === 'pending') {
                    // Show message and add to local pending list
                    setMessage({
                        text: 'Comment submitted! It will appear after admin approval.',
                        type: 'info'
                    });
                    setLocalPendingComments(prev => [newComment, ...prev]);
                } else {
                    // Comment approved immediately
                    setMessage({
                        text: 'Comment posted successfully!',
                        type: 'success'
                    });
                    fetchComments();
                }
            }
        } catch (e) {
            console.error('Failed to submit comment');
        } finally {
            setSubmitting(false);
        }
    }

    // Combine local pending comments with fetched (approved) comments
    // Filter out simple duplicates if fetchComments catches up (though unlikely for pending)
    const displayComments = [
        ...localPendingComments,
        ...comments
    ].filter((comment, index, self) =>
        index === self.findIndex((c) => c.id === comment.id)
    );

    return (
        <div className="mt-16 pt-8 border-t border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                Comments ({comments.length})
            </h3>

            {/* Success/Info Message */}
            {message && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                    {message.text}
                </div>
            )}

            {/* Comment Form */}
            <form onSubmit={handleSubmit} className="mb-8 bg-gray-50 rounded-xl p-5 border border-gray-100">
                <div className="grid gap-4 sm:grid-cols-2 mb-4">
                    <input
                        type="text"
                        placeholder="Your Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className="input"
                        required
                    />
                    <div className="hidden sm:block"></div>
                </div>
                <textarea
                    placeholder="Write your comment..."
                    value={form.comment}
                    onChange={(e) => setForm({ ...form, comment: e.target.value })}
                    rows={3}
                    className="input mb-4"
                    required
                />
                <button type="submit" disabled={submitting} className="btn-primary flex items-center gap-2">
                    {submitting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            <Send className="w-4 h-4" />
                            Post Comment
                        </>
                    )}
                </button>
            </form>

            {/* Comments List */}
            {displayComments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                    No comments yet. Be the first to comment!
                </p>
            ) : (
                <div className="space-y-4">
                    {displayComments.map((c) => (
                        <div key={c.id} className={`border rounded-xl p-4 transition-all ${c.status === 'pending'
                                ? 'bg-yellow-50/50 border-yellow-200'
                                : 'bg-white border-gray-100'
                            }`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${c.status === 'pending' ? 'bg-yellow-400' : 'bg-gradient-to-br from-blue-500 to-purple-600'
                                        }`}>
                                        {c.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                                            {c.status === 'pending' && (
                                                <span className="text-[10px] uppercase tracking-wider font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded">
                                                    Pending
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            {new Date(c.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <p className={`text-sm pl-11 ${c.status === 'pending' ? 'text-gray-600 italic' : 'text-gray-700'}`}>
                                {c.comment}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

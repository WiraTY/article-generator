'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FileText, Clock, Sparkles, Loader2, Edit, Trash2, Save, Eye, Target, X, Upload, RefreshCw, Undo2 } from 'lucide-react';

// Dynamic import for rich text editor (client-side only)
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

interface Keyword {
    id: number;
    term: string;
    intent: string;
    status: string;
}

interface Article {
    id: number;
    title: string;
    slug: string;
    metaDescription: string;
    contentHtml: string;
    previousContentHtml?: string;
    mainKeyword: string;
    tags: string;
    imageUrl: string;
    imageAlt: string;
    publishedAt: string;
}

const quillModules = {
    toolbar: [
        [{ 'header': [2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered' }, { 'list': 'bullet' }],
        ['link'],
    ]
};

export default function ContentManagerPage() {
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [articles, setArticles] = useState<Article[]>([]);
    const [generating, setGenerating] = useState<number | null>(null);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [editForm, setEditForm] = useState({
        title: '', metaDescription: '', contentHtml: '', imageUrl: '', imageAlt: '', mainKeyword: '', tags: ''
    });
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [customPrompts, setCustomPrompts] = useState<Record<number, string>>({});
    const [regeneratingSlug, setRegeneratingSlug] = useState<string | null>(null);
    const [regenerateModal, setRegenerateModal] = useState<{ slug: string; keyword: string } | null>(null);
    const [regeneratePrompt, setRegeneratePrompt] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const [kwRes, artRes] = await Promise.all([
                fetch('/api/keywords'),
                fetch('/api/articles')
            ]);
            setKeywords(await kwRes.json());
            setArticles(await artRes.json());
        } catch (e) {
            console.error('Failed to fetch data');
        }
    }

    async function handleGenerate(kw: Keyword) {
        setGenerating(kw.id);
        try {
            const res = await fetch('/api/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keywordId: kw.id,
                    keyword: kw.term,
                    intent: kw.intent,
                    customPrompt: customPrompts[kw.id] || ''
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            fetchData();
        } catch (e: any) {
            alert('Failed to generate: ' + e.message);
        } finally {
            setGenerating(null);
        }
    }

    async function openEditor(slug: string) {
        try {
            const res = await fetch(`/api/articles/${slug}`);
            const article = await res.json();
            setEditingArticle(article);

            let tagsStr = '';
            try {
                const parsed = JSON.parse(article.tags || '[]');
                tagsStr = Array.isArray(parsed) ? parsed.join(', ') : '';
            } catch { tagsStr = ''; }

            setEditForm({
                title: article.title || '',
                metaDescription: article.metaDescription || '',
                contentHtml: article.contentHtml || '',
                imageUrl: article.imageUrl || '',
                imageAlt: article.imageAlt || '',
                mainKeyword: article.mainKeyword || '',
                tags: tagsStr
            });
        } catch (e) {
            alert('Failed to load article');
        }
    }

    async function handleSave() {
        if (!editingArticle) return;
        setSaving(true);
        try {
            await fetch(`/api/articles/${editingArticle.slug}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            setEditingArticle(null);
            fetchData();
        } catch (e) {
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(slug: string) {
        if (!confirm('Delete this article permanently?')) return;
        try {
            await fetch(`/api/articles/${slug}`, { method: 'DELETE' });
            fetchData();
        } catch (e) {
            alert('Failed to delete');
        }
    }

    async function handleRegenerate() {
        if (!regenerateModal) return;
        setRegeneratingSlug(regenerateModal.slug);
        try {
            const res = await fetch(`/api/articles/${regenerateModal.slug}/regenerate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customPrompt: regeneratePrompt })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            await fetchData();
            setRegenerateModal(null);
            setRegeneratePrompt('');
            alert('Article regenerated! You can undo this from the article actions.');
        } catch (e: any) {
            alert('Failed to regenerate: ' + e.message);
        } finally {
            setRegeneratingSlug(null);
        }
    }

    async function handleUndo(slug: string) {
        if (!confirm('Restore previous version of this article?')) return;
        try {
            const res = await fetch(`/api/articles/${slug}/undo`, { method: 'POST' });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            await fetchData();
            alert('Previous version restored!');
        } catch (e: any) {
            alert('Failed to undo: ' + e.message);
        }
    }

    const pendingKeywords = keywords.filter(k => k.status === 'new');

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Content Manager
                </h1>
                <p className="text-gray-500 mt-1">Generate and manage your articles</p>
            </div>

            {/* Pending Keywords */}
            {pendingKeywords.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50 to-yellow-50 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <div>
                            <h3 className="font-semibold text-gray-900">Pending Keywords ({pendingKeywords.length})</h3>
                            <p className="text-sm text-gray-500">Generate articles from these keywords</p>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {pendingKeywords.map((kw) => (
                            <div key={kw.id} className="p-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium text-gray-900">{kw.term}</span>
                                        <span className={`badge ${kw.intent === 'transactional' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {kw.intent}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleGenerate(kw)}
                                        disabled={generating !== null}
                                        className="btn-primary text-sm flex items-center gap-1.5"
                                    >
                                        {generating === kw.id ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                Generate
                                            </>
                                        )}
                                    </button>
                                </div>
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Custom instructions for AI (optional)"
                                        value={customPrompts[kw.id] || ''}
                                        onChange={(e) => setCustomPrompts({ ...customPrompts, [kw.id]: e.target.value })}
                                        className="input text-sm"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Published Articles */}
            <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Published Articles ({articles.length})</h3>
                </div>
                {articles.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500 flex flex-col items-center">
                        <FileText className="w-12 h-12 mb-4 text-gray-300" />
                        <p>No articles yet. Generate one from pending keywords!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {articles.map((article) => (
                            <div key={article.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 group">
                                <div className="flex-1 min-w-0">
                                    <Link href={`/article/${article.slug}`} target="_blank" className="font-medium text-gray-900 hover:text-blue-600 block truncate">
                                        {article.title}
                                    </Link>
                                    <p className="text-sm text-gray-500 truncate">{article.metaDescription}</p>
                                    {article.mainKeyword && (
                                        <span className="text-xs text-blue-600 flex items-center gap-1 mt-1">
                                            <Target className="w-3 h-3" />
                                            {article.mainKeyword}
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 ml-4">
                                    <Link
                                        href={`/article/${article.slug}`}
                                        target="_blank"
                                        className="btn-secondary text-sm flex items-center gap-1.5"
                                    >
                                        <Eye className="w-4 h-4" />
                                        Preview
                                    </Link>
                                    <button onClick={() => openEditor(article.slug)} className="btn-secondary text-sm flex items-center gap-1.5">
                                        <Edit className="w-4 h-4" />
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => setRegenerateModal({ slug: article.slug, keyword: article.mainKeyword || article.title })}
                                        className="btn-secondary text-sm flex items-center gap-1.5"
                                        disabled={regeneratingSlug === article.slug}
                                    >
                                        {regeneratingSlug === article.slug ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <RefreshCw className="w-4 h-4" />
                                        )}
                                        Regenerate
                                    </button>
                                    {article.previousContentHtml && (
                                        <button
                                            onClick={() => handleUndo(article.slug)}
                                            className="btn-secondary text-sm flex items-center gap-1.5 text-amber-600 hover:bg-amber-50"
                                            title="Restore previous version"
                                        >
                                            <Undo2 className="w-4 h-4" />
                                            Undo
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(article.slug)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete article"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingArticle && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <Edit className="w-5 h-5 text-gray-500" />
                                Edit Article
                            </h3>
                            <button onClick={() => setEditingArticle(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto p-6 space-y-4">
                            <div>
                                <label className="label">Title</label>
                                <input
                                    type="text"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="input"
                                />
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="label">Main Keyword</label>
                                    <input
                                        type="text"
                                        value={editForm.mainKeyword}
                                        onChange={(e) => setEditForm({ ...editForm, mainKeyword: e.target.value })}
                                        className="input"
                                    />
                                </div>
                                <div>
                                    <label className="label">Tags (comma separated)</label>
                                    <input
                                        type="text"
                                        value={editForm.tags}
                                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                                        className="input"
                                        placeholder="tag1, tag2, tag3"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="label">Featured Image</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={editForm.imageUrl}
                                            onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })}
                                            className="input flex-1"
                                            placeholder="https://... or upload"
                                        />
                                        <label className="btn-secondary flex items-center gap-2 cursor-pointer">
                                            {uploading ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Upload className="w-4 h-4" />
                                            )}
                                            <span className="hidden sm:inline">{uploading ? 'Uploading...' : 'Upload'}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={uploading}
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (!file) return;

                                                    setUploading(true);
                                                    try {
                                                        const formData = new FormData();
                                                        formData.append('image', file);

                                                        const res = await fetch('/api/upload', {
                                                            method: 'POST',
                                                            body: formData
                                                        });

                                                        if (!res.ok) {
                                                            const errorData = await res.json();
                                                            throw new Error(errorData.error || 'Upload failed');
                                                        }

                                                        const data = await res.json();
                                                        setEditForm({
                                                            ...editForm,
                                                            imageUrl: data.url,
                                                            imageAlt: editForm.imageAlt || `Ilustrasi ${editForm.title}`
                                                        });
                                                    } catch (err: any) {
                                                        alert('Failed to upload: ' + err.message);
                                                    } finally {
                                                        setUploading(false);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    {editForm.imageUrl && (
                                        <div className="mt-2 relative rounded-lg overflow-hidden h-32 bg-gray-100">
                                            <img
                                                src={editForm.imageUrl}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f3f4f6" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-size="12">No Image</text></svg>';
                                                }}
                                            />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="label">Image Alt Text</label>
                                    <input
                                        type="text"
                                        value={editForm.imageAlt}
                                        onChange={(e) => setEditForm({ ...editForm, imageAlt: e.target.value })}
                                        className="input"
                                        placeholder="Describe the image..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="label">Meta Description</label>
                                <input
                                    type="text"
                                    value={editForm.metaDescription}
                                    onChange={(e) => setEditForm({ ...editForm, metaDescription: e.target.value })}
                                    className="input"
                                    maxLength={160}
                                />
                                <p className="text-xs text-gray-500 mt-1">{editForm.metaDescription.length}/160</p>
                            </div>
                            <div>
                                <label className="label">Content</label>
                                <ReactQuill
                                    value={editForm.contentHtml}
                                    onChange={(value) => setEditForm({ ...editForm, contentHtml: value })}
                                    modules={quillModules}
                                    theme="snow"
                                    className="bg-white rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => setEditingArticle(null)} className="btn-secondary">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                                {saving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Regenerate Modal */}
            {regenerateModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                <RefreshCw className="w-5 h-5 text-blue-600" />
                                Regenerate Article
                            </h3>
                            <button onClick={() => { setRegenerateModal(null); setRegeneratePrompt(''); }} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <p className="text-sm text-gray-600 mb-2">
                                    Regenerating article for keyword: <strong className="text-gray-900">{regenerateModal.keyword}</strong>
                                </p>
                                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                                    ⚠️ This will replace current content. You can undo this action once.
                                </p>
                            </div>
                            <div>
                                <label className="label">Custom Instructions (optional)</label>
                                <textarea
                                    value={regeneratePrompt}
                                    onChange={(e) => setRegeneratePrompt(e.target.value)}
                                    rows={4}
                                    className="input"
                                    placeholder="Give specific instructions for the AI, e.g.:
- Make it more engaging for Gen Z
- Focus more on pricing benefits
- Add more practical examples
- Write in a storytelling style"
                                />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                            <button onClick={() => { setRegenerateModal(null); setRegeneratePrompt(''); }} className="btn-secondary">
                                Cancel
                            </button>
                            <button
                                onClick={handleRegenerate}
                                disabled={regeneratingSlug !== null}
                                className="btn-primary flex items-center gap-2"
                            >
                                {regeneratingSlug !== null ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Regenerating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4" />
                                        Regenerate Now
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { FileText, Clock, Sparkles, Loader2, Edit, Trash2, Save, Eye, Target, X, Upload, RefreshCw, Undo2, CheckCircle, Plus, List } from 'lucide-react';
import SeoScorePanel from '@/components/SeoScorePanel';
import { useJobs } from '@/components/JobNotificationProvider';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/ToastProvider';
import ImageUploader from '@/components/ImageUploader';

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
    const [useCustomOnly, setUseCustomOnly] = useState(false);
    const [undoingSlug, setUndoingSlug] = useState<string | null>(null);
    const [undoNotification, setUndoNotification] = useState<{ show: boolean; success: boolean; message: string }>({ show: false, success: false, message: '' });
    const { addJob, activeJobs } = useJobs();
    const { showToast } = useToast();

    // Modal states
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'warning' | 'info';
        confirmText?: string;
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
    });

    // Tab and manual input states
    const [activeTab, setActiveTab] = useState<'keywords' | 'articles'>('keywords');
    const [manualKeyword, setManualKeyword] = useState('');
    const [manualIntent, setManualIntent] = useState<'informational' | 'transactional'>('informational');
    const [manualPrompt, setManualPrompt] = useState('');
    const [manualGenerating, setManualGenerating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    // Auto-refresh when a job completes
    useEffect(() => {
        const completedJobs = activeJobs.filter(j => j.status === 'completed');
        if (completedJobs.length > 0) {
            fetchData();
        }
    }, [activeJobs]);

    async function fetchData() {
        setLoading(true);
        try {
            const [kwRes, artRes] = await Promise.all([
                fetch('/api/keywords'),
                fetch('/api/articles')
            ]);
            setKeywords(await kwRes.json());
            setArticles(await artRes.json());
        } catch (e) {
            console.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    }

    async function handleGenerate(kw: Keyword) {
        setGenerating(kw.id);
        try {
            // Create a background job instead of waiting for completion
            const res = await fetch('/api/jobs', {
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
            const job = await res.json();

            // Add to notification system
            addJob(job.id, kw.term);

            // Update keyword status locally to avoid confusion
            setKeywords(prev => prev.filter(k => k.id !== kw.id));

        } catch (e: any) {
            showToast('Failed to start generation: ' + e.message, 'error');
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
            showToast('Failed to load article', 'error');
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
            showToast('Article saved successfully!', 'success');
        } catch (e) {
            showToast('Failed to save', 'error');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(slug: string) {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Article',
            message: 'Are you sure you want to delete this article permanently? This action cannot be undone.',
            variant: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await fetch(`/api/articles/${slug}`, { method: 'DELETE' });
                    fetchData();
                    showToast('Article deleted successfully', 'success');
                } catch (e) {
                    showToast('Failed to delete', 'error');
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    }

    async function handleRegenerate() {
        if (!regenerateModal) return;
        setRegeneratingSlug(regenerateModal.slug);
        try {
            // Create a background regenerate job
            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jobType: 'regenerate',
                    keyword: regenerateModal.keyword,
                    intent: 'informational', // Default for regenerate
                    customPrompt: regeneratePrompt,
                    articleSlug: regenerateModal.slug,
                    useCustomOnly: useCustomOnly
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            const job = await res.json();

            // Add to notification system
            addJob(job.id, regenerateModal.keyword, 'regenerate');

            setRegenerateModal(null);
            setRegeneratePrompt('');
            setUseCustomOnly(false);
            setUseCustomOnly(false);
            showToast('Regeneration job started!', 'success');
        } catch (e: any) {
            showToast('Failed to start regeneration: ' + e.message, 'error');
        } finally {
            setRegeneratingSlug(null);
        }
    }

    async function handleUndo(slug: string) {
        setConfirmModal({
            isOpen: true,
            title: 'Restore Version',
            message: 'Are you sure you want to restore the previous version of this article?',
            variant: 'warning',
            confirmText: 'Restore',
            onConfirm: async () => {
                setUndoingSlug(slug);
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                setUndoNotification({ show: true, success: false, message: 'Memulihkan versi sebelumnya...' });
                try {
                    const res = await fetch(`/api/articles/${slug}/undo`, { method: 'POST' });
                    if (!res.ok) {
                        const err = await res.json();
                        throw new Error(err.error);
                    }
                    await fetchData();
                    setUndoNotification({ show: true, success: true, message: 'Berhasil dikembalikan ke versi sebelumnya!' });
                    setTimeout(() => setUndoNotification({ show: false, success: false, message: '' }), 3000);
                } catch (e: any) {
                    setUndoNotification({ show: true, success: false, message: 'Gagal: ' + e.message });
                    setTimeout(() => setUndoNotification({ show: false, success: false, message: '' }), 5000);
                } finally {
                    setUndoingSlug(null);
                }
            }
        });
    }

    const pendingKeywords = keywords.filter(k => k.status === 'new');

    // Handle manual keyword article generation
    async function handleManualGenerate() {
        if (!manualKeyword.trim()) return;
        setManualGenerating(true);
        try {
            const res = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keyword: manualKeyword.trim(),
                    intent: manualIntent,
                    customPrompt: manualPrompt || undefined
                })
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }
            const job = await res.json();
            addJob(job.id, manualKeyword.trim(), 'generate');
            setManualKeyword('');
            setManualPrompt('');
            setActiveTab('articles'); // Switch to articles tab
            showToast('Generation job started!', 'success');
        } catch (e: any) {
            showToast('Failed to start generation: ' + e.message, 'error');
        } finally {
            setManualGenerating(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Content Manager
                </h1>
                <p className="text-gray-500 mt-1">Generate and manage your articles</p>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                    <p className="text-gray-500">Loading data...</p>
                </div>
            ) : (
                <>

                    {/* Tab Navigation */}
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('keywords')}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'keywords'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <List className="w-4 h-4" />
                            Keywords ({pendingKeywords.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('articles')}
                            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${activeTab === 'articles'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <FileText className="w-4 h-4" />
                            Articles ({articles.length})
                        </button>
                    </div>

                    {/* Keywords Tab */}
                    {activeTab === 'keywords' && (
                        <>
                            {/* Manual Keyword Input */}
                            <div className="card p-6">
                                <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Plus className="w-5 h-5 text-blue-600" />
                                    Generate from Manual Keyword
                                </h3>
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={manualKeyword}
                                            onChange={(e) => setManualKeyword(e.target.value)}
                                            placeholder="Enter keyword (e.g. 'tips liburan hemat')"
                                            className="input w-full"
                                            disabled={manualGenerating}
                                        />
                                        <select
                                            value={manualIntent}
                                            onChange={(e) => setManualIntent(e.target.value as any)}
                                            className="input w-full md:w-48"
                                            disabled={manualGenerating}
                                        >
                                            <option value="informational">Informational</option>
                                            <option value="transactional">Transactional</option>
                                        </select>
                                    </div>
                                    <textarea
                                        value={manualPrompt}
                                        onChange={(e) => setManualPrompt(e.target.value)}
                                        placeholder="Custom prompt (optional) - e.g. 'Focus on budget tips for millennials'"
                                        className="input w-full h-20 text-sm"
                                        disabled={manualGenerating}
                                    />
                                    <button
                                        onClick={handleManualGenerate}
                                        disabled={!manualKeyword.trim() || manualGenerating}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        {manualGenerating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Starting...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4" />
                                                Generate Article
                                            </>
                                        )}
                                    </button>
                                </div>
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
                        </>
                    )}

                    {/* Articles Tab */}
                    {activeTab === 'articles' && (
                        <>
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
                                                <div className="flex items-center gap-1.5 ml-4">
                                                    <Link
                                                        href={`/article/${article.slug}`}
                                                        target="_blank"
                                                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Preview"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => openEditor(article.slug)}
                                                        className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setRegenerateModal({ slug: article.slug, keyword: article.mainKeyword || article.title })}
                                                        className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                        disabled={regeneratingSlug === article.slug}
                                                        title="Regenerate"
                                                    >
                                                        {regeneratingSlug === article.slug ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                    {article.previousContentHtml && (
                                                        <button
                                                            onClick={() => handleUndo(article.slug)}
                                                            disabled={undoingSlug === article.slug}
                                                            className="p-2 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Undo"
                                                        >
                                                            {undoingSlug === article.slug ? (
                                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                            ) : (
                                                                <Undo2 className="w-4 h-4" />
                                                            )}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(article.slug)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
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
                                    <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                                <Edit className="w-5 h-5 text-gray-500" />
                                                Edit Article
                                            </h3>
                                            <button onClick={() => setEditingArticle(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                                <X className="w-6 h-6" />
                                            </button>
                                        </div>
                                        <div className="flex-1 overflow-auto flex">
                                            {/* Main Editor */}
                                            <div className="flex-1 p-6 space-y-4 overflow-auto">
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
                                                        <p className="text-xs text-gray-500 mb-2">Recommended: 1200×630px (16:9 ratio) for optimal display</p>
                                                        <div className="mt-1">
                                                            <ImageUploader
                                                                value={editForm.imageUrl || ""}
                                                                onChange={(url) => setEditForm(prev => ({
                                                                    ...prev,
                                                                    imageUrl: url,
                                                                    // Only set alt if not already set and we just got an image
                                                                    imageAlt: prev.imageAlt || (url ? `Ilustrasi ${prev.title}` : "")
                                                                }))}
                                                            />
                                                        </div>
                                                        {/* Preview removed as ImageUploader handles it internally */}
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
                                            {/* SEO Analysis Sidebar */}
                                            <div className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-auto hidden lg:block">
                                                <SeoScorePanel
                                                    title={editForm.title}
                                                    metaDescription={editForm.metaDescription}
                                                    contentHtml={editForm.contentHtml}
                                                    imageAlt={editForm.imageAlt}
                                                    keyword={editForm.mainKeyword}
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
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={useCustomOnly}
                                                    onChange={(e) => setUseCustomOnly(e.target.checked)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">Gunakan Custom Prompt Saja</span>
                                            </label>
                                            {useCustomOnly && (
                                                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                                                    ⚠️ Prompt bawaan tidak akan dipakai. Custom prompt akan menggantikan seluruh instruksi default.
                                                </p>
                                            )}
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
                        </>
                    )}

                    {/* Undo Notification Toast */}
                    {undoNotification.show && (
                        <div className={`fixed bottom-4 left-4 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-in slide-in-from-left-5 ${undoNotification.success ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
                            }`}>
                            {undoNotification.success ? (
                                <CheckCircle className="w-5 h-5" />
                            ) : (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            )}
                            <span className="text-sm font-medium">{undoNotification.message}</span>
                        </div>
                    )}
                </>
            )}
            {/* Components */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                variant={confirmModal.variant}
            />
        </div>
    );
}

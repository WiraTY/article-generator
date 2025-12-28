'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles, Save, Database, Trash2, Key, ChevronDown, ChevronUp } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/ToastProvider';

interface Keyword {
    id: number;
    term: string;
    intent: string;
    status: string;
    seedKeyword: string;
}

export default function KeywordResearchPage() {
    const [seedKeyword, setSeedKeyword] = useState('');
    const [researching, setResearching] = useState(false);
    const [results, setResults] = useState<{ term: string; intent: string }[]>([]);
    const [savedKeywords, setSavedKeywords] = useState<Keyword[]>([]);
    const [saving, setSaving] = useState(false);
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    // Custom prompt states
    const [useCustomPrompt, setUseCustomPrompt] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Modal & Toast
    const { showToast } = useToast();
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

    useEffect(() => {
        fetchKeywords();
    }, []);

    // Reset selection when new results arrive
    useEffect(() => {
        if (results.length > 0) {
            // Default select all
            setSelectedIndices(new Set(results.map((_, i) => i)));
        } else {
            setSelectedIndices(new Set());
        }
    }, [results]);

    async function fetchKeywords() {
        try {
            const res = await fetch('/api/keywords');
            const data = await res.json();
            setSavedKeywords(data);
        } catch (e) {
            console.error('Failed to fetch keywords');
        }
    }

    async function handleResearch(e: React.FormEvent) {
        e.preventDefault();
        if (!seedKeyword.trim()) return;

        setResearching(true);
        setResults([]);
        setSelectedIndices(new Set());

        try {
            const res = await fetch('/api/keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    seedKeyword,
                    customPrompt: useCustomPrompt ? customPrompt : undefined
                })
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setResults(data);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (e: any) {
            showToast('Failed to research: ' + e.message, 'error');
        } finally {
            setResearching(false);
        }
    }

    function toggleSelect(index: number) {
        const newSelected = new Set(selectedIndices);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedIndices(newSelected);
    }

    function toggleSelectAll() {
        if (selectedIndices.size === results.length) {
            setSelectedIndices(new Set());
        } else {
            setSelectedIndices(new Set(results.map((_, i) => i)));
        }
    }

    async function handleSave() {
        if (selectedIndices.size === 0) return;

        setSaving(true);
        try {
            // Filter only selected keywords
            const selectedKeywords = results.filter((_, i) => selectedIndices.has(i));

            await fetch('/api/keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keywordsList: selectedKeywords.map(k => ({
                        term: k.term,
                        intent: k.intent,
                        seedKeyword
                    }))
                })
            });

            // Remove saved keywords from results
            const remainingResults = results.filter((_, i) => !selectedIndices.has(i));
            setResults(remainingResults);

            setSeedKeyword('');
            fetchKeywords();
            showToast('Keywords saved successfully!', 'success');
        } catch (e) {
            showToast('Failed to save keywords', 'error');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Keyword',
            message: 'Are you sure you want to delete this keyword?',
            variant: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    const res = await fetch(`/api/keywords?id=${id}`, { method: 'DELETE' });
                    if (!res.ok) {
                        const data = await res.json();
                        throw new Error(data.error || 'Failed to delete');
                    }
                    fetchKeywords();
                    showToast('Keyword deleted successfully', 'success');
                } catch (e: any) {
                    showToast(e.message, 'error');
                } finally {
                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                }
            }
        });
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Search className="w-6 h-6" />
                    Keyword Research
                </h1>
                <p className="text-gray-500 mt-1">Generate long-tail keywords using AI</p>
            </div>

            {/* Research Form */}
            <div className="card p-6 space-y-4">
                <form onSubmit={handleResearch} className="flex gap-3">
                    <input
                        type="text"
                        value={seedKeyword}
                        onChange={(e) => setSeedKeyword(e.target.value)}
                        placeholder="Enter seed keyword (e.g. 'kampung inggris')"
                        className="input w-full flex-1"
                        disabled={researching}
                    />
                    <button type="submit" disabled={researching || !seedKeyword.trim()} className="btn-primary flex items-center gap-2">
                        {researching ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Researching...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4" />
                                Research
                            </>
                        )}
                    </button>
                </form>

                {/* Advanced Options */}
                <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                    {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    Advanced Options
                </button>

                {showAdvanced && (
                    <div className="space-y-3 pt-2 border-t border-gray-100">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useCustomPrompt}
                                onChange={(e) => setUseCustomPrompt(e.target.checked)}
                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Gunakan Custom Prompt</span>
                        </label>

                        {useCustomPrompt && (
                            <div>
                                <textarea
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                    placeholder={`Contoh: Sebagai SEO Expert, generate 15 keyword long-tail untuk "{keyword}". Focus pada intent transaksional. Format output: JSON array [{"term": "...", "intent": "informational|transactional"}]`}
                                    className="input w-full h-32 text-sm"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Gunakan {'{keyword}'} atau {'{seed}'} sebagai placeholder untuk seed keyword.
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Research Results */}
            {results.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-green-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Generated Keywords</h3>
                                <p className="text-sm text-gray-500">{selectedIndices.size} selected</p>
                            </div>
                        </div>
                        <button
                            onClick={handleSave}
                            disabled={saving || selectedIndices.size === 0}
                            className="btn-primary flex items-center gap-2"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Selected ({selectedIndices.size})
                                </>
                            )}
                        </button>
                    </div>

                    {/* Select All Header */}
                    <div className="px-6 py-2 bg-gray-50 border-b border-gray-100 flex items-center gap-3">
                        <input
                            type="checkbox"
                            checked={results.length > 0 && selectedIndices.size === results.length}
                            onChange={toggleSelectAll}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Select All</span>
                    </div>

                    <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                        {results.map((kw, i) => (
                            <div
                                key={i}
                                className={`px-6 py-3 flex items-center justify-between transition-colors cursor-pointer ${selectedIndices.has(i) ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                                onClick={() => toggleSelect(i)}
                            >
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedIndices.has(i)}
                                        onChange={() => { }} // handled by parent div click
                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 pointer-events-none"
                                    />
                                    <span className="text-gray-900">{kw.term}</span>
                                </div>
                                <span className={`badge ${kw.intent === 'transactional' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {kw.intent}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Saved Keywords */}
            <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-2">
                    <Database className="w-5 h-5 text-blue-600" />
                    <div>
                        <h3 className="font-semibold text-gray-900">Saved Keywords</h3>
                        <p className="text-sm text-gray-500">{savedKeywords.length} keywords in database</p>
                    </div>
                </div>
                {savedKeywords.length === 0 ? (
                    <div className="px-6 py-12 text-center text-gray-500 flex flex-col items-center">
                        <Key className="w-12 h-12 mb-4 text-gray-300" />
                        <p>No keywords saved yet. Research some above!</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {savedKeywords.map((kw) => (
                            <div key={kw.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 group">
                                <div>
                                    <span className="text-gray-900 font-medium">{kw.term}</span>
                                    <span className={`ml-3 badge ${kw.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                        {kw.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`badge ${kw.intent === 'transactional' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {kw.intent}
                                    </span>
                                    <button
                                        onClick={() => handleDelete(kw.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete keyword"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
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

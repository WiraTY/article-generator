'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, Sparkles, Save, Database, Trash2, Key } from 'lucide-react';

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

    useEffect(() => {
        fetchKeywords();
    }, []);

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

        try {
            const res = await fetch('/api/keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seedKeyword })
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setResults(data);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
        } catch (e: any) {
            alert('Failed to research: ' + e.message);
        } finally {
            setResearching(false);
        }
    }

    async function handleSave() {
        if (results.length === 0) return;

        setSaving(true);
        try {
            await fetch('/api/keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    keywordsList: results.map(k => ({
                        term: k.term,
                        intent: k.intent,
                        seedKeyword
                    }))
                })
            });
            setResults([]);
            setSeedKeyword('');
            fetchKeywords();
        } catch (e) {
            alert('Failed to save keywords');
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: number) {
        if (!confirm('Delete this keyword?')) return;
        try {
            await fetch(`/api/keywords?id=${id}`, { method: 'DELETE' });
            fetchKeywords();
        } catch (e) {
            alert('Failed to delete');
        }
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
            <div className="card p-6">
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
            </div>

            {/* Research Results */}
            {results.length > 0 && (
                <div className="card overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50">
                        <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-green-600" />
                            <div>
                                <h3 className="font-semibold text-gray-900">Generated Keywords</h3>
                                <p className="text-sm text-gray-500">{results.length} keywords found</p>
                            </div>
                        </div>
                        <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
                            {saving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save All
                                </>
                            )}
                        </button>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {results.map((kw, i) => (
                            <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                                <span className="text-gray-900">{kw.term}</span>
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
        </div>
    );
}

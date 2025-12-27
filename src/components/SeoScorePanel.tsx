'use client';

import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, AlertCircle, Target, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { analyzeSEO, analyzeReadability, type SEOAnalysis, type ReadabilityAnalysis } from '@/lib/services/seoAnalyzer';

interface SeoScorePanelProps {
    title: string;
    metaDescription: string;
    contentHtml: string;
    imageAlt?: string;
    keyword: string;
}

function CircularProgress({ percentage, status, size = 80 }: { percentage: number; status: 'good' | 'ok' | 'bad'; size?: number }) {
    const radius = (size - 8) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (percentage / 100) * circumference;

    const colorClass = status === 'good' ? 'text-green-500' : status === 'ok' ? 'text-yellow-500' : 'text-red-500';
    const bgClass = status === 'good' ? 'text-green-100' : status === 'ok' ? 'text-yellow-100' : 'text-red-100';

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    className={bgClass}
                    strokeWidth="6"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    className={`${colorClass} transition-all duration-500`}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-lg font-bold ${colorClass}`}>{percentage}</span>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: 'good' | 'ok' | 'bad' }) {
    if (status === 'good') {
        return <span className="text-xs font-medium px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Good</span>;
    }
    if (status === 'ok') {
        return <span className="text-xs font-medium px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">OK</span>;
    }
    return <span className="text-xs font-medium px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Needs Work</span>;
}

function CheckItem({ check }: { check: { id: string; label: string; passed: boolean; message: string; severity: 'good' | 'ok' | 'bad' } }) {
    const Icon = check.severity === 'good' ? CheckCircle : check.severity === 'ok' ? AlertCircle : XCircle;
    const colorClass = check.severity === 'good' ? 'text-green-500' : check.severity === 'ok' ? 'text-yellow-500' : 'text-red-500';
    const bgClass = check.severity === 'good' ? 'bg-green-50' : check.severity === 'ok' ? 'bg-yellow-50' : 'bg-red-50';

    return (
        <div className={`flex items-start gap-2 p-2 rounded-lg ${bgClass}`}>
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${colorClass}`} />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{check.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{check.message}</p>
            </div>
        </div>
    );
}

export default function SeoScorePanel({ title, metaDescription, contentHtml, imageAlt, keyword }: SeoScorePanelProps) {
    const [showSeoDetails, setShowSeoDetails] = useState(true);
    const [showReadabilityDetails, setShowReadabilityDetails] = useState(true);

    // Memoize analysis to prevent unnecessary recalculations
    const seoAnalysis = useMemo(() => {
        if (!keyword) return null;
        return analyzeSEO({ title, metaDescription, contentHtml, imageAlt }, keyword);
    }, [title, metaDescription, contentHtml, imageAlt, keyword]);

    const readabilityAnalysis = useMemo(() => {
        return analyzeReadability(contentHtml);
    }, [contentHtml]);

    if (!keyword) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-500 text-center">
                    Masukkan keyword untuk melihat analisis SEO
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">SEO & Readability Analysis</h3>
            </div>

            {/* Score Overview */}
            <div className="grid grid-cols-2 gap-4">
                {/* SEO Score */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Target className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">SEO Score</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                        {seoAnalysis && (
                            <>
                                <CircularProgress percentage={seoAnalysis.percentage} status={seoAnalysis.status} />
                                <StatusBadge status={seoAnalysis.status} />
                            </>
                        )}
                    </div>
                </div>

                {/* Readability Score */}
                <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Readability</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2">
                        <CircularProgress percentage={readabilityAnalysis.percentage} status={readabilityAnalysis.status} />
                        <StatusBadge status={readabilityAnalysis.status} />
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="text-gray-500 text-xs">Kata</p>
                        <p className="font-semibold text-gray-900">{readabilityAnalysis.stats.wordCount}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Kalimat</p>
                        <p className="font-semibold text-gray-900">{readabilityAnalysis.stats.sentenceCount}</p>
                    </div>
                    <div>
                        <p className="text-gray-500 text-xs">Paragraf</p>
                        <p className="font-semibold text-gray-900">{readabilityAnalysis.stats.paragraphCount}</p>
                    </div>
                </div>
            </div>

            {/* SEO Checks */}
            {seoAnalysis && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <button
                        onClick={() => setShowSeoDetails(!showSeoDetails)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                        <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            <Target className="w-4 h-4 text-blue-600" />
                            SEO Analysis ({seoAnalysis.checks.filter(c => c.passed).length}/{seoAnalysis.checks.length})
                        </span>
                        {showSeoDetails ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    {showSeoDetails && (
                        <div className="px-4 pb-4 space-y-2">
                            {seoAnalysis.checks.map((check) => (
                                <CheckItem key={check.id} check={check} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Readability Checks */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                    onClick={() => setShowReadabilityDetails(!showReadabilityDetails)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                    <span className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-green-600" />
                        Readability ({readabilityAnalysis.checks.filter(c => c.passed).length}/{readabilityAnalysis.checks.length})
                    </span>
                    {showReadabilityDetails ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </button>
                {showReadabilityDetails && (
                    <div className="px-4 pb-4 space-y-2">
                        {readabilityAnalysis.checks.map((check) => (
                            <CheckItem key={check.id} check={check} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useJobs } from './JobNotificationProvider';
import { Loader2, CheckCircle, XCircle, X, ExternalLink, Ban } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function JobStatusToast() {
    const { activeJobs, removeJob, clearCompletedJobs, cancelJob } = useJobs();
    const [cancellingId, setCancellingId] = useState<number | null>(null);

    if (activeJobs.length === 0) return null;

    const hasCompleted = activeJobs.some(j => j.status === 'completed' || j.status === 'failed');

    async function handleCancel(jobId: number) {
        setCancellingId(jobId);
        await cancelJob(jobId);
        setCancellingId(null);
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
            {activeJobs.map(job => (
                <div
                    key={job.id}
                    className={`bg-white rounded-xl shadow-lg border p-4 animate-in slide-in-from-right-5 duration-300 ${job.status === 'completed' ? 'border-green-200' :
                            job.status === 'failed' || job.status === 'cancelled' ? 'border-red-200' :
                                'border-blue-200'
                        }`}
                >
                    <div className="flex items-start gap-3">
                        {/* Status Icon */}
                        <div className={`p-2 rounded-lg ${job.status === 'completed' ? 'bg-green-100' :
                                job.status === 'failed' || job.status === 'cancelled' ? 'bg-red-100' :
                                    'bg-blue-100'
                            }`}>
                            {job.status === 'pending' || job.status === 'processing' ? (
                                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                            ) : job.status === 'completed' ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            ) : job.status === 'cancelled' ? (
                                <Ban className="w-5 h-5 text-gray-500" />
                            ) : (
                                <XCircle className="w-5 h-5 text-red-600" />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="font-medium text-gray-900 text-sm truncate">
                                    {job.jobType === 'regenerate' ? '🔄 ' : ''}{job.keyword}
                                </p>
                                <button
                                    onClick={() => removeJob(job.id)}
                                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Hapus notifikasi"
                                >
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>

                            <p className={`text-xs mt-0.5 ${job.status === 'completed' ? 'text-green-600' :
                                    job.status === 'failed' ? 'text-red-600' :
                                        job.status === 'cancelled' ? 'text-gray-500' :
                                            'text-blue-600'
                                }`}>
                                {job.status === 'pending' && 'Menunggu...'}
                                {job.status === 'processing' && (job.jobType === 'regenerate' ? 'Sedang regenerate...' : 'Sedang generate artikel...')}
                                {job.status === 'completed' && (job.jobType === 'regenerate' ? 'Artikel berhasil diupdate!' : 'Artikel berhasil dibuat!')}
                                {job.status === 'failed' && (job.error || 'Gagal generate artikel')}
                                {job.status === 'cancelled' && 'Dibatalkan'}
                            </p>

                            {/* Cancel button for pending jobs */}
                            {job.status === 'pending' && (
                                <button
                                    onClick={() => handleCancel(job.id)}
                                    disabled={cancellingId === job.id}
                                    className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 mt-2 font-medium disabled:opacity-50"
                                >
                                    {cancellingId === job.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                        <Ban className="w-3 h-3" />
                                    )}
                                    Batalkan
                                </button>
                            )}

                            {/* Link to article if completed */}
                            {job.status === 'completed' && job.article && (
                                <Link
                                    href={`/article/${job.article.slug}`}
                                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 mt-2 font-medium"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Lihat Artikel
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {/* Clear completed button */}
            {hasCompleted && activeJobs.length > 1 && (
                <button
                    onClick={clearCompletedJobs}
                    className="text-xs text-gray-500 hover:text-gray-700 text-center py-1"
                >
                    Hapus notifikasi selesai
                </button>
            )}
        </div>
    );
}

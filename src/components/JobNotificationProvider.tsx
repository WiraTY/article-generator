'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface Job {
    id: number;
    keyword: string;
    jobType: 'generate' | 'regenerate';
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
    error?: string;
    article?: {
        id: number;
        title: string;
        slug: string;
    };
}

interface JobContextType {
    activeJobs: Job[];
    addJob: (jobId: number, keyword: string, jobType?: 'generate' | 'regenerate') => void;
    removeJob: (jobId: number) => void;
    clearCompletedJobs: () => void;
    cancelJob: (jobId: number) => Promise<void>;
}

const JobContext = createContext<JobContextType | null>(null);

const STORAGE_KEY = 'article_generation_jobs';

export function JobNotificationProvider({ children }: { children: ReactNode }) {
    const [activeJobs, setActiveJobs] = useState<Job[]>([]);

    // Load jobs from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const storedJobs = JSON.parse(stored) as { id: number; keyword: string; jobType?: string }[];
                setActiveJobs(storedJobs.map(j => ({
                    id: j.id,
                    keyword: j.keyword,
                    jobType: (j.jobType as 'generate' | 'regenerate') || 'generate',
                    status: 'pending' as const
                })));
            } catch (e) {
                console.error('Failed to parse stored jobs');
            }
        }
    }, []);

    // Save active (non-completed) jobs to localStorage
    useEffect(() => {
        const pendingJobs = activeJobs
            .filter(j => j.status === 'pending' || j.status === 'processing')
            .map(j => ({ id: j.id, keyword: j.keyword, jobType: j.jobType }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingJobs));
    }, [activeJobs]);

    // Poll for job status updates
    useEffect(() => {
        const pendingJobs = activeJobs.filter(j => j.status === 'pending' || j.status === 'processing');
        if (pendingJobs.length === 0) return;

        const pollInterval = setInterval(async () => {
            for (const job of pendingJobs) {
                try {
                    const res = await fetch(`/api/jobs/${job.id}`);
                    if (res.ok) {
                        const data = await res.json();
                        setActiveJobs(prev => prev.map(j =>
                            j.id === job.id
                                ? { ...j, status: data.status, error: data.error, article: data.article }
                                : j
                        ));
                    }
                } catch (e) {
                    console.error('Failed to poll job status:', e);
                }
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(pollInterval);
    }, [activeJobs]);

    const addJob = useCallback((jobId: number, keyword: string, jobType: 'generate' | 'regenerate' = 'generate') => {
        setActiveJobs(prev => [...prev, { id: jobId, keyword, jobType, status: 'pending' }]);
    }, []);

    const removeJob = useCallback((jobId: number) => {
        setActiveJobs(prev => prev.filter(j => j.id !== jobId));
    }, []);

    const clearCompletedJobs = useCallback(() => {
        setActiveJobs(prev => prev.filter(j => j.status === 'pending' || j.status === 'processing'));
    }, []);

    const cancelJob = useCallback(async (jobId: number) => {
        try {
            const res = await fetch(`/api/jobs?id=${jobId}`, { method: 'DELETE' });
            if (res.ok) {
                setActiveJobs(prev => prev.map(j =>
                    j.id === jobId ? { ...j, status: 'cancelled' } : j
                ));
            }
        } catch (e) {
            console.error('Failed to cancel job:', e);
        }
    }, []);

    return (
        <JobContext.Provider value={{ activeJobs, addJob, removeJob, clearCompletedJobs, cancelJob }}>
            {children}
        </JobContext.Provider>
    );
}

export function useJobs() {
    const context = useContext(JobContext);
    if (!context) {
        throw new Error('useJobs must be used within a JobNotificationProvider');
    }
    return context;
}

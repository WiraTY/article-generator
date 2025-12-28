'use client';

import { useEffect, useRef } from 'react';

export default function ViewTracker({ id, slug }: { id?: number, slug?: string }) {
    const tracked = useRef(false);

    useEffect(() => {
        if (tracked.current) return;

        // Simple check to avoid double counting in React Strict Mode (dev)
        tracked.current = true;

        // Wait a bit to ensure it's a real view (3 seconds)
        const timer = setTimeout(() => {
            fetch('/api/analytics/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, slug })
            }).catch(err => console.error('Failed to track view', err));
        }, 3000);

        return () => clearTimeout(timer);
    }, [id, slug]);

    return null;
}

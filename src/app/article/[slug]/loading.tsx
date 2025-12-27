'use client';

export default function ArticleLoading() {
    return (
        <div className="min-h-screen bg-white">
            {/* Navigation Skeleton */}
            <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-screen-xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse"></div>
                        <div className="w-32 h-5 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
            </nav>

            <article className="w-full">
                {/* Header Skeleton */}
                <header className="max-w-screen-md mx-auto px-4 pt-12 pb-8 text-center">
                    {/* Category badge */}
                    <div className="flex justify-center mb-4">
                        <div className="w-32 h-6 bg-blue-100 rounded-full animate-pulse"></div>
                    </div>

                    {/* Title */}
                    <div className="space-y-3 mb-6">
                        <div className="h-10 bg-gray-200 rounded-lg w-3/4 mx-auto animate-pulse"></div>
                        <div className="h-10 bg-gray-200 rounded-lg w-1/2 mx-auto animate-pulse"></div>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                        <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-200 rounded-full"></div>
                        <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </div>

                    {/* Tags */}
                    <div className="flex justify-center gap-2">
                        <div className="w-16 h-6 bg-gray-100 rounded-lg animate-pulse"></div>
                        <div className="w-20 h-6 bg-gray-100 rounded-lg animate-pulse"></div>
                        <div className="w-14 h-6 bg-gray-100 rounded-lg animate-pulse"></div>
                    </div>
                </header>

                {/* Featured Image Skeleton */}
                <div className="max-w-screen-lg mx-auto px-4 mb-12">
                    <div className="aspect-video rounded-2xl bg-gray-200 animate-pulse"></div>
                </div>

                {/* Content Skeleton */}
                <div className="max-w-4xl mx-auto px-4 pb-20">
                    <div className="space-y-4">
                        {/* Paragraph skeletons */}
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-11/12 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </article>

            {/* Loading Spinner Overlay */}
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-gray-600">Memuat artikel...</span>
                </div>
            </div>
        </div>
    );
}

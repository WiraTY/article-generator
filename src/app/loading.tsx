'use client';

export default function HomeLoading() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
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

            {/* Hero Section Skeleton */}
            <header className="py-20 bg-gray-50 border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <div className="flex justify-center mb-6">
                        <div className="w-48 h-6 bg-blue-100 rounded-full animate-pulse"></div>
                    </div>
                    <div className="space-y-4 mb-6">
                        <div className="h-12 bg-gray-200 rounded-lg w-3/4 mx-auto animate-pulse"></div>
                        <div className="h-12 bg-gray-200 rounded-lg w-1/2 mx-auto animate-pulse"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto mb-8 animate-pulse"></div>
                    <div className="w-32 h-4 bg-gray-200 rounded mx-auto animate-pulse"></div>
                </div>
            </header>

            {/* Main Content Skeleton */}
            <main className="max-w-screen-xl mx-auto px-4 py-12">
                {/* Section Title */}
                <div className="flex items-center gap-2 mb-8">
                    <div className="w-6 h-6 bg-blue-200 rounded animate-pulse"></div>
                    <div className="w-40 h-7 bg-gray-200 rounded animate-pulse"></div>
                </div>

                {/* Article Cards Grid */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl overflow-hidden border border-gray-200">
                            <div className="aspect-video bg-gray-200 animate-pulse"></div>
                            <div className="p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="w-16 h-3 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-5 bg-gray-200 rounded w-full animate-pulse"></div>
                                    <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Loading Spinner */}
            <div className="fixed bottom-6 right-6">
                <div className="bg-white rounded-full p-3 shadow-lg border border-gray-100">
                    <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </div>
        </div>
    );
}

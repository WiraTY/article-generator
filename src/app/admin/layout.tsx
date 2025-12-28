'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Search, FileText, Settings, PenTool, ExternalLink, ChevronRight, Users, MessageSquare, LogOut, ChevronDown, Menu, X } from 'lucide-react';
import { JobNotificationProvider } from '@/components/JobNotificationProvider';
import { JobStatusToast } from '@/components/JobStatusToast';
import { ToastProvider } from '@/components/ToastProvider';

interface SessionUser {
    id: number;
    email: string;
    name: string;
    role: 'super_admin' | 'author' | 'user';
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<SessionUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Check authentication
    useEffect(() => {
        checkAuth();
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    async function checkAuth() {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            } else {
                // Not authenticated, redirect to login
                if (pathname !== '/admin/login') {
                    router.push('/admin/login');
                }
            }
        } catch {
            router.push('/admin/login');
        } finally {
            setLoading(false);
        }
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
    }

    // Skip layout for login page
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    // Not authenticated
    if (!user) {
        return null;
    }

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
        { path: '/admin/keywords', label: 'Keyword Research', icon: Search },
        { path: '/admin/content', label: 'Content Manager', icon: FileText },
        { path: '/admin/comments', label: 'Comments', icon: MessageSquare },
        ...(user.role === 'super_admin' ? [{ path: '/admin/users', label: 'User Management', icon: Users }] : []),
        { path: '/admin/settings', label: 'Settings', icon: Settings },
    ];

    return (
        <ToastProvider>
            <JobNotificationProvider>
                <div className="min-h-screen bg-gray-50 flex">
                    {/* Desktop Sidebar */}
                    <aside className="w-64 bg-white border-r border-gray-200 fixed h-full z-10 hidden lg:block">
                        <div className="h-full flex flex-col">
                            {/* Logo */}
                            <div className="p-6 border-b border-gray-100 mb-6">
                                <Link href="/" className="flex items-center gap-3 group">
                                    <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center group-hover:bg-gray-800 transition-colors shadow-sm">
                                        <PenTool className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h1 className="font-bold text-gray-900 tracking-tight leading-none">ArticleGen</h1>
                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mt-1">Admin Panel</p>
                                    </div>
                                </Link>
                            </div>

                            {/* Navigation */}
                            <nav className="flex-1 px-4 space-y-1">
                                {navItems.map((item) => {
                                    const isActive = item.exact
                                        ? pathname === item.path
                                        : pathname?.startsWith(item.path);
                                    const Icon = item.icon;

                                    return (
                                        <Link
                                            key={item.path}
                                            href={item.path}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${isActive
                                                ? 'bg-gray-100 text-gray-900 shadow-sm'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            <Icon className={`w-4 h-4 ${isActive ? 'text-gray-900' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                            <span className="flex-1">{item.label}</span>
                                            {isActive && <ChevronRight className="w-3 h-3 text-gray-400" />}
                                        </Link>
                                    );
                                })}
                            </nav>

                            {/* User Section */}
                            <div className="p-4 border-t border-gray-100 space-y-3">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                                            <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                                        </div>
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                    </button>

                                    {showUserMenu && (
                                        <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Logout
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <Link
                                    href="/"
                                    className="flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 transition-all"
                                >
                                    <span className="flex items-center gap-2">
                                        <ExternalLink className="w-4 h-4 text-gray-500" />
                                        View Blog
                                    </span>
                                </Link>
                            </div>
                        </div>
                    </aside>

                    {/* Mobile Header */}
                    <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 h-14 flex items-center justify-between">
                        <Link href="/admin" className="font-bold text-gray-900">ArticleGen</Link>
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>

                    {/* Mobile Menu Overlay */}
                    {mobileMenuOpen && (
                        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
                    )}

                    {/* Mobile Menu Drawer */}
                    <div className={`lg:hidden fixed top-14 right-0 bottom-0 w-72 bg-white z-50 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                        <nav className="p-4 space-y-1">
                            {navItems.map((item) => {
                                const isActive = item.exact
                                    ? pathname === item.path
                                    : pathname?.startsWith(item.path);
                                const Icon = item.icon;

                                return (
                                    <Link
                                        key={item.path}
                                        href={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive
                                            ? 'bg-gray-100 text-gray-900'
                                            : 'text-gray-600 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                            <Link href="/" className="flex items-center gap-2 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 rounded-lg">
                                <ExternalLink className="w-5 h-5" />
                                View Blog
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Main Content */}
                    <main className="flex-1 lg:ml-64 min-h-screen pt-14 lg:pt-0">
                        <div className="max-w-5xl mx-auto p-6 md:p-8">
                            {children}
                        </div>
                    </main>

                    {/* Job Status Toast */}
                    <JobStatusToast />
                </div>
            </JobNotificationProvider>
        </ToastProvider>
    );
}

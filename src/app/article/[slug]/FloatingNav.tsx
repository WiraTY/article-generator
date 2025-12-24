'use client';

import { useState, useEffect } from 'react';
import { List, ArrowUp, X } from 'lucide-react';

interface TocItem {
    id: string;
    title: string;
    level: string;
}

interface FloatingNavProps {
    toc: TocItem[];
}

export default function FloatingNav({ toc }: FloatingNavProps) {
    const [showButtons, setShowButtons] = useState(false);
    const [showTocSheet, setShowTocSheet] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            // Show buttons after scrolling 300px
            setShowButtons(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            setShowTocSheet(false);
        }
    };

    if (!showButtons) return null;

    return (
        <>
            {/* Floating Buttons */}
            <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
                {/* TOC Button - Mobile Only */}
                {toc.length > 0 && (
                    <button
                        onClick={() => setShowTocSheet(true)}
                        className="lg:hidden w-12 h-12 bg-gray-900 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-800 transition-all hover:scale-110"
                        aria-label="Table of Contents"
                    >
                        <List className="w-5 h-5" />
                    </button>
                )}

                {/* Back to Top Button - All Devices */}
                <button
                    onClick={scrollToTop}
                    className="w-12 h-12 bg-white text-gray-900 border border-gray-200 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all hover:scale-110"
                    aria-label="Back to Top"
                >
                    <ArrowUp className="w-5 h-5" />
                </button>
            </div>

            {/* TOC Bottom Sheet - Mobile Only */}
            {showTocSheet && (
                <div className="lg:hidden fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setShowTocSheet(false)}
                    />

                    {/* Sheet */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] overflow-hidden animate-slide-up">
                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <List className="w-5 h-5" />
                                Daftar Isi
                            </h3>
                            <button
                                onClick={() => setShowTocSheet(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* TOC Items */}
                        <div className="overflow-y-auto max-h-[calc(70vh-60px)] pb-safe">
                            <nav className="p-4 space-y-1">
                                {toc.map((item, index) => (
                                    <button
                                        key={index}
                                        onClick={() => scrollToSection(item.id)}
                                        className={`w-full text-left px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors ${item.level === 'h3' ? 'pl-8 text-sm text-gray-600' : 'font-medium text-gray-900'
                                            }`}
                                    >
                                        {item.title}
                                    </button>
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

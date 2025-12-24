'use client';

import { useState, useEffect } from 'react';
import { Facebook, Twitter, Linkedin, Link2, Send, MessageCircle, Instagram } from 'lucide-react';

interface SocialShareProps {
    config: {
        enabled: boolean;
        platforms: string[];
    };
    title: string;
}

export default function SocialShare({ config, title }: SocialShareProps) {
    const [url, setUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        setUrl(window.location.href);
    }, []);

    if (!config.enabled || config.platforms.length === 0) return null;

    const shareLinks: Record<string, { icon: any, color: string, href: string }> = {
        facebook: {
            icon: Facebook,
            color: 'bg-[#1877F2] hover:bg-[#166fe5]',
            href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
        },
        twitter: {
            icon: Twitter,
            color: 'bg-[#000000] hover:bg-[#333333]', // X branding
            href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
        },
        linkedin: {
            icon: Linkedin,
            color: 'bg-[#0A66C2] hover:bg-[#004182]',
            href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        },
        whatsapp: {
            icon: MessageCircle,
            color: 'bg-[#25D366] hover:bg-[#128C7E]',
            href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`
        },
        telegram: {
            icon: Send,
            color: 'bg-[#0088cc] hover:bg-[#007db1]',
            href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
        },
        instagram: {
            icon: Instagram,
            color: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90',
            href: `https://www.instagram.com/` // IG doesn't support web share intent
        },
        copy_link: {
            icon: Link2,
            color: 'bg-gray-600 hover:bg-gray-700',
            href: '#'
        }
    };

    const handleCopy = (e: React.MouseEvent) => {
        e.preventDefault();
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const orderedPlatforms = ['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'copy_link'];
    const activePlatforms = orderedPlatforms.filter(p => config.platforms.includes(p));

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 py-8 border-t border-gray-100 mt-8 mb-8">
            <span className="text-sm font-bold text-gray-900 uppercase tracking-wider flex-shrink-0">
                Share this article:
            </span>
            <div className="flex flex-wrap gap-2">
                {activePlatforms.map(platform => {
                    const data = shareLinks[platform];
                    if (!data) return null;
                    const Icon = data.icon;

                    if (platform === 'copy_link') {
                        return (
                            <button
                                key={platform}
                                onClick={handleCopy}
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all ${data.color} relative group`}
                                aria-label="Copy Link"
                                title="Copy Link"
                            >
                                <Icon className="w-5 h-5" />
                                {copied && (
                                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs py-1 px-2 rounded whitespace-nowrap">
                                        Copied!
                                    </span>
                                )}
                            </button>
                        );
                    }

                    return (
                        <a
                            key={platform}
                            href={data.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-all transform hover:-translate-y-1 hover:shadow-lg ${data.color}`}
                            aria-label={`Share on ${platform}`}
                            title={`Share on ${platform}`}
                        >
                            <Icon className="w-5 h-5" />
                        </a>
                    );
                })}
            </div>
        </div>
    );
}

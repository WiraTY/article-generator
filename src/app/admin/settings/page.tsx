'use client';

import { useState, useEffect } from 'react';
import { Settings, Database, Lightbulb, CheckCircle, Save, Loader2, MessageSquare, Share2, Palette, Image, Type, Bot, Zap, Globe } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

export default function SettingsPage() {
    const [productKnowledge, setProductKnowledge] = useState('');
    const [enableProductKnowledge, setEnableProductKnowledge] = useState(true);
    const [commentModeration, setCommentModeration] = useState(true);
    const [socialShare, setSocialShare] = useState({ enabled: true, platforms: ['facebook', 'twitter', 'linkedin', 'whatsapp'] });
    const [branding, setBranding] = useState({ appName: 'Article Generator', appIcon: '' });
    const [aiProvider, setAiProvider] = useState('gemini');  // Just provider string, no API key
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(true);

    const { showToast } = useToast();

    useEffect(() => {
        async function loadSettings() {
            try {
                const [pkRes, epkRes, cmRes, ssRes, brRes, aiRes] = await Promise.all([
                    fetch('/api/settings/productKnowledge'),
                    fetch('/api/settings/enableProductKnowledge'),
                    fetch('/api/settings/commentModeration'),
                    fetch('/api/settings/socialShare'),
                    fetch('/api/settings/branding'),
                    fetch('/api/settings/aiProvider')
                ]);
                const pkData = await pkRes.json();

                let epkData = { value: 'enabled' };
                if (epkRes.ok) epkData = await epkRes.json();

                const cmData = await cmRes.json();

                let ssData = { value: null };
                if (ssRes.ok) ssData = await ssRes.json();
                let brData = { value: null };
                if (brRes.ok) brData = await brRes.json();
                let aiData = { value: null };
                if (aiRes.ok) aiData = await aiRes.json();

                setProductKnowledge(pkData.value || '');
                setEnableProductKnowledge(epkData.value !== 'disabled');
                setCommentModeration(cmData.value !== 'disabled');

                if (ssData.value) {
                    try { setSocialShare(JSON.parse(ssData.value)); } catch { }
                }
                if (brData.value) {
                    try { setBranding(JSON.parse(brData.value)); } catch { }
                }
                if (aiData.value) {
                    try {
                        const parsed = JSON.parse(aiData.value);
                        // Handle both old format {provider, zaiApiKey} and new format (just provider)
                        setAiProvider(typeof parsed === 'string' ? parsed : parsed.provider || 'gemini');
                    } catch {
                        setAiProvider(aiData.value);
                    }
                }
            } catch (e) {
                console.error('Failed to load settings');
            } finally {
                setLoading(false);
            }
        }
        loadSettings();
    }, []);

    async function handleSave() {
        setSaving(true);
        setSaved(false);
        try {
            await Promise.all([
                fetch('/api/settings/productKnowledge', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value: productKnowledge })
                }),
                fetch('/api/settings/enableProductKnowledge', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value: enableProductKnowledge ? 'enabled' : 'disabled' })
                }),
                fetch('/api/settings/commentModeration', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value: commentModeration ? 'enabled' : 'disabled' })
                }),
                fetch('/api/settings/socialShare', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value: JSON.stringify(socialShare) })
                }),
                fetch('/api/settings/branding', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value: JSON.stringify(branding) })
                }),
                fetch('/api/settings/aiProvider', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value: aiProvider })  // Just provider string
                })
            ]);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            showToast('Settings saved successfully', 'success');
        } catch (e) {
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full spinner"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="w-6 h-6" />
                    Settings
                </h1>
                <p className="text-gray-500 mt-1">Configure global settings for your blog</p>
            </div>

            {/* AI Provider */}
            <div className="card">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 to-purple-50 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-violet-600" />
                    <div>
                        <h3 className="font-semibold text-gray-900">AI Provider</h3>
                        <p className="text-sm text-gray-500">Choose which AI to use for content generation</p>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    {/* Provider Selection */}
                    <div className="space-y-3">
                        <label className="label">Select Provider</label>
                        <div className="grid gap-3 sm:grid-cols-2">
                            <label
                                className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${aiProvider === 'gemini'
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="aiProvider"
                                    value="gemini"
                                    checked={aiProvider === 'gemini'}
                                    onChange={() => setAiProvider('gemini')}
                                    className="sr-only"
                                />
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold">
                                    G
                                </div>
                                <p className="font-semibold text-gray-900">Google Gemini</p>
                            </label>
                            <label
                                className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${aiProvider === 'zai'
                                    ? 'border-violet-500 bg-violet-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                <input
                                    type="radio"
                                    name="aiProvider"
                                    value="zai"
                                    checked={aiProvider === 'zai'}
                                    onChange={() => setAiProvider('zai')}
                                    className="sr-only"
                                />
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                                    Z
                                </div>
                                <p className="font-semibold text-gray-900">Z.AI (GLM-4.7)</p>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* App Branding */}
            <div className="card">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-pink-50 flex items-center gap-2">
                    <Palette className="w-5 h-5 text-rose-600" />
                    <div>
                        <h3 className="font-semibold text-gray-900">App Branding</h3>
                        <p className="text-sm text-gray-500">Customize your application name and icon</p>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    {/* App Name */}
                    <div>
                        <label className="label flex items-center gap-2">
                            <Type className="w-4 h-4 text-gray-400" />
                            Application Name
                        </label>
                        <input
                            type="text"
                            value={branding.appName}
                            onChange={(e) => setBranding(prev => ({ ...prev, appName: e.target.value }))}
                            className="input"
                            placeholder="Article Generator"
                        />
                        <p className="text-xs text-gray-500 mt-1">Displayed in navbar, footer, and browser title</p>
                    </div>

                    {/* App Icon */}
                    <div>
                        <label className="label flex items-center gap-2">
                            <Image className="w-4 h-4 text-gray-400" />
                            Application Icon URL
                        </label>
                        <input
                            type="url"
                            value={branding.appIcon}
                            onChange={(e) => setBranding(prev => ({ ...prev, appIcon: e.target.value }))}
                            className="input"
                            placeholder="https://example.com/logo.png"
                        />
                        <p className="text-xs text-gray-500 mt-1">URL to your logo image (PNG/SVG recommended, 32x32 or larger)</p>

                        {/* Preview */}
                        {branding.appIcon && (
                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-xs font-medium text-gray-500 mb-2">Preview:</p>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                                        <img
                                            src={branding.appIcon}
                                            alt="App Icon Preview"
                                            className="w-8 h-8 object-contain"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                    </div>
                                    <span className="font-bold text-gray-900">{branding.appName || 'Article Generator'}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Comment Moderation */}
            <div className="card">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-cyan-50 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                    <div>
                        <h3 className="font-semibold text-gray-900">Comment Moderation</h3>
                        <p className="text-sm text-gray-500">Control how comments are handled</p>
                    </div>
                </div>
                <div className="p-6">
                    <div
                        className="flex items-center justify-between cursor-pointer group"
                        onClick={() => setCommentModeration(!commentModeration)}
                    >
                        <div>
                            <p className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">Require Approval</p>
                            <p className="text-sm text-gray-500">
                                {commentModeration
                                    ? 'New comments must be approved by admin before appearing'
                                    : 'New comments will appear immediately without approval'}
                            </p>
                        </div>
                        <button
                            type="button"
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${commentModeration ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <span className="sr-only">Use setting</span>
                            <span
                                aria-hidden="true"
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${commentModeration ? 'translate-x-5' : 'translate-x-0'
                                    }`}
                            />
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Knowledge */}
            <div className="card">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center gap-2">
                    <Database className="w-5 h-5 text-purple-600" />
                    <div>
                        <h3 className="font-semibold text-gray-900">Product Knowledge Base</h3>
                        <p className="text-sm text-gray-500">Information the AI will use when generating articles</p>
                    </div>
                </div>
                <div className="p-6 space-y-4">
                    {/* Enable/Disable Toggle */}
                    <div className="flex items-center justify-between cursor-pointer group mb-4" onClick={() => setEnableProductKnowledge(!enableProductKnowledge)}>
                        <div>
                            <p className="font-medium text-gray-900 group-hover:text-purple-700 transition-colors">Use Product Knowledge</p>
                            <p className="text-sm text-gray-500">
                                {enableProductKnowledge
                                    ? 'AI will use the information below to improve accuracy'
                                    : 'AI will generate generic content without specific product details'}
                            </p>
                        </div>
                        <button
                            type="button"
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-600 focus:ring-offset-2 ${enableProductKnowledge ? 'bg-purple-600' : 'bg-gray-200'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${enableProductKnowledge ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {enableProductKnowledge && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                            <textarea
                                value={productKnowledge}
                                onChange={(e) => setProductKnowledge(e.target.value)}
                                rows={12}
                                className="input font-mono text-sm"
                                placeholder={`Enter your product knowledge here. Example:

## Our Company
- Company Name: XYZ Corp
- Founded: 2020

## Products & Services  
- Product A: Description, price $99
- Product B: Description, price $149

## Key Facts
- 10,000+ students
- 95% satisfaction rate`}
                            />
                            <p className="text-sm text-gray-500 flex items-start gap-1.5">
                                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                The AI will reference this for accurate product details in articles.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Social Media Sharing */}
            <div className="card">
                <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-teal-50 to-emerald-50 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-teal-600" />
                    <div>
                        <h3 className="font-semibold text-gray-900">Social Media Sharing</h3>
                        <p className="text-sm text-gray-500">Manage social share buttons on article pages</p>
                    </div>
                </div>
                <div className="p-6 space-y-6">
                    {/* Enable/Disable Section */}
                    <div className="flex items-center justify-between cursor-pointer group" onClick={() => setSocialShare(prev => ({ ...prev, enabled: !prev.enabled }))}>
                        <div>
                            <p className="font-medium text-gray-900 group-hover:text-teal-700 transition-colors">Show Share Buttons</p>
                            <p className="text-sm text-gray-500">
                                {socialShare.enabled
                                    ? 'Share buttons are visible on article pages'
                                    : 'Share buttons are hidden'}
                            </p>
                        </div>
                        <button
                            type="button"
                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-600 focus:ring-offset-2 ${socialShare.enabled ? 'bg-teal-600' : 'bg-gray-200'}`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${socialShare.enabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Platform Selection */}
                    {socialShare.enabled && (
                        <div className="border-t border-gray-100 pt-6">
                            <h4 className="text-sm font-medium text-gray-900 mb-4">Active Platforms</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {['instagram', 'facebook', 'twitter', 'linkedin', 'whatsapp', 'telegram', 'copy_link'].map(platform => (
                                    <label key={platform} className="flex items-center gap-2 cursor-pointer p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={socialShare.platforms.includes(platform)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSocialShare(prev => ({ ...prev, platforms: [...prev.platforms, platform] }));
                                                } else {
                                                    setSocialShare(prev => ({ ...prev, platforms: prev.platforms.filter(p => p !== platform) }));
                                                }
                                            }}
                                            className="w-4 h-4 text-teal-600 rounded border-gray-300 focus:ring-teal-500"
                                        />
                                        <span className="text-sm text-gray-700 capitalize">{platform.replace('_', ' ')}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* WordPress Integration */}
            <WordPressSettingsCard />

            {/* Save Button */}
            <div className="flex items-center justify-between">
                <div>
                    {saved && (
                        <span className="text-green-600 text-sm font-medium flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4" />
                            Settings saved!
                        </span>
                    )}
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
                            Save All Settings
                        </>
                    )}
                </button>
            </div>

            <div className="card bg-blue-50 border-blue-100 p-6">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    Tips
                </h4>
                <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Disable moderation if you don't expect spam</li>
                    <li>• Include accurate pricing and features in product knowledge</li>
                    <li>• Keep product information up-to-date</li>
                </ul>
            </div>
        </div>
    );
}

function WordPressSettingsCard() {
    const [wpSettings, setWpSettings] = useState({ url: '', username: '', applicationPassword: '', defaultStatus: 'draft' });
    const [hasPassword, setHasPassword] = useState(false);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        fetch('/api/settings/wordpress')
            .then(res => res.json())
            .then(data => {
                setWpSettings(prev => ({
                    ...prev,
                    url: data.url || '',
                    username: data.username || '',
                    defaultStatus: data.defaultStatus || 'draft'
                }));
                setHasPassword(data.hasPassword);
            })
            .catch(() => showToast('Failed to load WP settings', 'error'))
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        try {
            const res = await fetch('/api/settings/wordpress', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(wpSettings)
            });
            if (res.ok) {
                showToast('WordPress settings saved', 'success');
                if (wpSettings.applicationPassword) setHasPassword(true);
            } else {
                showToast('Failed to save settings', 'error');
            }
        } catch (e) {
            showToast('Error saving settings', 'error');
        }
    };

    const handleTest = async () => {
        if (!wpSettings.url || !wpSettings.username) {
            showToast('URL and Username are required', 'error');
            return;
        }
        if (!wpSettings.applicationPassword && !hasPassword) {
            showToast('Application Password is required for testing', 'error');
            return;
        }

        setTesting(true);
        try {
            // Need password to test. If we have it in state, use it. 
            // If it's saved but not in state (hasPassword=true), we can't test without user re-entering it for security 
            // OR we'd need a backend endpoint that tests using stored credentials.
            // Our current backend /api/wordpress/test expects the password in the body.

            if (!wpSettings.applicationPassword) {
                showToast('Please enter the password again to test connection', 'info');
                setTesting(false);
                return;
            }

            const res = await fetch('/api/wordpress/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(wpSettings)
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showToast('Connection Successful! ✅', 'success');
            } else {
                showToast('Connection Failed: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (e) {
            showToast('Connection Error', 'error');
        } finally {
            setTesting(false);
        }
    };

    if (loading) return <div className="card p-6"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="card">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <div>
                    <h3 className="font-semibold text-gray-900">WordPress Integration</h3>
                    <p className="text-sm text-gray-500">Connect to your WordPress site to publish articles directly.</p>
                </div>
            </div>
            <div className="p-6 space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="label">WordPress Site URL</label>
                        <input
                            type="url"
                            value={wpSettings.url}
                            onChange={e => setWpSettings({ ...wpSettings, url: e.target.value })}
                            placeholder="https://your-wordpress-site.com"
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="label">Username</label>
                        <input
                            type="text"
                            value={wpSettings.username}
                            onChange={e => setWpSettings({ ...wpSettings, username: e.target.value })}
                            placeholder="admin"
                            className="input"
                        />
                    </div>
                </div>
                <div>
                    <label className="label">Application Password</label>
                    <div className="flex gap-2">
                        <input
                            type="password"
                            value={wpSettings.applicationPassword}
                            onChange={e => setWpSettings({ ...wpSettings, applicationPassword: e.target.value })}
                            placeholder={hasPassword ? "•••••••••••••••••••• (Saved)" : "Enter Application Password"}
                            className="input flex-1"
                        />
                        <button
                            onClick={handleTest}
                            disabled={testing}
                            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 font-medium flex items-center gap-2"
                        >
                            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 text-amber-500" />}
                            Test
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                        Get this from your WP Admin &gt; Users &gt; Profile &gt; Application Passwords.
                    </p>
                </div>
                <div className="flex justify-end pt-2">
                    <button onClick={handleSave} className="btn-primary flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save Credentials
                    </button>
                </div>
            </div>
        </div>
    );
}

import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { Image as ImageIcon, Link as LinkIcon, X, Loader2, Upload } from 'lucide-react';

export function SubmitModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');

    const [isFetchingUrl, setIsFetchingUrl] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchScreenshot = async () => {
        if (!url) return;
        setIsFetchingUrl(true);
        setError(null);
        try {
            const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false`);
            const data = await res.json();
            if (data.status === 'success' && data.data.screenshot?.url) {
                setThumbnailUrl(data.data.screenshot.url);
            } else {
                throw new Error('Could not generate screenshot automatically.');
            }
        } catch (err: any) {
            setError(err.message || 'Failed to fetch screenshot. Try uploading one manually.');
        } finally {
            setIsFetchingUrl(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);
        setError(null);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${user.id}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('thumbnails')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('thumbnails')
                .getPublicUrl(filePath);

            setThumbnailUrl(data.publicUrl);
        } catch (err: any) {
            setError(err.message || 'Failed to upload image.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);
        setError(null);

        try {
            const { error: submitError } = await supabase
                .from('projects')
                .insert([
                    {
                        user_id: user.id,
                        title,
                        description,
                        website_url: url,
                        thumbnail_url: thumbnailUrl || null,
                    }
                ]);

            if (submitError) throw submitError;

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to submit project.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm sm:p-0">
            <div className="bg-white rounded-[20px] shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                    <h3 className="text-xl font-bold text-gray-900">Submit a Project</h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl">
                            {error}
                        </div>
                    )}

                    <form id="project-form" onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">Project Title</label>
                            <input
                                id="title"
                                type="text"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="E.g. My Awesome Startup"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                            />
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1.5">Short Description</label>
                            <textarea
                                id="description"
                                required
                                rows={3}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What did you build and why?"
                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none"
                            />
                        </div>

                        <div>
                            <label htmlFor="url" className="block text-sm font-semibold text-gray-700 mb-1.5">Website URL</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <LinkIcon size={18} />
                                    </div>
                                    <input
                                        id="url"
                                        type="url"
                                        required
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://example.com"
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={fetchScreenshot}
                                    disabled={!url || isFetchingUrl}
                                    className="px-4 py-2.5 bg-blue-50 text-blue-600 rounded-xl text-sm font-semibold hover:bg-blue-100 transition-colors disabled:opacity-50 whitespace-nowrap"
                                >
                                    {isFetchingUrl ? <Loader2 size={18} className="animate-spin mx-auto" /> : 'Auto-fetch UI'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thumbnail</label>

                            {thumbnailUrl ? (
                                <div className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-video flex-shrink-0">
                                    <img src={thumbnailUrl} alt="Thumbnail preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                        <button
                                            type="button"
                                            onClick={() => setThumbnailUrl('')}
                                            className="bg-white/90 text-red-600 p-2 rounded-full hover:bg-white transition-colors shadow-lg"
                                        >
                                            <X size={20} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 hover:border-blue-300 transition-all cursor-pointer group"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {isUploading ? (
                                        <Loader2 size={32} className="mx-auto text-blue-500 animate-spin mb-3" />
                                    ) : (
                                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                            <ImageIcon size={24} />
                                        </div>
                                    )}
                                    <p className="text-sm font-medium text-gray-700">
                                        Click to upload a screenshot
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 mt-1 font-medium">PNG, JPG, limit 5MB</p>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileUpload}
                                    />
                                </div>
                            )}
                        </div>

                    </form>
                </div>

                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3 rounded-b-[20px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="project-form"
                        disabled={isSubmitting || isUploading || isFetchingUrl}
                        className="px-6 py-2.5 bg-[#0062FF] text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {isSubmitting ? 'Publishing...' : 'Publish Project'}
                    </button>
                </div>
            </div>
        </div>
    );
}

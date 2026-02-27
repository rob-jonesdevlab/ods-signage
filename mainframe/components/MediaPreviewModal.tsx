'use client';

import { useEffect } from 'react';

interface MediaPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    media: {
        id: string;
        name: string;
        type: 'image' | 'video' | 'url';
        url: string;
        duration: number;
        metadata: {
            originalName: string;
            mimeType: string;
            size: number;
            thumbnail?: string;
            uploadedAt: string;
        };
        created_at: string;
    } | null;
}

export default function MediaPreviewModal({ isOpen, onClose, media }: MediaPreviewModalProps) {
    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !media) return null;

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete "${media.name}"?`)) {
            // Delete logic will be handled by parent component
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={onClose}
        >
            {/* Modal Container */}
            <div
                className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[95vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-700">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-semibold text-white tracking-tight">{media.name}</h2>
                        <p className="text-slate-400 text-sm">Detailed preview</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors rounded-lg p-2 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                {/* Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto">
                    {/* Media Preview Section */}
                    <div className="p-6 pb-0">
                        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden group shadow-lg border border-slate-700">
                            {media.type === 'video' ? (
                                <>
                                    {/* Video Thumbnail / Player */}
                                    <div className="absolute inset-0 bg-cover bg-center opacity-80"
                                        style={{
                                            backgroundImage: media.metadata.thumbnail
                                                ? `url(http://localhost:3001${media.metadata.thumbnail})`
                                                : 'none'
                                        }}
                                    ></div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30"></div>

                                    {/* Big Play Button */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <button className="flex items-center justify-center w-16 h-16 rounded-full bg-white/20 hover:bg-blue-600 backdrop-blur-md text-white transition-all transform hover:scale-110 shadow-xl group-hover:bg-blue-600">
                                            <span className="material-symbols-outlined text-4xl fill-1">play_arrow</span>
                                        </button>
                                    </div>

                                    {/* Video Controls (Bottom) */}
                                    <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/90 to-transparent">
                                        {/* Progress Bar */}
                                        <div className="group/progress relative h-1 bg-white/30 rounded-full cursor-pointer mb-3 hover:h-2 transition-all">
                                            <div className="absolute h-full w-1/3 bg-blue-600 rounded-full"></div>
                                            <div className="absolute h-4 w-4 bg-white rounded-full shadow top-1/2 -translate-y-1/2 left-1/3 scale-0 group-hover/progress:scale-100 transition-transform"></div>
                                        </div>

                                        {/* Control Icons */}
                                        <div className="flex items-center justify-between text-white">
                                            <div className="flex items-center gap-4">
                                                <button className="hover:text-blue-400 transition-colors">
                                                    <span className="material-symbols-outlined fill-1">pause</span>
                                                </button>
                                                <div className="flex items-center gap-2 group/volume relative">
                                                    <button className="hover:text-blue-400 transition-colors">
                                                        <span className="material-symbols-outlined">volume_up</span>
                                                    </button>
                                                </div>
                                                <div className="text-xs font-medium tabular-nums tracking-wide opacity-90">
                                                    <span className="text-white">0:00</span>
                                                    <span className="text-slate-400 mx-1">/</span>
                                                    <span className="text-slate-400">{media.duration}s</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <button className="hover:text-blue-400 transition-colors">
                                                    <span className="material-symbols-outlined">settings</span>
                                                </button>
                                                <button className="hover:text-blue-400 transition-colors">
                                                    <span className="material-symbols-outlined">fullscreen</span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : media.type === 'image' ? (
                                <img
                                    src={media.url.startsWith('http') ? media.url : `http://localhost:3001${media.url}`}
                                    alt={media.name}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-800">
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-6xl text-blue-500 mb-4">link</span>
                                        <p className="text-white text-lg font-medium">{media.name}</p>
                                        <p className="text-slate-400 text-sm mt-2">{media.url}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="p-6">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">File Metadata</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0 bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                            {/* Type */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-6 border-b border-slate-700 md:border-r">
                                <span className="text-slate-400 text-sm">Type</span>
                                <div className="flex items-center gap-2 mt-1 sm:mt-0">
                                    <span className="material-symbols-outlined text-base text-blue-500">
                                        {media.type === 'video' ? 'videocam' : media.type === 'image' ? 'image' : 'link'}
                                    </span>
                                    <span className="text-white text-sm font-medium capitalize">{media.type}</span>
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-6 border-b border-slate-700">
                                <span className="text-slate-400 text-sm">Duration</span>
                                <span className="text-white text-sm font-medium mt-1 sm:mt-0">{media.duration}s</span>
                            </div>

                            {/* Size */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-6 border-b border-slate-700 md:border-r">
                                <span className="text-slate-400 text-sm">Size</span>
                                <span className="text-white text-sm font-medium mt-1 sm:mt-0">{formatFileSize(media.metadata.size)}</span>
                            </div>

                            {/* Uploaded */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-6 border-b border-slate-700">
                                <span className="text-slate-400 text-sm">Uploaded</span>
                                <span className="text-white text-sm font-medium mt-1 sm:mt-0">{formatDate(media.metadata.uploadedAt)}</span>
                            </div>

                            {/* Filename */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-6 border-b border-slate-700 md:border-b-0 md:border-r">
                                <span className="text-slate-400 text-sm">Filename</span>
                                <span className="text-white text-sm font-medium truncate max-w-[200px] mt-1 sm:mt-0" title={media.metadata.originalName}>
                                    {media.metadata.originalName}
                                </span>
                            </div>

                            {/* MIME Type */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-4 px-6">
                                <span className="text-slate-400 text-sm">MIME Type</span>
                                <span className="text-white text-sm font-medium mt-1 sm:mt-0">{media.metadata.mimeType}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between p-6 bg-slate-800/50 border-t border-slate-700 rounded-b-xl gap-4">
                    <button
                        onClick={handleDelete}
                        className="flex items-center justify-center gap-2 px-5 h-10 w-full sm:w-auto rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-sm font-semibold"
                    >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                        <span>Delete Media</span>
                    </button>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="px-5 h-10 w-full sm:w-auto rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600 border border-transparent transition-all text-sm font-medium shadow-sm"
                        >
                            Close
                        </button>
                        <button className="px-5 h-10 w-full sm:w-auto rounded-lg text-white bg-blue-600 hover:bg-blue-500 border border-transparent transition-all text-sm font-medium shadow-lg shadow-blue-600/20">
                            Edit Details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

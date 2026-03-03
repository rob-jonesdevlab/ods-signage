'use client';
import { API_URL } from '@/lib/api';
import { authenticatedFetch } from '@/lib/auth';

import { useState, useEffect } from 'react';

interface Content {
    id: string;
    name: string;
    type: 'image' | 'video' | 'url';
    url: string;
    duration: number;
    metadata: {
        size?: number;
        dimensions?: string;
    };
}

interface AddContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    playlistId: string;
    onContentAdded: () => void;
}

export default function AddContentModal({ isOpen, onClose, playlistId, onContentAdded }: AddContentModalProps) {
    const [allContent, setAllContent] = useState<Content[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'images' | 'folders' | 'urls' | 'videos'>('all');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isAdding, setIsAdding] = useState(false);

    // Fetch all content from library
    useEffect(() => {
        if (isOpen) {
            authenticatedFetch(`${API_URL}/api/content`)
                .then((res) => res.json())
                .then((data) => setAllContent(data))
                .catch((err) => console.error('Failed to fetch content:', err));
        }
    }, [isOpen]);

    // Filter content
    const filteredContent = allContent.filter((content) => {
        const matchesSearch = content.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter =
            filterType === 'all' ||
            (filterType === 'videos' && content.type === 'video') ||
            (filterType === 'images' && content.type === 'image') ||
            (filterType === 'urls' && content.type === 'url') ||
            (filterType === 'folders' && false); // Folders not implemented yet

        return matchesSearch && matchesFilter;
    });

    // Toggle selection
    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    // Add selected content to playlist
    const handleAddContent = async () => {
        if (selectedIds.size === 0) return;

        setIsAdding(true);
        try {
            // POST each content_id individually (server expects single content_id per request)
            const ids = Array.from(selectedIds);
            let allOk = true;
            for (const contentId of ids) {
                const response = await authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/content`, {
                    method: 'POST',
                    body: JSON.stringify({ content_id: contentId, display_order: 0 }),
                });
                if (!response.ok) allOk = false;
            }

            if (allOk) {
                setSelectedIds(new Set());
                setSearchQuery('');
                onContentAdded();
                onClose();
            }
        } catch (err) {
            console.error('Failed to add content:', err);
        } finally {
            setIsAdding(false);
        }
    };

    if (!isOpen) return null;

    const isVideo = (content: Content) => content.type === 'video' || content.url.includes('.mp4') || content.url.includes('.webm');

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-4">
            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white border-t sm:border border-gray-200 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col h-[85vh] sm:h-[80vh] overflow-hidden">
                {/* Header */}
                <div className="flex flex-col gap-4 p-5 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-500">add_circle</span>
                            Add Content
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-full hover:bg-gray-100"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex gap-3">
                        <div className="relative flex-1 group">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </span>
                            <input
                                className="w-full bg-white border border-gray-300 text-sm rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="Search library..."
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex gap-6 text-sm font-medium border-b border-gray-200 -mb-5 px-1">
                        <button
                            onClick={() => setFilterType('all')}
                            className={`pb-4 transition-colors ${filterType === 'all'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            All Content
                        </button>
                        <button
                            onClick={() => setFilterType('images')}
                            className={`pb-4 transition-colors ${filterType === 'images'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Images
                        </button>
                        <button
                            onClick={() => setFilterType('urls')}
                            className={`pb-4 transition-colors ${filterType === 'urls'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            URLs
                        </button>
                        <button
                            onClick={() => setFilterType('videos')}
                            className={`pb-4 transition-colors ${filterType === 'videos'
                                ? 'text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-500 hover:text-gray-900'
                                }`}
                        >
                            Videos
                        </button>
                    </div>
                </div>

                {/* Content Grid */}
                <div className="flex-1 overflow-y-auto p-4 bg-white">
                    <div className="grid grid-cols-2 gap-3 pb-20">
                        {filteredContent.map((content) => {
                            const isSelected = selectedIds.has(content.id);

                            return (
                                <div
                                    key={content.id}
                                    onClick={() => toggleSelection(content.id)}
                                    className={`group relative bg-white border rounded-lg overflow-hidden transition-all cursor-pointer ${isSelected
                                        ? 'border-blue-500 ring-2 ring-blue-500/30'
                                        : 'border-gray-200 hover:border-blue-500/50'
                                        }`}
                                >
                                    <div className="aspect-video relative bg-gray-100">
                                        {content.type === 'url' ? (
                                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-100 flex flex-col items-center justify-center gap-1">
                                                <span className="material-symbols-outlined text-2xl text-emerald-500">language</span>
                                                <span className="text-[9px] text-emerald-600 font-medium">Web URL</span>
                                            </div>
                                        ) : content.url.startsWith('http') ? (
                                            <img
                                                src={content.url}
                                                alt={content.name}
                                                className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 opacity-80 group-hover:opacity-100 transition-opacity" />
                                        )}

                                        {isVideo(content) && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 text-white">
                                                    <span className="material-symbols-outlined text-2xl">play_arrow</span>
                                                </div>
                                            </div>
                                        )}

                                        {content.duration && (
                                            <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                                                {content.duration}s
                                            </span>
                                        )}

                                        {/* Selection Indicator */}
                                        <div className="absolute top-2 right-2">
                                            <div
                                                className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected
                                                    ? 'bg-blue-500 text-white'
                                                    : 'bg-white/80 backdrop-blur-sm border border-gray-300 text-gray-500'
                                                    }`}
                                            >
                                                {isSelected ? (
                                                    <span className="material-symbols-outlined text-sm">check</span>
                                                ) : (
                                                    <span className="material-symbols-outlined text-sm">add</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-3">
                                        <h3 className="text-sm font-medium text-gray-900 truncate mb-1">{content.name}</h3>
                                        <div className="flex justify-between items-center text-[11px] text-gray-500">
                                            <span>{content.metadata?.size ? `${(content.metadata.size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}</span>
                                            <span className="flex items-center gap-1">
                                                <span className="material-symbols-outlined text-[12px]">
                                                    {content.type === 'video' ? 'videocam' : content.type === 'url' ? 'language' : 'image'}
                                                </span>
                                                {content.type === 'video' ? 'Video' : content.type === 'url' ? 'URL' : 'Image'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                    <div className="text-xs text-gray-500">
                        {selectedIds.size > 0 ? (
                            <span>
                                <span className="text-gray-900 font-medium">{selectedIds.size}</span> selected
                            </span>
                        ) : (
                            <span>Select content to add</span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="text-sm text-gray-700 hover:text-gray-900 font-medium px-4 py-2 rounded hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddContent}
                            disabled={selectedIds.size === 0 || isAdding}
                            className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isAdding ? 'Adding...' : `Add to Directory`}
                            <span className="material-symbols-outlined text-base">check</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

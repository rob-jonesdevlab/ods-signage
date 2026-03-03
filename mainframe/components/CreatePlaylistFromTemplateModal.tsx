'use client';

import { useState } from 'react';
import type { PlaylistTemplate } from './PlaylistTemplateTree';

interface CreatePlaylistFromTemplateModalProps {
    isOpen: boolean;
    template: PlaylistTemplate | null;
    onClose: () => void;
    onSubmit: (name: string) => void;
}

export default function CreatePlaylistFromTemplateModal({
    isOpen,
    template,
    onClose,
    onSubmit
}: CreatePlaylistFromTemplateModalProps) {
    const [name, setName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim());
            setName('');
            onClose();
        }
    };

    if (!isOpen || !template) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Create Playlist from Template</h2>

                {/* Template Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-500 text-2xl">folder</span>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900">{template.name}</div>
                            {template.description && (
                                <div className="text-sm text-gray-500 mt-1">{template.description}</div>
                            )}
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                <span>{template.contentCount || 0} items</span>
                                <span>{template.duration_per_item}s per item</span>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Playlist Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Morning Rotation - Week 1"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                            required
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This will create a new playlist with all content from the template
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors shadow-sm"
                        >
                            Create Playlist
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

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
            <div className="glass-card bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-6">Create Playlist from Template</h2>

                {/* Template Info */}
                <div className="mb-6 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-400 text-2xl">folder</span>
                        <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white">{template.name}</div>
                            {template.description && (
                                <div className="text-sm text-slate-400 mt-1">{template.description}</div>
                            )}
                            <div className="flex gap-4 mt-2 text-xs text-slate-500">
                                <span>{template.contentCount || 0} items</span>
                                <span>{template.duration_per_item}s per item</span>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Playlist Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Morning Rotation - Week 1"
                            className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">
                            This will create a new playlist with all content from the template
                        </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
                        >
                            Create Playlist
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

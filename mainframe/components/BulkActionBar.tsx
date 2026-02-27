'use client';

import { useEffect } from 'react';

interface BulkActionBarProps {
    selectedCount: number;
    totalCount: number;
    onSelectAll: () => void;
    onDeselectAll: () => void;
    onDelete: () => void;
    onMove?: () => void;
    onAddToPlaylist?: () => void;
    onExport?: () => void;
}

export default function BulkActionBar({
    selectedCount,
    totalCount,
    onSelectAll,
    onDeselectAll,
    onDelete,
    onMove,
    onAddToPlaylist,
    onExport,
}: BulkActionBarProps) {
    // Keyboard shortcut: Escape to deselect all
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedCount > 0) {
                onDeselectAll();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedCount, onDeselectAll]);

    if (selectedCount === 0) return null;

    const allSelected = selectedCount === totalCount;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-black/50 backdrop-blur-sm">
                <div className="flex items-center gap-4 px-6 py-4">
                    {/* Selection Info */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-[14px] fill-1">check</span>
                            </div>
                            <span className="text-sm font-medium text-white">
                                {selectedCount} selected
                            </span>
                        </div>
                        <div className="h-4 w-px bg-slate-700"></div>
                        <button
                            onClick={allSelected ? onDeselectAll : onSelectAll}
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            {allSelected ? 'Deselect all' : `Select all ${totalCount}`}
                        </button>
                    </div>

                    {/* Divider */}
                    <div className="h-8 w-px bg-slate-700"></div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Move */}
                        {onMove && (
                            <button
                                onClick={onMove}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-sm transition-all"
                                title="Move to folder"
                            >
                                <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                                <span className="hidden sm:inline">Move</span>
                            </button>
                        )}

                        {/* Add to Playlist */}
                        {onAddToPlaylist && (
                            <button
                                onClick={onAddToPlaylist}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-sm transition-all"
                                title="Add to playlist"
                            >
                                <span className="material-symbols-outlined text-[18px]">playlist_add</span>
                                <span className="hidden sm:inline">Add to Playlist</span>
                            </button>
                        )}

                        {/* Export */}
                        {onExport && (
                            <button
                                onClick={onExport}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg text-sm transition-all"
                                title="Export selected"
                            >
                                <span className="material-symbols-outlined text-[18px]">download</span>
                                <span className="hidden sm:inline">Export</span>
                            </button>
                        )}

                        {/* Delete */}
                        <button
                            onClick={onDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm transition-all shadow-lg shadow-red-600/20"
                            title="Delete selected"
                        >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    </div>

                    {/* Close */}
                    <button
                        onClick={onDeselectAll}
                        className="ml-2 p-2 text-slate-400 hover:text-white transition-colors"
                        title="Deselect all (Esc)"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Hint */}
                <div className="px-6 pb-3 pt-0">
                    <p className="text-xs text-slate-500">
                        <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px]">Shift</kbd>
                        {' + Click to select range • '}
                        <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px]">Esc</kbd>
                        {' to deselect all'}
                    </p>
                </div>
            </div>
        </div>
    );
}

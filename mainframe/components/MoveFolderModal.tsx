'use client';

import { useState } from 'react';

interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
    children: Folder[];
}

interface MoveFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderId: string;
    folderName: string;
    folders: Folder[];
    onMove: (folderId: string, newParentId: string | null) => Promise<void>;
}

export default function MoveFolderModal({
    isOpen,
    onClose,
    folderId,
    folderName,
    folders,
    onMove,
}: MoveFolderModalProps) {
    const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
    const [isMoving, setIsMoving] = useState(false);

    // Get all folder IDs that are descendants of the current folder (to prevent circular references)
    const getDescendantIds = (folder: Folder): string[] => {
        const ids = [folder.id];
        folder.children.forEach(child => {
            ids.push(...getDescendantIds(child));
        });
        return ids;
    };

    // Find the current folder in the tree
    const findFolder = (folders: Folder[], id: string): Folder | null => {
        for (const folder of folders) {
            if (folder.id === id) return folder;
            const found = findFolder(folder.children, id);
            if (found) return found;
        }
        return null;
    };

    const currentFolder = findFolder(folders, folderId);
    const excludedIds = currentFolder ? getDescendantIds(currentFolder) : [folderId];

    // Render folder options recursively
    const renderFolderOptions = (folders: Folder[], level = 0): JSX.Element[] => {
        const options: JSX.Element[] = [];

        folders.forEach(folder => {
            if (!excludedIds.includes(folder.id)) {
                options.push(
                    <option key={folder.id} value={folder.id}>
                        {'  '.repeat(level)}📁 {folder.name}
                    </option>
                );
                if (folder.children.length > 0) {
                    options.push(...renderFolderOptions(folder.children, level + 1));
                }
            }
        });

        return options;
    };

    const handleMove = async () => {
        setIsMoving(true);
        try {
            await onMove(folderId, selectedParentId);
            onClose();
        } catch (error) {
            console.error('Error moving folder:', error);
        } finally {
            setIsMoving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">drive_file_move</span>
                        Move Folder
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-6">
                        <p className="text-slate-300 mb-4">
                            Move <span className="font-semibold text-white">"{folderName}"</span> to:
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Destination Folder
                            </label>
                            <select
                                value={selectedParentId || ''}
                                onChange={(e) => setSelectedParentId(e.target.value || null)}
                                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">📂 Root (Top Level)</option>
                                {renderFolderOptions(folders)}
                            </select>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                            <p className="text-blue-200 text-xs">
                                💡 The folder and all its contents will be moved to the selected location.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            disabled={isMoving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleMove}
                            disabled={isMoving}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isMoving ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[18px]">
                                        progress_activity
                                    </span>
                                    Moving...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">check</span>
                                    Move Folder
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

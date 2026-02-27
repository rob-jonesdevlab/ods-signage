'use client';

import { useState } from 'react';

interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
}

interface NewFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreateFolder: (name: string, parentId: string | null) => Promise<void>;
    folders: Folder[];
    currentFolderId?: string | null;
}

export default function NewFolderModal({
    isOpen,
    onClose,
    onCreateFolder,
    folders,
    currentFolderId
}: NewFolderModalProps) {
    const [folderName, setFolderName] = useState('');
    const [parentId, setParentId] = useState<string | null>(currentFolderId || null);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!folderName.trim()) {
            setError('Folder name is required');
            return;
        }

        setIsCreating(true);
        setError('');

        try {
            await onCreateFolder(folderName.trim(), parentId);
            setFolderName('');
            setParentId(currentFolderId || null);
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to create folder');
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        if (!isCreating) {
            setFolderName('');
            setParentId(currentFolderId || null);
            setError('');
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Folder</h2>
                    <button
                        onClick={handleClose}
                        disabled={isCreating}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-slate-500">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Folder Name */}
                    <div>
                        <label htmlFor="folderName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Folder Name
                        </label>
                        <input
                            id="folderName"
                            type="text"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder="Enter folder name"
                            disabled={isCreating}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                            autoFocus
                        />
                    </div>

                    {/* Parent Folder */}
                    <div>
                        <label htmlFor="parentFolder" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Parent Folder (Optional)
                        </label>
                        <select
                            id="parentFolder"
                            value={parentId || ''}
                            onChange={(e) => setParentId(e.target.value || null)}
                            disabled={isCreating}
                            className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            <option value="">Root (No parent)</option>
                            {folders.map((folder) => (
                                <option key={folder.id} value={folder.id}>
                                    {folder.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isCreating}
                            className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating || !folderName.trim()}
                            className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isCreating ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
                                    Create Folder
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

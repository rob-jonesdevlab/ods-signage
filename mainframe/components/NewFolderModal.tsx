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
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-md mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">New Folder</h2>
                    <button
                        onClick={handleClose}
                        disabled={isCreating}
                        className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 text-gray-400 hover:text-gray-900"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Folder Name */}
                    <div>
                        <label htmlFor="folderName" className="block text-sm font-medium text-gray-700 mb-2">
                            Folder Name
                        </label>
                        <input
                            id="folderName"
                            type="text"
                            value={folderName}
                            onChange={(e) => setFolderName(e.target.value)}
                            placeholder="Enter folder name"
                            disabled={isCreating}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
                            autoFocus
                        />
                    </div>

                    {/* Parent Folder */}
                    <div>
                        <label htmlFor="parentFolder" className="block text-sm font-medium text-gray-700 mb-2">
                            Parent Folder (Optional)
                        </label>
                        <select
                            id="parentFolder"
                            value={parentId || ''}
                            onChange={(e) => setParentId(e.target.value || null)}
                            disabled={isCreating}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
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
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isCreating}
                            className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50 border border-gray-300"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating || !folderName.trim()}
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
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

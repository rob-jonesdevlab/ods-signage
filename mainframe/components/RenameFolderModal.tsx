'use client';

import { useState, useEffect } from 'react';

interface RenameFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderId: string;
    currentName: string;
    onRename: (folderId: string, newName: string) => Promise<void>;
}

export default function RenameFolderModal({
    isOpen,
    onClose,
    folderId,
    currentName,
    onRename,
}: RenameFolderModalProps) {
    const [newName, setNewName] = useState(currentName);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setNewName(currentName);
        }
    }, [isOpen, currentName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || newName === currentName) return;

        setIsSubmitting(true);
        try {
            await onRename(folderId, newName.trim());
            onClose();
        } catch (error) {
            console.error('Error renaming folder:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">edit</span>
                        Rename Folder
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Folder Name
                        </label>
                        <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Enter folder name"
                            autoFocus
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!newName.trim() || newName === currentName || isSubmitting}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[18px]">
                                        progress_activity
                                    </span>
                                    Renaming...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">check</span>
                                    Rename
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

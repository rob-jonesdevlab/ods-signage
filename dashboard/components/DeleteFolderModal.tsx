'use client';

import { useState } from 'react';

interface DeleteFolderModalProps {
    isOpen: boolean;
    onClose: () => void;
    folderId: string;
    folderName: string;
    itemCount: number;
    onDelete: (folderId: string) => Promise<void>;
}

export default function DeleteFolderModal({
    isOpen,
    onClose,
    folderId,
    folderName,
    itemCount,
    onDelete,
}: DeleteFolderModalProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(folderId);
            onClose();
        } catch (error) {
            console.error('Error deleting folder:', error);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md mx-4 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-red-500">delete</span>
                        Delete Folder
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
                            Are you sure you want to delete the folder <span className="font-semibold text-white">"{folderName}"</span>?
                        </p>
                        {itemCount > 0 && (
                            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <span className="material-symbols-outlined text-amber-500 text-[20px]">
                                        warning
                                    </span>
                                    <div>
                                        <p className="text-amber-200 text-sm font-medium mb-1">
                                            This folder contains {itemCount} item{itemCount !== 1 ? 's' : ''}
                                        </p>
                                        <p className="text-amber-300/80 text-xs">
                                            All items in this folder will also be deleted.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            disabled={isDeleting}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isDeleting ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin text-[18px]">
                                        progress_activity
                                    </span>
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    Delete Folder
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

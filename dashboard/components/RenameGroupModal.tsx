'use client';

import { useState, useEffect } from 'react';

interface RenameGroupModalProps {
    isOpen: boolean;
    groupId: string | null;
    currentName: string;
    onClose: () => void;
    onSubmit: (groupId: string, newName: string) => void;
}

export default function RenameGroupModal({ isOpen, groupId, currentName, onClose, onSubmit }: RenameGroupModalProps) {
    const [name, setName] = useState(currentName);

    useEffect(() => {
        setName(currentName);
    }, [currentName, isOpen]);

    if (!isOpen || !groupId) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && name !== currentName) {
            onSubmit(groupId, name.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">Rename Group</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-700 rounded transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">
                            Group Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500"
                            autoFocus
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                            disabled={!name.trim() || name === currentName}
                        >
                            Rename
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

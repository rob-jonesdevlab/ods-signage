'use client';

import { useState, useEffect } from 'react';

interface RenameTemplateModalProps {
    isOpen: boolean;
    templateId: string | null;
    currentName: string;
    onClose: () => void;
    onSubmit: (templateId: string, newName: string) => void;
}

export default function RenameTemplateModal({
    isOpen,
    templateId,
    currentName,
    onClose,
    onSubmit
}: RenameTemplateModalProps) {
    const [name, setName] = useState(currentName);

    useEffect(() => {
        setName(currentName);
    }, [currentName]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim() && templateId) {
            onSubmit(templateId, name.trim());
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-6">Rename Template</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Template Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter template name"
                            className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            required
                        />
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
                            Rename
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

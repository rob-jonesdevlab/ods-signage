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
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xl p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Rename Template</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Template Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter template name"
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                            required
                        />
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
                            Rename
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

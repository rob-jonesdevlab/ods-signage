'use client';

import { useState } from 'react';

interface NewTemplateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string, description: string, durationPerItem: number) => void;
}

export default function NewTemplateModal({ isOpen, onClose, onSubmit }: NewTemplateModalProps) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [durationPerItem, setDurationPerItem] = useState(10);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSubmit(name.trim(), description.trim(), durationPerItem);
            setName('');
            setDescription('');
            setDurationPerItem(10);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 w-full max-w-md">
                <h2 className="text-2xl font-bold text-white mb-6">New Template</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Template Name *
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Morning Loop"
                            className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Morning content rotation"
                            rows={3}
                            className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Duration Per Item (seconds)
                        </label>
                        <input
                            type="number"
                            value={durationPerItem}
                            onChange={(e) => setDurationPerItem(parseInt(e.target.value) || 10)}
                            min="1"
                            max="300"
                            className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-slate-500 mt-1">How long each content item displays (1-300 seconds)</p>
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
                            Create Template
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

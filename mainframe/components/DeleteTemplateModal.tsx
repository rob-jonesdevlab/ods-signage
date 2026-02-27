'use client';

interface DeleteTemplateModalProps {
    isOpen: boolean;
    templateId: string | null;
    templateName: string;
    onClose: () => void;
    onConfirm: (templateId: string) => void;
}

export default function DeleteTemplateModal({
    isOpen,
    templateId,
    templateName,
    onClose,
    onConfirm
}: DeleteTemplateModalProps) {
    const handleConfirm = () => {
        if (templateId) {
            onConfirm(templateId);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-card bg-slate-800/95 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 w-full max-w-md">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-red-400 text-2xl">warning</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">Delete Template</h2>
                        <p className="text-slate-300">
                            Are you sure you want to delete <span className="font-semibold text-white">"{templateName}"</span>?
                        </p>
                        <p className="text-sm text-slate-400 mt-2">
                            This action cannot be undone. Existing playlists created from this template will not be affected.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-red-500/20"
                    >
                        Delete Template
                    </button>
                </div>
            </div>
        </div>
    );
}

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
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xl p-6 w-full max-w-md">
                <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                        <span className="material-symbols-outlined text-red-500 text-2xl">warning</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Template</h2>
                        <p className="text-gray-600">
                            Are you sure you want to delete <span className="font-semibold text-gray-900">&quot;{templateName}&quot;</span>?
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            This action cannot be undone. Existing playlists created from this template will not be affected.
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors border border-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                        Delete Template
                    </button>
                </div>
            </div>
        </div>
    );
}

'use client';

interface DeleteGroupModalProps {
    isOpen: boolean;
    groupId: string | null;
    groupName: string;
    playerCount: number;
    onClose: () => void;
    onConfirm: (groupId: string) => void;
}

export default function DeleteGroupModal({
    isOpen,
    groupId,
    groupName,
    playerCount,
    onClose,
    onConfirm
}: DeleteGroupModalProps) {
    if (!isOpen || !groupId) return null;

    const handleConfirm = () => {
        onConfirm(groupId);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-50 rounded-lg">
                        <span className="material-symbols-outlined text-red-500 text-[24px]">warning</span>
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900">Delete Group</h2>
                </div>

                <p className="text-gray-600 mb-4">
                    Are you sure you want to delete <span className="font-semibold text-gray-900">{groupName}</span>?
                </p>

                {playerCount > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-amber-700">
                            <span className="font-semibold">{playerCount} player{playerCount !== 1 ? 's' : ''}</span> will be moved to &quot;All Players&quot;.
                        </p>
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors border border-gray-300"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors shadow-sm"
                    >
                        Delete Group
                    </button>
                </div>
            </div>
        </div>
    );
}

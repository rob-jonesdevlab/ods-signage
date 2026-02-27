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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
            <div className="glass-card p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-3 bg-red-500/20 rounded-lg">
                        <span className="material-symbols-outlined text-red-500 text-[24px]">warning</span>
                    </div>
                    <h2 className="text-xl font-semibold">Delete Group</h2>
                </div>

                <p className="text-slate-300 mb-4">
                    Are you sure you want to delete <span className="font-semibold text-white">{groupName}</span>?
                </p>

                {playerCount > 0 && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-4">
                        <p className="text-sm text-yellow-200">
                            <span className="font-semibold">{playerCount} player{playerCount !== 1 ? 's' : ''}</span> will be moved to "All Players".
                        </p>
                    </div>
                )}

                <div className="flex gap-3 pt-4">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                    >
                        Delete Group
                    </button>
                </div>
            </div>
        </div>
    );
}

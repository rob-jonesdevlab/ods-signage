'use client';

import { useEffect, useRef } from 'react';

interface GroupContextMenuProps {
    groupId: string | null;
    position: { x: number; y: number };
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
    onDeploy: () => void;
}

export default function GroupContextMenu({
    groupId,
    position,
    onClose,
    onRename,
    onDelete,
    onDeploy
}: GroupContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    if (!groupId) return null;

    return (
        <div
            ref={menuRef}
            className="fixed z-50 glass-card py-2 min-w-[180px] shadow-xl"
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
        >
            <button
                onClick={() => {
                    onDeploy();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px] text-blue-400">publish</span>
                <span>Deploy Playlist</span>
            </button>

            <button
                onClick={() => {
                    onRename();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                <span>Rename</span>
            </button>

            <div className="h-px bg-slate-700 my-1" />

            <button
                onClick={() => {
                    onDelete();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left hover:bg-red-500/20 text-red-400 transition-colors flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span>Delete Group</span>
            </button>
        </div>
    );
}

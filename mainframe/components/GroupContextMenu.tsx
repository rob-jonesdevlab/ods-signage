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
            className="fixed z-50 bg-white rounded-lg border border-gray-200 shadow-xl py-2 min-w-[180px]"
            style={{ left: `${position.x}px`, top: `${position.y}px` }}
        >
            <button
                onClick={() => {
                    onDeploy();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2 text-gray-700"
            >
                <span className="material-symbols-outlined text-[18px] text-blue-500">publish</span>
                <span>Deploy Playlist</span>
            </button>

            <button
                onClick={() => {
                    onRename();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 transition-colors flex items-center gap-2 text-gray-700"
            >
                <span className="material-symbols-outlined text-[18px] text-gray-500">edit</span>
                <span>Rename</span>
            </button>

            <div className="h-px bg-gray-200 my-1" />

            <button
                onClick={() => {
                    onDelete();
                    onClose();
                }}
                className="w-full px-4 py-2 text-left hover:bg-red-50 text-red-500 transition-colors flex items-center gap-2"
            >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                <span>Delete Group</span>
            </button>
        </div>
    );
}

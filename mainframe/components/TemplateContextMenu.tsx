'use client';

import { useEffect, useRef } from 'react';

interface TemplateContextMenuProps {
    templateId: string;
    position: { x: number; y: number };
    onClose: () => void;
    onCreatePlaylist: () => void;
    onRename: () => void;
    onDelete: () => void;
}

export default function TemplateContextMenu({
    templateId,
    position,
    onClose,
    onCreatePlaylist,
    onRename,
    onDelete
}: TemplateContextMenuProps) {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [onClose]);

    return (
        <div
            ref={menuRef}
            className="fixed z-50 w-56 bg-white rounded-lg border border-gray-200 shadow-xl overflow-hidden"
            style={{
                top: `${position.y}px`,
                left: `${position.x}px`
            }}
        >
            <button
                onClick={() => {
                    onCreatePlaylist();
                    onClose();
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left"
            >
                <span className="material-symbols-outlined text-blue-500 text-[20px]">playlist_add</span>
                <span className="text-sm font-medium text-gray-700">Create Playlist</span>
            </button>

            <div className="h-px bg-gray-200" />

            <button
                onClick={() => {
                    onRename();
                    onClose();
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 transition-colors text-left"
            >
                <span className="material-symbols-outlined text-gray-500 text-[20px]">edit</span>
                <span className="text-sm font-medium text-gray-700">Rename</span>
            </button>

            <button
                onClick={() => {
                    onDelete();
                    onClose();
                }}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-red-50 transition-colors text-left"
            >
                <span className="material-symbols-outlined text-red-500 text-[20px]">delete</span>
                <span className="text-sm font-medium text-red-500">Delete</span>
            </button>
        </div>
    );
}

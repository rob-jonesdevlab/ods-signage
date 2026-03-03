'use client';

import { useEffect, useRef } from 'react';

interface FolderContextMenuProps {
    x: number;
    y: number;
    isSystemFolder?: boolean;
    onClose: () => void;
    onRename: () => void;
    onDelete: () => void;
    onMove: () => void;
    onNewSubfolder: () => void;
}

export default function FolderContextMenu({
    x,
    y,
    isSystemFolder = false,
    onClose,
    onRename,
    onDelete,
    onMove,
    onNewSubfolder,
}: FolderContextMenuProps) {
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

    const allMenuItems = [
        {
            icon: 'edit',
            label: 'Rename Folder',
            onClick: () => {
                onRename();
                onClose();
            },
            hideForSystem: true,
        },
        {
            icon: 'create_new_folder',
            label: 'New Subfolder',
            onClick: () => {
                onNewSubfolder();
                onClose();
            },
            hideForSystem: false,
        },
        {
            icon: 'drive_file_move',
            label: 'Move Folder',
            onClick: () => {
                onMove();
                onClose();
            },
            hideForSystem: true,
        },
        {
            icon: 'delete',
            label: 'Delete Folder',
            onClick: () => {
                onDelete();
                onClose();
            },
            danger: true,
            hideForSystem: true,
        },
    ];

    // Filter out items that should be hidden for system folders
    const menuItems = allMenuItems.filter(item => !(isSystemFolder && item.hideForSystem));

    return (
        <div
            ref={menuRef}
            className="fixed z-50 min-w-[200px] bg-white border border-gray-200 rounded-lg shadow-xl"
            style={{
                left: `${x}px`,
                top: `${y}px`,
            }}
        >
            <div className="py-1">
                {menuItems.map((item, index) => (
                    <button
                        key={index}
                        onClick={item.onClick}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${item.danger
                            ? 'text-red-500 hover:bg-red-50'
                            : 'text-gray-700 hover:bg-gray-100'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[18px]">
                            {item.icon}
                        </span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

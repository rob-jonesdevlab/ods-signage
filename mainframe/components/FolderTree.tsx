'use client';

import { useState } from 'react';

interface Folder {
    id: string;
    name: string;
    parent_id: string | null;
    itemCount: number;
    children: Folder[];
}

interface FolderTreeProps {
    folders: Folder[];
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
    onContextMenu?: (folderId: string, event: React.MouseEvent) => void;
    onFolderDrop?: (folderId: string) => void;
    dragOverFolder?: string | null;
    setDragOverFolder?: (folderId: string | null) => void;
}

interface FolderNodeProps {
    folder: Folder;
    level: number;
    selectedFolderId: string | null;
    onSelectFolder: (folderId: string | null) => void;
    onContextMenu?: (folderId: string, event: React.MouseEvent) => void;
    onFolderDrop?: (folderId: string) => void;
    dragOverFolder?: string | null;
    setDragOverFolder?: (folderId: string | null) => void;
}

function FolderNode({ folder, level, selectedFolderId, onSelectFolder, onContextMenu, onFolderDrop, dragOverFolder, setDragOverFolder }: FolderNodeProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;
    const isDragOver = dragOverFolder === folder.id;

    const handleClick = () => {
        onSelectFolder(folder.id);
    };

    const handleToggle = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onContextMenu) {
            onContextMenu(folder.id, e);
        }
    };

    // Drag & Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Allow drop
        e.stopPropagation();
        if (setDragOverFolder) {
            setDragOverFolder(folder.id);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.stopPropagation();
        if (setDragOverFolder) {
            setDragOverFolder(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onFolderDrop) {
            onFolderDrop(folder.id);
        }
        if (setDragOverFolder) {
            setDragOverFolder(null);
        }
    };

    return (
        <div>
            <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${isDragOver
                    ? 'bg-blue-500/20 border-2 border-blue-500 scale-105'
                    : isSelected
                        ? 'bg-blue-500/20 text-blue-500 border-2 border-transparent'
                        : 'hover:bg-slate-800 text-slate-300 border-2 border-transparent'
                    }`}
                style={{ paddingLeft: `${level * 16 + 12}px` }}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {hasChildren && (
                    <button
                        onClick={handleToggle}
                        className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                    >
                        <span className={`material-symbols-outlined text-[16px] transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                            chevron_right
                        </span>
                    </button>
                )}
                {!hasChildren && <div className="w-5" />}

                <span className="material-symbols-outlined text-[18px]">
                    {isExpanded && hasChildren ? 'folder_open' : 'folder'}
                </span>

                <span className="flex-1 text-sm font-medium truncate">{folder.name}</span>

                {folder.itemCount > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                        {folder.itemCount}
                    </span>
                )}
            </div>

            {hasChildren && isExpanded && (
                <div>
                    {folder.children.map((child) => (
                        <FolderNode
                            key={child.id}
                            folder={child}
                            level={level + 1}
                            selectedFolderId={selectedFolderId}
                            onSelectFolder={onSelectFolder}
                            onContextMenu={onContextMenu}
                            onFolderDrop={onFolderDrop}
                            dragOverFolder={dragOverFolder}
                            setDragOverFolder={setDragOverFolder}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function FolderTree({ folders, selectedFolderId, onSelectFolder, onContextMenu, onFolderDrop, dragOverFolder, setDragOverFolder }: FolderTreeProps) {
    return (
        <div className="flex flex-col gap-1">
            {/* All Content option */}
            <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedFolderId === null
                    ? 'bg-blue-500/20 text-blue-500'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                onClick={() => onSelectFolder(null)}
            >
                <span className="material-symbols-outlined text-[18px]">home</span>
                <span className="flex-1 text-sm font-medium">All Content</span>
            </div>

            {/* Folder tree */}
            {folders.map((folder) => (
                <FolderNode
                    key={folder.id}
                    folder={folder}
                    level={0}
                    selectedFolderId={selectedFolderId}
                    onSelectFolder={onSelectFolder}
                    onContextMenu={onContextMenu}
                    onFolderDrop={onFolderDrop}
                    dragOverFolder={dragOverFolder}
                    setDragOverFolder={setDragOverFolder}
                />
            ))}
        </div>
    );
}

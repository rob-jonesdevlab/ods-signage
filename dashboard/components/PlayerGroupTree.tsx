'use client';

import { useState } from 'react';

export interface PlayerGroup {
    id: string;
    name: string;
    description?: string;
    location?: string;
    playerCount: number;
    organization_id: string;
}

interface PlayerGroupTreeProps {
    groups: PlayerGroup[];
    selectedGroupId: string | null;
    onSelectGroup: (groupId: string | null) => void;
    onContextMenu?: (groupId: string, event: React.MouseEvent) => void;
    onGroupDrop?: (groupId: string) => void;
    dragOverGroup?: string | null;
    setDragOverGroup?: (groupId: string | null) => void;
}

interface GroupNodeProps {
    group: PlayerGroup;
    selectedGroupId: string | null;
    onSelectGroup: (groupId: string | null) => void;
    onContextMenu?: (groupId: string, event: React.MouseEvent) => void;
    onGroupDrop?: (groupId: string) => void;
    dragOverGroup?: string | null;
    setDragOverGroup?: (groupId: string | null) => void;
}

function GroupNode({
    group,
    selectedGroupId,
    onSelectGroup,
    onContextMenu,
    onGroupDrop,
    dragOverGroup,
    setDragOverGroup
}: GroupNodeProps) {
    const isSelected = selectedGroupId === group.id;
    const isDragOver = dragOverGroup === group.id;

    const handleClick = () => {
        onSelectGroup(group.id);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (onContextMenu) {
            onContextMenu(group.id, e);
        }
    };

    // Drag & Drop handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Allow drop
        e.stopPropagation();
        if (setDragOverGroup) {
            setDragOverGroup(group.id);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.stopPropagation();
        if (setDragOverGroup) {
            setDragOverGroup(null);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (onGroupDrop) {
            onGroupDrop(group.id);
        }
        if (setDragOverGroup) {
            setDragOverGroup(null);
        }
    };

    return (
        <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${isDragOver
                    ? 'bg-blue-500/20 border-2 border-blue-500 scale-105'
                    : isSelected
                        ? 'bg-blue-500/20 text-blue-500 border-2 border-transparent'
                        : 'hover:bg-slate-800 text-slate-300 border-2 border-transparent'
                }`}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <span className="material-symbols-outlined text-[18px]">
                {group.location ? 'location_on' : 'workspaces'}
            </span>

            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{group.name}</div>
                {group.location && (
                    <div className="text-xs text-slate-500 truncate">{group.location}</div>
                )}
            </div>

            {group.playerCount > 0 && (
                <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                    {group.playerCount}
                </span>
            )}
        </div>
    );
}

export default function PlayerGroupTree({
    groups,
    selectedGroupId,
    onSelectGroup,
    onContextMenu,
    onGroupDrop,
    dragOverGroup,
    setDragOverGroup
}: PlayerGroupTreeProps) {
    return (
        <div className="flex flex-col gap-1">
            {/* All Players option */}
            <div
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${selectedGroupId === null
                        ? 'bg-blue-500/20 text-blue-500'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                onClick={() => onSelectGroup(null)}
            >
                <span className="material-symbols-outlined text-[18px]">devices</span>
                <span className="flex-1 text-sm font-medium">All Players</span>
            </div>

            {/* Group list */}
            {groups.map((group) => (
                <GroupNode
                    key={group.id}
                    group={group}
                    selectedGroupId={selectedGroupId}
                    onSelectGroup={onSelectGroup}
                    onContextMenu={onContextMenu}
                    onGroupDrop={onGroupDrop}
                    dragOverGroup={dragOverGroup}
                    setDragOverGroup={setDragOverGroup}
                />
            ))}
        </div>
    );
}

'use client';

import { useState } from 'react';

export interface PlaylistTemplate {
    id: string;
    name: string;
    description: string;
    content_items: string[];
    duration_per_item: number;
    contentCount?: number;
}

interface PlaylistTemplateTreeProps {
    templates: PlaylistTemplate[];
    selectedTemplateId: string | null;
    onSelectTemplate: (id: string | null) => void;
    onContextMenu: (templateId: string, event: React.MouseEvent) => void;
}

export default function PlaylistTemplateTree({
    templates,
    selectedTemplateId,
    onSelectTemplate,
    onContextMenu
}: PlaylistTemplateTreeProps) {
    const [hoveredId, setHoveredId] = useState<string | null>(null);

    const handleClick = (templateId: string) => {
        if (selectedTemplateId === templateId) {
            onSelectTemplate(null); // Deselect if clicking the same template
        } else {
            onSelectTemplate(templateId);
        }
    };

    const handleContextMenu = (e: React.MouseEvent, templateId: string) => {
        e.preventDefault();
        onContextMenu(templateId, e);
    };

    return (
        <div className="space-y-1">
            {/* All Templates */}
            <button
                onClick={() => onSelectTemplate(null)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${selectedTemplateId === null
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
            >
                <span className="material-symbols-outlined text-[20px]">folder_open</span>
                <span className="flex-1 text-left text-sm font-medium">All Templates</span>
                <span className="text-xs text-slate-400">{templates.length}</span>
            </button>

            {/* Template List */}
            {templates.map((template) => (
                <button
                    key={template.id}
                    onClick={() => handleClick(template.id)}
                    onContextMenu={(e) => handleContextMenu(e, template.id)}
                    onMouseEnter={() => setHoveredId(template.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${selectedTemplateId === template.id
                            ? 'bg-blue-600 text-white'
                            : hoveredId === template.id
                                ? 'bg-slate-700/50 text-white'
                                : 'text-slate-300 hover:bg-slate-700/30'
                        }`}
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {selectedTemplateId === template.id ? 'folder_open' : 'folder'}
                    </span>
                    <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-medium truncate">{template.name}</div>
                        {template.description && (
                            <div className="text-xs text-slate-400 truncate">{template.description}</div>
                        )}
                    </div>
                    <span className="text-xs text-slate-400">{template.contentCount || 0}</span>
                </button>
            ))}

            {/* Empty State */}
            {templates.length === 0 && (
                <div className="px-3 py-8 text-center text-slate-500 text-sm">
                    <span className="material-symbols-outlined text-4xl mb-2 block">folder_off</span>
                    No templates yet
                </div>
            )}
        </div>
    );
}

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
                    ? 'bg-blue-500/20 text-blue-500'
                    : 'text-gray-700 hover:bg-gray-100'
                    }`}
            >
                <span className="material-symbols-outlined text-[20px]">folder_open</span>
                <span className="flex-1 text-left text-sm font-medium">All Templates</span>
                <span className="text-xs text-gray-500">{templates.length}</span>
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
                        ? 'bg-blue-500/20 text-blue-500'
                        : hoveredId === template.id
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                >
                    <span className="material-symbols-outlined text-[20px]">
                        {selectedTemplateId === template.id ? 'folder_open' : 'folder'}
                    </span>
                    <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-medium truncate">{template.name}</div>
                        {template.description && (
                            <div className="text-xs text-gray-500 truncate">{template.description}</div>
                        )}
                    </div>
                    <span className="text-xs text-gray-500">{template.contentCount || 0}</span>
                </button>
            ))}

            {/* Empty State */}
            {templates.length === 0 && (
                <div className="px-3 py-8 text-center text-gray-500 text-sm">
                    <span className="material-symbols-outlined text-4xl mb-2 block">folder_off</span>
                    No templates yet
                </div>
            )}
        </div>
    );
}

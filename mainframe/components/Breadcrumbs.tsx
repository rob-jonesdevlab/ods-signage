'use client';

interface BreadcrumbSegment {
    id: string | null;
    name: string;
}

interface BreadcrumbsProps {
    path: BreadcrumbSegment[];
    onNavigate: (folderId: string | null) => void;
}

export default function Breadcrumbs({ path, onNavigate }: BreadcrumbsProps) {
    if (path.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center gap-2 text-sm">
            {path.map((segment, index) => (
                <div key={segment.id || 'root'} className="flex items-center gap-2">
                    <button
                        onClick={() => onNavigate(segment.id)}
                        className={`transition-colors ${index === path.length - 1
                            ? 'text-gray-900 font-medium'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        {segment.name}
                    </button>
                    {index < path.length - 1 && (
                        <span className="material-symbols-outlined text-[16px] text-gray-400">
                            chevron_right
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

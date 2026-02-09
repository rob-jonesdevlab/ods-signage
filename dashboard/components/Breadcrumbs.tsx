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
                                ? 'text-slate-900 dark:text-white font-medium'
                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                    >
                        {segment.name}
                    </button>
                    {index < path.length - 1 && (
                        <span className="material-symbols-outlined text-[16px] text-slate-400">
                            chevron_right
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}

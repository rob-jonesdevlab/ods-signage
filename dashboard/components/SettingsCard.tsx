import { ReactNode } from 'react';

interface SettingsCardProps {
    title?: string;
    description?: string;
    badge?: {
        text: string;
        variant: 'success' | 'warning' | 'info' | 'danger';
    };
    children: ReactNode;
    className?: string;
    noPadding?: boolean;
}

const badgeStyles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function SettingsCard({
    title,
    description,
    badge,
    children,
    className = '',
    noPadding = false,
}: SettingsCardProps) {
    return (
        <div
            className={`bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden ${className}`}
        >
            {/* Header (if title or badge provided) */}
            {(title || badge) && (
                <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
                        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
                    </div>
                    {badge && (
                        <div
                            className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1 ${badgeStyles[badge.variant]
                                }`}
                        >
                            {badge.text}
                        </div>
                    )}
                </div>
            )}

            {/* Content */}
            <div className={noPadding ? '' : 'p-6 md:p-8'}>{children}</div>
        </div>
    );
}

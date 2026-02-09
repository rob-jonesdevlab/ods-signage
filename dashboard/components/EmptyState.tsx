interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    actionLabel: string;
    onAction: () => void;
    showSecondaryActions?: boolean;
}

export default function EmptyState({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    showSecondaryActions = false
}: EmptyStateProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] text-center p-8 relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/20 backdrop-blur-sm">
            {/* Decorative Background Glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[500px] h-[500px] bg-blue-600/10 dark:bg-blue-600/5 rounded-full blur-[100px] opacity-50"></div>
                <div className="w-[300px] h-[300px] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[80px] absolute translate-y-10 opacity-40"></div>
            </div>

            {/* Icon Container with specific glow */}
            <div className="relative z-10 mb-8 group/icon">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/30 to-purple-500/30 blur-2xl rounded-full opacity-60 group-hover/icon:opacity-80 transition-opacity duration-500"></div>
                <div className="relative bg-white dark:bg-slate-950 p-6 rounded-3xl shadow-xl shadow-blue-600/5 ring-1 ring-slate-200 dark:ring-slate-800">
                    <span className="material-symbols-outlined text-[64px] text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-500 fill-1">
                        {icon}
                    </span>
                </div>
            </div>

            {/* Text Content */}
            <div className="relative z-10 max-w-md mx-auto space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
                <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                    {description}
                </p>
            </div>

            {/* Primary CTA */}
            <div className="relative z-10 mt-10">
                <button
                    onClick={onAction}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-lg shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>{actionLabel}</span>
                </button>
            </div>

            {/* Secondary Actions */}
            {showSecondaryActions && (
                <div className="relative z-10 mt-12 flex items-center gap-6 text-sm text-slate-500 dark:text-slate-500">
                    <a
                        href="#"
                        className="hover:text-blue-400 transition-colors flex items-center gap-1"
                        onClick={(e) => e.preventDefault()}
                    >
                        <span className="material-symbols-outlined text-[16px]">menu_book</span>
                        Read Documentation
                    </a>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    <a
                        href="#"
                        className="hover:text-blue-400 transition-colors flex items-center gap-1"
                        onClick={(e) => e.preventDefault()}
                    >
                        <span className="material-symbols-outlined text-[16px]">play_circle</span>
                        Watch Tutorial
                    </a>
                </div>
            )}
        </div>
    );
}

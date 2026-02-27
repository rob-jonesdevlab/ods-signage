interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12'
    };

    return (
        <div className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size]} ${className}`} role="status">
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
                Loading...
            </span>
        </div>
    );
}

interface LoadingStateProps {
    message?: string;
    fullScreen?: boolean;
}

export function LoadingState({ message = 'Loading...', fullScreen = false }: LoadingStateProps) {
    const containerClass = fullScreen
        ? 'min-h-screen flex items-center justify-center'
        : 'flex items-center justify-center py-12';

    return (
        <div className={containerClass}>
            <div className="text-center">
                <LoadingSpinner size="lg" className="text-blue-500 mx-auto mb-4" />
                <p className="text-slate-400">{message}</p>
            </div>
        </div>
    );
}

interface LoadingSkeletonProps {
    count?: number;
    className?: string;
}

export function LoadingSkeleton({ count = 1, className = '' }: LoadingSkeletonProps) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`animate-pulse bg-slate-700/50 rounded ${className}`}
                />
            ))}
        </>
    );
}

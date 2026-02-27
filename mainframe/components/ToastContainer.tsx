'use client';

import Toast, { ToastProps } from './Toast';

interface ToastContainerProps {
    toasts: Omit<ToastProps, 'onClose'>[];
    onClose: (id: string) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    // Limit to 5 toasts max
    const visibleToasts = toasts.slice(0, 5);

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
            {visibleToasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast {...toast} onClose={onClose} />
                </div>
            ))}
        </div>
    );
}

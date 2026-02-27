'use client';

import { useEffect, useState } from 'react';

export interface ToastProps {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}

export default function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        // Progress bar animation
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
            setProgress(remaining);
        }, 50);

        // Auto-dismiss timer
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            onClose(id);
        }, 200); // Match exit animation duration
    };

    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    const colors = {
        success: {
            bg: 'bg-emerald-500',
            icon: 'text-emerald-500',
            progress: 'bg-emerald-400'
        },
        error: {
            bg: 'bg-red-500',
            icon: 'text-red-500',
            progress: 'bg-red-400'
        },
        warning: {
            bg: 'bg-amber-500',
            icon: 'text-amber-500',
            progress: 'bg-amber-400'
        },
        info: {
            bg: 'bg-blue-500',
            icon: 'text-blue-500',
            progress: 'bg-blue-400'
        }
    };

    return (
        <div
            className={`
                relative w-[360px] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden
                transition-all duration-200 ease-out
                ${isExiting ? 'translate-x-[400px] opacity-0' : 'translate-x-0 opacity-100'}
            `}
        >
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-slate-700">
                <div
                    className={`h-full ${colors[type].progress} transition-all duration-50 ease-linear`}
                    style={{ width: `${progress}%` }}
                ></div>
            </div>

            {/* Content */}
            <div className="p-4 pt-5 flex gap-3">
                {/* Icon */}
                <div className={`flex-shrink-0 ${colors[type].icon}`}>
                    <span className="material-symbols-outlined text-2xl fill-1">{icons[type]}</span>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-white mb-1">{title}</h4>
                    <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
                </div>

                {/* Close Button */}
                <button
                    onClick={handleClose}
                    className="flex-shrink-0 text-slate-400 hover:text-white transition-colors p-1 -mt-1 -mr-1"
                >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>
        </div>
    );
}

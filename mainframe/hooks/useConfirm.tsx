'use client';

import { useState, useCallback, useRef } from 'react';

interface ConfirmOptions {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'default';
    icon?: string;
}

interface ConfirmState extends ConfirmOptions {
    isOpen: boolean;
}

export function useConfirm() {
    const [state, setState] = useState<ConfirmState>({
        isOpen: false,
        title: '',
        message: '',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        variant: 'default',
        icon: 'help',
    });

    const resolveRef = useRef<((value: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise<boolean>((resolve) => {
            resolveRef.current = resolve;
            setState({
                isOpen: true,
                title: options.title,
                message: options.message,
                confirmLabel: options.confirmLabel || 'Confirm',
                cancelLabel: options.cancelLabel || 'Cancel',
                variant: options.variant || 'default',
                icon: options.icon || (options.variant === 'danger' ? 'warning' : 'help'),
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        setState((s) => ({ ...s, isOpen: false }));
        resolveRef.current?.(true);
        resolveRef.current = null;
    }, []);

    const handleCancel = useCallback(() => {
        setState((s) => ({ ...s, isOpen: false }));
        resolveRef.current?.(false);
        resolveRef.current = null;
    }, []);

    const ConfirmDialog = state.isOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleCancel}></div>
            <div className="relative w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-2xl p-6">
                <div className="flex items-start gap-4 mb-6">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${state.variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                        <span className="material-symbols-outlined text-xl">{state.icon}</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">{state.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{state.message}</p>
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3">
                    <button
                        onClick={handleCancel}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 border border-gray-300 transition-colors"
                    >
                        {state.cancelLabel}
                    </button>
                    <button
                        onClick={handleConfirm}
                        autoFocus
                        className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors shadow-sm ${state.variant === 'danger'
                                ? 'bg-red-600 hover:bg-red-500'
                                : 'bg-blue-600 hover:bg-blue-500'
                            }`}
                    >
                        {state.confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    ) : null;

    return { confirm, ConfirmDialog };
}

'use client';

import { create } from 'zustand';

interface Toast {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    duration?: number;
}

interface ToastStore {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
    toasts: [],
    addToast: (toast) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id }]
        }));
    },
    removeToast: (id) => {
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== id)
        }));
    }
}));

export function useToast() {
    const addToast = useToastStore((state) => state.addToast);

    const showToast = (toast: Omit<Toast, 'id'>) => {
        addToast(toast);
    };

    return { showToast };
}

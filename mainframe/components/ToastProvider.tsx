'use client';

import ToastContainer from './ToastContainer';
import { useToastStore } from '@/hooks/useToast';

export default function ToastProvider() {
    const toasts = useToastStore((state) => state.toasts);
    const removeToast = useToastStore((state) => state.removeToast);

    return <ToastContainer toasts={toasts} onClose={removeToast} />;
}

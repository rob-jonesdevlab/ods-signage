'use client';
import { API_URL } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

import { useState, useEffect, useRef } from 'react';

interface PairDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PairDeviceModal({ isOpen, onClose, onSuccess }: PairDeviceModalProps) {
    const { profile } = useAuth();
    const [segment1, setSegment1] = useState('');
    const [segment2, setSegment2] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const seg1Ref = useRef<HTMLInputElement>(null);
    const seg2Ref = useRef<HTMLInputElement>(null);

    // Full 6-character code from both segments
    const pairingCode = segment1 + segment2;

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setSegment1('');
            setSegment2('');
            setDeviceName('');
            setError('');
            setSuccess(false);
            setIsLoading(false);
        }
    }, [isOpen]);

    // Auto-focus on first segment
    useEffect(() => {
        if (isOpen && !success) {
            setTimeout(() => seg1Ref.current?.focus(), 100);
        }
    }, [isOpen, success]);

    const handleSegment1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
        setSegment1(value);
        setError('');
        // Auto-advance to segment 2 when full
        if (value.length === 3) {
            seg2Ref.current?.focus();
        }
    };

    const handleSegment2Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
        setSegment2(value);
        setError('');
    };

    const handleSegment2KeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Backspace on empty segment2 → go back to segment1
        if (e.key === 'Backspace' && segment2 === '') {
            seg1Ref.current?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (pairingCode.length !== 6) {
            setError('Please enter a complete 6-character code');
            return;
        }

        if (!profile?.organization_id) {
            setError('User organization not found. Please log in again.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_URL}/api/pairing/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pairing_code: pairingCode,
                    account_id: profile.organization_id,
                    device_name: deviceName || undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to pair device');
            }

            // Show success state
            setSuccess(true);

            // Call onSuccess after a delay
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 2000);

        } catch (err: any) {
            setError(err.message || 'Failed to pair device');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md transform rounded-2xl bg-white border border-gray-200 shadow-2xl transition-all p-6 sm:p-8">
                {!success ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                    <span className="material-symbols-outlined text-[24px]">devices_other</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Pair Device</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                                <span className="material-symbols-outlined text-red-500">warning</span>
                                <div className="text-sm">
                                    <h4 className="font-semibold text-red-600">Error</h4>
                                    <p className="mt-1 text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Pairing Code Input — Two segments with dash */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Pairing Code
                                </label>
                                <div className="flex items-center justify-center gap-3">
                                    <input
                                        ref={seg1Ref}
                                        type="text"
                                        value={segment1}
                                        onChange={handleSegment1Change}
                                        className={`w-[120px] rounded-lg text-center text-3xl font-mono tracking-[0.3em] py-4 uppercase transition-all
                                            ${error
                                                ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                                                : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:bg-white'
                                            }`}
                                        placeholder="ABC"
                                        maxLength={3}
                                        disabled={isLoading}
                                    />
                                    <span className="text-3xl font-bold text-gray-300 select-none">—</span>
                                    <input
                                        ref={seg2Ref}
                                        type="text"
                                        value={segment2}
                                        onChange={handleSegment2Change}
                                        onKeyDown={handleSegment2KeyDown}
                                        className={`w-[120px] rounded-lg text-center text-3xl font-mono tracking-[0.3em] py-4 uppercase transition-all
                                            ${error
                                                ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500'
                                                : 'border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:bg-white'
                                            }`}
                                        placeholder="123"
                                        maxLength={3}
                                        disabled={isLoading}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 text-center">
                                    Enter the code displayed on your device screen
                                </p>
                            </div>

                            {/* Device Name Input */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="device-name">
                                    Device Name <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                </label>
                                <input
                                    id="device-name"
                                    type="text"
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                    className="block w-full rounded-lg border-gray-200 bg-gray-50 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white sm:text-sm px-4 py-2.5 placeholder-gray-400 transition-all"
                                    placeholder="e.g. Lobby Display 1"
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-400">
                                    Leave blank to use auto-generated name
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    disabled={isLoading || pairingCode.length !== 6}
                                >
                                    {isLoading && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    )}
                                    {isLoading ? 'Pairing...' : 'Pair Device'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    /* Success State */
                    <div className="flex flex-col items-center text-center py-4">
                        <div className="mb-6 rounded-full bg-emerald-50 p-4 ring-1 ring-emerald-200">
                            <div className="rounded-full bg-emerald-500 p-3 shadow-lg shadow-emerald-500/30">
                                <span className="material-symbols-outlined text-[40px] text-white">check</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Device Paired!</h3>
                        <p className="text-gray-500 mb-8 max-w-[260px]">
                            Your device has been added and is ready to show content
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

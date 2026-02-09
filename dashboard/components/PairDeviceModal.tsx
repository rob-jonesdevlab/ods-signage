'use client';

import { useState, useEffect } from 'react';

interface PairDeviceModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PairDeviceModal({ isOpen, onClose, onSuccess }: PairDeviceModalProps) {
    const [pairingCode, setPairingCode] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setPairingCode('');
            setDeviceName('');
            setError('');
            setSuccess(false);
            setIsLoading(false);
        }
    }, [isOpen]);

    // Auto-focus on pairing code input
    useEffect(() => {
        if (isOpen && !success) {
            const input = document.getElementById('pairing-code-input');
            if (input) {
                setTimeout(() => input.focus(), 100);
            }
        }
    }, [isOpen, success]);

    const handlePairingCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        setPairingCode(value);
        setError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (pairingCode.length !== 6) {
            setError('Please enter a 6-character code');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('http://localhost:3001/api/pairing/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pairing_code: pairingCode,
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
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-md transform rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl transition-all p-6 sm:p-8">
                {!success ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-500">
                                    <span className="material-symbols-outlined text-[24px]">devices_other</span>
                                </div>
                                <h3 className="text-xl font-bold text-white">Pair Device</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Error Alert */}
                        {error && (
                            <div className="mb-6 flex gap-3 rounded-lg border border-red-900/50 bg-red-900/20 p-4 text-red-200">
                                <span className="material-symbols-outlined text-red-400">warning</span>
                                <div className="text-sm">
                                    <h4 className="font-semibold text-red-400">Error</h4>
                                    <p className="mt-1 text-red-200/90">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Pairing Code Input */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-300" htmlFor="pairing-code-input">
                                    Pairing Code
                                </label>
                                <input
                                    id="pairing-code-input"
                                    type="text"
                                    value={pairingCode}
                                    onChange={handlePairingCodeChange}
                                    className={`block w-full rounded-lg ${error
                                            ? 'border-red-500 shadow-[0_0_0_4px_rgba(239,68,68,0.2)]'
                                            : 'border-slate-700 shadow-[0_0_15px_rgba(59,130,246,0.1)] focus:border-blue-500 focus:ring-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                        } bg-slate-950/50 text-white text-center text-3xl font-mono tracking-widest py-4 placeholder-slate-600 uppercase transition-all`}
                                    placeholder="ABC 123"
                                    maxLength={6}
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-slate-500 text-center">
                                    {pairingCode.length}/6 characters
                                </p>
                            </div>

                            {/* Device Name Input */}
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-300" htmlFor="device-name">
                                    Device Name <span className="text-slate-500 font-normal ml-1">(Optional)</span>
                                </label>
                                <input
                                    id="device-name"
                                    type="text"
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                    className="block w-full rounded-lg border-slate-700 bg-slate-950 text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-2.5 placeholder-slate-500"
                                    placeholder="e.g. Lobby Display 1"
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-slate-500">
                                    Leave blank to use auto-generated name
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                        <div className="mb-6 rounded-full bg-emerald-500/20 p-4 ring-1 ring-emerald-500/40">
                            <div className="rounded-full bg-emerald-500 p-3 shadow-lg shadow-emerald-500/30">
                                <span className="material-symbols-outlined text-[40px] text-white">check</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Device Paired!</h3>
                        <p className="text-slate-400 mb-8 max-w-[260px]">
                            Your device has been added and is ready to show content
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

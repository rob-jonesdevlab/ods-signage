'use client';


// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

type PairingState = 'input' | 'loading' | 'error' | 'success';

interface PairedDevice {
    id: string;
    name: string;
    device_uuid: string;
    paired_at: string;
}

function PairDeviceContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, profile } = useAuth();

    const [state, setState] = useState<PairingState>('input');
    const [pairingCode, setPairingCode] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [error, setError] = useState('');
    const [pairedDevice, setPairedDevice] = useState<PairedDevice | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

    // Redirect if not authenticated
    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    // Pre-fill code from QR scan
    useEffect(() => {
        const code = searchParams.get('code');
        if (code && code.length === 6) {
            setPairingCode(code.toUpperCase());
        }
    }, [searchParams]);

    // Check API connectivity on mount
    useEffect(() => {
        const checkConnection = async () => {
            try {
                const response = await fetch('https://api.ods-cloud.com/api/health');
                if (response.ok) {
                    setConnectionStatus('connected');
                } else {
                    setConnectionStatus('disconnected');
                }
            } catch (err) {
                setConnectionStatus('disconnected');
            }
        };
        checkConnection();
    }, []);

    const handlePairDevice = async () => {
        if (!pairingCode || pairingCode.length !== 6) {
            setError('Please enter a valid 6-character code');
            return;
        }

        if (!profile?.organization_id) {
            setError('No organization found. Please contact support.');
            return;
        }

        if (!user) {
            setError('Not authenticated. Please log in.');
            setState('error');
            return;
        }

        setState('loading');
        setError('');

        try {
            const response = await fetch('https://api.ods-cloud.com/api/pairing/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pairing_code: pairingCode.toUpperCase(),
                    account_id: user.id,
                    organization_id: profile.organization_id,
                    device_name: deviceName || undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setState('error');
                setError(data.error || 'Failed to pair device');
                return;
            }

            setPairedDevice(data.player);
            setState('success');

            // Redirect to players page after 3 seconds
            setTimeout(() => {
                router.push('/players');
            }, 3000);
        } catch (err: any) {
            setState('error');
            const errorMessage = err.message || 'Network error';
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                setError('Connection Error: Unable to reach the server. Please check your internet connection and try again.');
                setConnectionStatus('disconnected');
            } else {
                setError(`Error: ${errorMessage}`);
            }
        }
    };

    const handleTryAgain = () => {
        setState('input');
        setError('');
        setPairingCode('');
    };

    const handleClose = () => {
        router.push('/players');
    };

    return (
        <div className="min-h-screen bg-background-dark flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-md transform rounded-2xl bg-surface-dark border border-slate-700 shadow-2xl p-8">

                {/* Input State */}
                {state === 'input' && (
                    <>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Pair Device</h3>
                                <p className="text-sm text-slate-400">Enter the 6-character code displayed on your device</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-slate-400 hover:text-white transition-colors p-1 -mt-4 -mr-2"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Connection Status Indicator */}
                        {connectionStatus === 'disconnected' && (
                            <div className="mb-4 flex gap-2 rounded-lg border border-amber-900/50 bg-amber-900/20 p-3 text-amber-200">
                                <span className="material-symbols-outlined text-amber-400 text-[20px]">wifi_off</span>
                                <div className="text-xs">
                                    <p className="font-medium text-amber-400">Connection Issue</p>
                                    <p className="text-amber-200/90">Unable to reach server. Check your connection.</p>
                                </div>
                            </div>
                        )}
                        {connectionStatus === 'connected' && (
                            <div className="mb-4 flex gap-2 rounded-lg border border-emerald-900/50 bg-emerald-900/20 p-3 text-emerald-200">
                                <span className="material-symbols-outlined text-emerald-400 text-[20px]">check_circle</span>
                                <div className="text-xs">
                                    <p className="font-medium text-emerald-400">Connected</p>
                                    <p className="text-emerald-200/90">Server is reachable</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <input
                                    className="block w-full rounded-lg border-slate-700 bg-background-dark/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.1)] focus:border-blue-500 focus:ring-blue-500 focus:shadow-[0_0_20px_rgba(59,130,246,0.15)] text-center text-3xl font-mono tracking-widest py-4 placeholder-slate-600 uppercase"
                                    placeholder="ABC 123"
                                    type="text"
                                    maxLength={6}
                                    value={pairingCode}
                                    onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                                    onKeyPress={(e) => e.key === 'Enter' && handlePairDevice()}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-300" htmlFor="device-name">
                                    Device Name <span className="text-slate-500 font-normal ml-1">(Optional)</span>
                                </label>
                                <input
                                    className="block w-full rounded-lg border-slate-700 bg-background-dark text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-3 placeholder-slate-600"
                                    id="device-name"
                                    placeholder="e.g., Lobby Display"
                                    type="text"
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handlePairDevice()}
                                />
                            </div>

                            <button
                                onClick={handlePairDevice}
                                disabled={!pairingCode || pairingCode.length !== 6}
                                className="w-full mt-2 px-6 py-3 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface-dark disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Pair Device
                            </button>
                        </div>
                    </>
                )}

                {/* Loading State */}
                {state === 'loading' && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Pairing Device...</h3>
                        <p className="text-slate-400">Please wait</p>
                    </div>
                )}

                {/* Error State */}
                {state === 'error' && (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-600/20 text-blue-500">
                                    <span className="material-symbols-outlined text-[24px]">devices_other</span>
                                </div>
                                <h3 className="text-xl font-bold text-white">Pair Device</h3>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="mb-6 flex gap-3 rounded-lg border border-red-900/50 bg-red-900/20 p-4 text-red-200">
                            <span className="material-symbols-outlined text-red-400">warning</span>
                            <div className="text-sm">
                                <h4 className="font-semibold text-red-400">Invalid pairing code</h4>
                                <p className="mt-1 text-red-200/90">{error || 'Please check the code on your screen and try again.'}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-300" htmlFor="pairing-code">
                                    Pairing Code
                                </label>
                                <div className="relative">
                                    <input
                                        className="block w-full rounded-lg border-red-500 bg-background-dark text-white shadow-error focus:border-red-500 focus:ring-red-500 sm:text-lg tracking-widest px-4 py-3 placeholder-slate-500 font-mono uppercase"
                                        id="pairing-code"
                                        type="text"
                                        maxLength={6}
                                        value={pairingCode}
                                        onChange={(e) => setPairingCode(e.target.value.toUpperCase())}
                                    />
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                        <span className="material-symbols-outlined text-red-500">error</span>
                                    </div>
                                </div>
                                <p className="mt-1.5 text-xs text-red-400">This code doesn't match any active device request.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-slate-300" htmlFor="device-name-error">
                                    Device Name <span className="text-slate-500 font-normal ml-1">(Optional)</span>
                                </label>
                                <input
                                    className="block w-full rounded-lg border-slate-700 bg-background-dark text-white shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-4 py-2.5 placeholder-slate-500"
                                    id="device-name-error"
                                    placeholder="e.g. Lobby Display 1"
                                    type="text"
                                    value={deviceName}
                                    onChange={(e) => setDeviceName(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex items-center justify-end gap-3">
                            <button
                                onClick={handleClose}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-surface-dark"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTryAgain}
                                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-surface-dark flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">refresh</span>
                                Try Again
                            </button>
                        </div>
                    </>
                )}

                {/* Success State */}
                {state === 'success' && (
                    <div className="flex flex-col items-center text-center">
                        <div className="mb-6 rounded-full bg-emerald-500/20 p-4 ring-1 ring-emerald-500/40">
                            <div className="rounded-full bg-emerald-500 p-3 shadow-lg shadow-emerald-500/30">
                                <span className="material-symbols-outlined text-[40px] text-white">check</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2">Device Paired!</h3>
                        <p className="text-slate-400 mb-8 max-w-[260px]">
                            {pairedDevice?.name || 'Your device'} has been added and is ready to show content
                        </p>
                        <button
                            onClick={() => router.push('/players')}
                            className="w-full px-6 py-3 rounded-xl text-sm font-semibold text-white bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface-dark"
                        >
                            Go to Players
                        </button>
                    </div>
                )}
            </div>

            {/* Material Symbols font */}
            <link
                href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
                rel="stylesheet"
            />
        </div>
    );
}

export default function PairDevicePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background-dark flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500" />
            </div>
        }>
            <PairDeviceContent />
        </Suspense>
    );
}

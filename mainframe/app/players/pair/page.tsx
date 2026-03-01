'use client';


// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, Suspense } from 'react';
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
    const [segment1, setSegment1] = useState('');
    const [segment2, setSegment2] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [error, setError] = useState('');
    const [pairedDevice, setPairedDevice] = useState<PairedDevice | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
    const seg1Ref = useRef<HTMLInputElement>(null);
    const seg2Ref = useRef<HTMLInputElement>(null);

    // Full 6-character code from both segments
    const pairingCode = segment1 + segment2;

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
            const upper = code.toUpperCase();
            setSegment1(upper.slice(0, 3));
            setSegment2(upper.slice(3, 6));
        }
    }, [searchParams]);

    // Auto-focus on first segment
    useEffect(() => {
        if (state === 'input') {
            setTimeout(() => seg1Ref.current?.focus(), 100);
        }
    }, [state]);

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

    const handleSegment1Change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
        setSegment1(value);
        setError('');
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
        if (e.key === 'Backspace' && segment2 === '') {
            seg1Ref.current?.focus();
        }
        if (e.key === 'Enter' && pairingCode.length === 6) {
            handlePairDevice();
        }
    };

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
        setSegment1('');
        setSegment2('');
    };

    const handleClose = () => {
        router.push('/players');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-md transform rounded-2xl bg-white border border-gray-200 shadow-2xl p-8">

                {/* Input State */}
                {state === 'input' && (
                    <>
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Pair Device</h3>
                                <p className="text-sm text-gray-500">Enter the 6-character code displayed on your device</p>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-900 transition-colors p-1 -mt-4 -mr-2"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Connection Status Indicator */}
                        {connectionStatus === 'disconnected' && (
                            <div className="mb-4 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
                                <span className="material-symbols-outlined text-amber-500 text-[20px]">wifi_off</span>
                                <div className="text-xs">
                                    <p className="font-medium text-amber-600">Connection Issue</p>
                                    <p className="text-amber-700">Unable to reach server. Check your connection.</p>
                                </div>
                            </div>
                        )}
                        {connectionStatus === 'connected' && (
                            <div className="mb-4 flex gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-800">
                                <span className="material-symbols-outlined text-emerald-500 text-[20px]">check_circle</span>
                                <div className="text-xs">
                                    <p className="font-medium text-emerald-600">Connected</p>
                                    <p className="text-emerald-700">Server is reachable</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-6">
                            {/* Pairing Code — Two segments with dash */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-center gap-3">
                                    <input
                                        ref={seg1Ref}
                                        className="w-[120px] rounded-lg border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:bg-white text-center text-3xl font-mono tracking-[0.3em] py-4 placeholder-gray-400 uppercase transition-all"
                                        placeholder="ABC"
                                        type="text"
                                        maxLength={3}
                                        value={segment1}
                                        onChange={handleSegment1Change}
                                        onKeyPress={(e) => e.key === 'Enter' && segment1.length === 3 && seg2Ref.current?.focus()}
                                    />
                                    <span className="text-3xl font-bold text-gray-300 select-none">—</span>
                                    <input
                                        ref={seg2Ref}
                                        className="w-[120px] rounded-lg border-gray-200 bg-gray-50 text-gray-900 focus:border-blue-500 focus:ring-blue-500 focus:bg-white text-center text-3xl font-mono tracking-[0.3em] py-4 placeholder-gray-400 uppercase transition-all"
                                        placeholder="123"
                                        type="text"
                                        maxLength={3}
                                        value={segment2}
                                        onChange={handleSegment2Change}
                                        onKeyDown={handleSegment2KeyDown}
                                    />
                                </div>
                                <p className="text-xs text-gray-400 text-center">
                                    Enter the code displayed on your device screen
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="device-name">
                                    Device Name <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                </label>
                                <input
                                    className="block w-full rounded-lg border-gray-200 bg-gray-50 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white sm:text-sm px-4 py-3 placeholder-gray-400 transition-all"
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
                                disabled={pairingCode.length !== 6}
                                className="w-full mt-2 px-6 py-3 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Pairing Device...</h3>
                        <p className="text-gray-500">Please wait</p>
                    </div>
                )}

                {/* Error State */}
                {state === 'error' && (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                    <span className="material-symbols-outlined text-[24px]">devices_other</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Pair Device</h3>
                            </div>
                            <button
                                onClick={handleClose}
                                className="text-gray-400 hover:text-gray-900 transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                            <span className="material-symbols-outlined text-red-500">warning</span>
                            <div className="text-sm">
                                <h4 className="font-semibold text-red-600">Invalid pairing code</h4>
                                <p className="mt-1 text-red-700">{error || 'Please check the code on your screen and try again.'}</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="pairing-code">
                                    Pairing Code
                                </label>
                                <div className="flex items-center justify-center gap-3">
                                    <input
                                        className="w-[120px] rounded-lg border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500 text-center text-3xl font-mono tracking-[0.3em] py-4 uppercase transition-all"
                                        type="text"
                                        maxLength={3}
                                        value={segment1}
                                        onChange={handleSegment1Change}
                                    />
                                    <span className="text-3xl font-bold text-gray-300 select-none">—</span>
                                    <input
                                        className="w-[120px] rounded-lg border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500 text-center text-3xl font-mono tracking-[0.3em] py-4 uppercase transition-all"
                                        type="text"
                                        maxLength={3}
                                        value={segment2}
                                        onChange={handleSegment2Change}
                                        onKeyDown={handleSegment2KeyDown}
                                    />
                                </div>
                                <p className="mt-1.5 text-xs text-red-500 text-center">This code doesn&apos;t match any active device request.</p>
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="device-name-error">
                                    Device Name <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                </label>
                                <input
                                    className="block w-full rounded-lg border-gray-200 bg-gray-50 text-gray-900 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:bg-white sm:text-sm px-4 py-2.5 placeholder-gray-400 transition-all"
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
                                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleTryAgain}
                                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2"
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
                        <div className="mb-6 rounded-full bg-emerald-50 p-4 ring-1 ring-emerald-200">
                            <div className="rounded-full bg-emerald-500 p-3 shadow-lg shadow-emerald-500/30">
                                <span className="material-symbols-outlined text-[40px] text-white">check</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Device Paired!</h3>
                        <p className="text-gray-500 mb-8 max-w-[260px]">
                            {pairedDevice?.name || 'Your device'} has been added and is ready to show content
                        </p>
                        <button
                            onClick={() => router.push('/players')}
                            className="w-full px-6 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 transition-all"
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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500" />
            </div>
        }>
            <PairDeviceContent />
        </Suspense>
    );
}

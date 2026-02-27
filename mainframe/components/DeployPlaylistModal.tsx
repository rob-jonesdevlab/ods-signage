'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { authenticatedFetch } from '@/lib/auth';

interface Playlist {
    id: string;
    name: string;
    description?: string;
}

interface DeployResult {
    success: boolean;
    group: { id: string; name: string };
    playlist: { id: string; name: string };
    totalPlayers: number;
    assigned: number;
    failed: number;
}

interface DeployPlaylistModalProps {
    isOpen: boolean;
    groupId: string | null;
    groupName: string;
    playerCount: number;
    onClose: () => void;
    onDeployed: () => void;
}

export default function DeployPlaylistModal({
    isOpen,
    groupId,
    groupName,
    playerCount,
    onClose,
    onDeployed
}: DeployPlaylistModalProps) {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [deploying, setDeploying] = useState(false);
    const [result, setResult] = useState<DeployResult | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchPlaylists();
            setSelectedPlaylist(null);
            setResult(null);
            setSearch('');
        }
    }, [isOpen]);

    const fetchPlaylists = async () => {
        setLoading(true);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/playlists`);
            const data = await res.json();
            setPlaylists(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch playlists:', error);
        }
        setLoading(false);
    };

    const handleDeploy = async () => {
        if (!selectedPlaylist || !groupId) return;
        setDeploying(true);

        try {
            const res = await authenticatedFetch(`${API_URL}/api/player-groups/${groupId}/deploy`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ playlist_id: selectedPlaylist })
            });

            const data = await res.json();

            if (res.ok) {
                setResult(data);
                onDeployed();
            } else {
                console.error('Deploy failed:', data);
            }
        } catch (error) {
            console.error('Deploy error:', error);
        }
        setDeploying(false);
    };

    if (!isOpen) return null;

    const filteredPlaylists = playlists.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    const selectedPlaylistObj = playlists.find(p => p.id === selectedPlaylist);

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-gray-200 w-full max-w-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                    <h2 className="text-lg font-semibold text-white">Deploy Playlist to Group</h2>
                    <p className="text-sm text-blue-200 mt-0.5">
                        {groupName} · {playerCount} player{playerCount !== 1 ? 's' : ''}
                    </p>
                </div>

                {result ? (
                    /* Success State */
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-3">
                                {result.failed === 0 ? '✅' : '⚠️'}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {result.failed === 0 ? 'Deployment Complete' : 'Partially Deployed'}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                                "{result.playlist.name}" → "{result.group.name}"
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="text-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="text-2xl font-bold text-gray-900">{result.totalPlayers}</div>
                                <div className="text-[11px] text-gray-500 uppercase font-medium">Total</div>
                            </div>
                            <div className="text-center p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                <div className="text-2xl font-bold text-emerald-600">{result.assigned}</div>
                                <div className="text-[11px] text-emerald-600 uppercase font-medium">Assigned</div>
                            </div>
                            <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                                <div className="text-2xl font-bold text-red-600">{result.failed}</div>
                                <div className="text-[11px] text-red-600 uppercase font-medium">Failed</div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    /* Playlist Selection */
                    <div>
                        {/* Search */}
                        <div className="px-6 py-3 border-b border-gray-100">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search playlists..."
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Playlist List */}
                        <div className="max-h-64 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                                    <p className="text-xs text-gray-400 mt-2">Loading playlists...</p>
                                </div>
                            ) : filteredPlaylists.length === 0 ? (
                                <div className="p-8 text-center text-sm text-gray-400">
                                    {search ? 'No matching playlists' : 'No playlists available'}
                                </div>
                            ) : (
                                filteredPlaylists.map(playlist => (
                                    <button
                                        key={playlist.id}
                                        onClick={() => setSelectedPlaylist(playlist.id)}
                                        className={`w-full px-6 py-3 text-left border-b border-gray-50 last:border-0 transition-colors ${selectedPlaylist === playlist.id
                                                ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                                : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className={`text-sm font-medium ${selectedPlaylist === playlist.id ? 'text-blue-700' : 'text-gray-900'}`}>
                                                    {playlist.name}
                                                </p>
                                                {playlist.description && (
                                                    <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">
                                                        {playlist.description}
                                                    </p>
                                                )}
                                            </div>
                                            {selectedPlaylist === playlist.id && (
                                                <span className="material-symbols-outlined text-blue-600 text-[20px]">check_circle</span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Preview + Actions */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                            {selectedPlaylistObj && (
                                <div className="text-xs text-gray-500 mb-3 p-2 bg-white border border-gray-200 rounded-lg">
                                    <span className="font-medium text-gray-700">Preview:</span>{' '}
                                    Assign "{selectedPlaylistObj.name}" to {playerCount} player{playerCount !== 1 ? 's' : ''} in "{groupName}"
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeploy}
                                    disabled={!selectedPlaylist || deploying}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {deploying ? (
                                        <>
                                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            Deploying...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                                            Deploy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

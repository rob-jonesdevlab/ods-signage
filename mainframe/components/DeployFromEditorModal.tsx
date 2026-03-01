'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { authenticatedFetch } from '@/lib/auth';

interface PlayerGroup {
    id: string;
    name: string;
    description: string | null;
    player_count: number;
}

interface DeployGroupResult {
    groupId: string;
    groupName: string;
    status: 'pending' | 'deploying' | 'success' | 'failed';
    totalPlayers: number;
    assigned: number;
    failed: number;
    error?: string;
}

export default function DeployFromEditorModal({
    isOpen,
    playlistId,
    playlistName,
    onClose,
}: {
    isOpen: boolean;
    playlistId: string;
    playlistName: string;
    onClose: () => void;
}) {
    const [groups, setGroups] = useState<PlayerGroup[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [deploying, setDeploying] = useState(false);
    const [results, setResults] = useState<DeployGroupResult[]>([]);
    const [phase, setPhase] = useState<'select' | 'deploying' | 'done'>('select');

    useEffect(() => {
        if (isOpen) {
            fetchGroups();
            setSelectedGroups(new Set());
            setResults([]);
            setPhase('select');
        }
    }, [isOpen]);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/player-groups`);
            const data = await res.json();
            setGroups(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch groups:', err);
        }
        setLoading(false);
    };

    const toggleGroup = (id: string) => {
        setSelectedGroups(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedGroups.size === groups.length) {
            setSelectedGroups(new Set());
        } else {
            setSelectedGroups(new Set(groups.map(g => g.id)));
        }
    };

    const handleDeploy = async () => {
        if (selectedGroups.size === 0) return;
        setDeploying(true);
        setPhase('deploying');

        const initialResults: DeployGroupResult[] = Array.from(selectedGroups).map(gId => {
            const grp = groups.find(g => g.id === gId)!;
            return {
                groupId: gId,
                groupName: grp.name,
                status: 'pending' as const,
                totalPlayers: grp.player_count || 0,
                assigned: 0,
                failed: 0,
            };
        });
        setResults([...initialResults]);

        for (let i = 0; i < initialResults.length; i++) {
            // Mark as deploying
            initialResults[i].status = 'deploying';
            setResults([...initialResults]);

            try {
                const res = await authenticatedFetch(
                    `${API_URL}/api/player-groups/${initialResults[i].groupId}/deploy`,
                    {
                        method: 'POST',
                        body: JSON.stringify({ playlist_id: playlistId }),
                    }
                );
                const data = await res.json();
                if (res.ok) {
                    initialResults[i].status = 'success';
                    initialResults[i].totalPlayers = data.totalPlayers;
                    initialResults[i].assigned = data.assigned;
                    initialResults[i].failed = data.failed;
                } else {
                    initialResults[i].status = 'failed';
                    initialResults[i].error = data.error || 'Unknown error';
                }
            } catch (err) {
                initialResults[i].status = 'failed';
                initialResults[i].error = String(err);
            }
            setResults([...initialResults]);
        }

        setDeploying(false);
        setPhase('done');
    };

    if (!isOpen) return null;

    const totalSelected = selectedGroups.size;
    const totalPlayers = Array.from(selectedGroups).reduce((sum, id) => {
        const g = groups.find(gr => gr.id === id);
        return sum + (g?.player_count || 0);
    }, 0);

    const successCount = results.filter(r => r.status === 'success').length;
    const failCount = results.filter(r => r.status === 'failed').length;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-gray-200 w-full max-w-lg shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600">
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[20px]">rocket_launch</span>
                        Deploy Playlist
                    </h2>
                    <p className="text-sm text-emerald-200 mt-0.5">
                        {playlistName}
                    </p>
                </div>

                {phase === 'select' ? (
                    <div>
                        {/* Select All */}
                        <div className="px-6 py-3 border-b border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                {totalSelected} group{totalSelected !== 1 ? 's' : ''} selected
                                {totalPlayers > 0 && ` · ${totalPlayers} player${totalPlayers !== 1 ? 's' : ''}`}
                            </span>
                            <button
                                onClick={selectAll}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                                {selectedGroups.size === groups.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>

                        {/* Group List */}
                        <div className="max-h-64 overflow-y-auto">
                            {loading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto" />
                                    <p className="text-xs text-gray-400 mt-2">Loading groups...</p>
                                </div>
                            ) : groups.length === 0 ? (
                                <div className="p-8 text-center">
                                    <span className="material-symbols-outlined text-3xl text-gray-300">devices</span>
                                    <p className="text-sm text-gray-400 mt-2">No player groups yet</p>
                                </div>
                            ) : (
                                groups.map(group => (
                                    <button
                                        key={group.id}
                                        onClick={() => toggleGroup(group.id)}
                                        className={`w-full px-6 py-3 text-left border-b border-gray-50 last:border-0 transition-all flex items-center gap-3 ${selectedGroups.has(group.id) ? 'bg-emerald-50' : 'hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${selectedGroups.has(group.id) ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300'
                                            }`}>
                                            {selectedGroups.has(group.id) && (
                                                <span className="material-symbols-outlined text-white text-[14px]">check</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${selectedGroups.has(group.id) ? 'text-emerald-700' : 'text-gray-900'}`}>
                                                {group.name}
                                            </p>
                                            {group.description && (
                                                <p className="text-xs text-gray-400 truncate">{group.description}</p>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 shrink-0 bg-gray-100 px-2 py-0.5 rounded-full">
                                            {group.player_count || 0} player{(group.player_count || 0) !== 1 ? 's' : ''}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-2">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeploy}
                                disabled={totalSelected === 0}
                                className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                                Deploy to {totalSelected} Group{totalSelected !== 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Deploy Progress / Results */
                    <div className="p-6">
                        {phase === 'done' && (
                            <div className="text-center mb-4">
                                <div className="text-4xl mb-2">
                                    {failCount === 0 ? '✅' : '⚠️'}
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {failCount === 0 ? 'All Deployments Complete' : 'Deployment Finished'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    {successCount} succeeded · {failCount} failed
                                </p>
                            </div>
                        )}

                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {results.map(r => (
                                <div
                                    key={r.groupId}
                                    className={`flex items-center gap-3 p-3 rounded-lg border ${r.status === 'success' ? 'bg-emerald-50 border-emerald-200'
                                            : r.status === 'failed' ? 'bg-red-50 border-red-200'
                                                : r.status === 'deploying' ? 'bg-blue-50 border-blue-200'
                                                    : 'bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    {r.status === 'pending' && <span className="material-symbols-outlined text-gray-400 text-[18px]">schedule</span>}
                                    {r.status === 'deploying' && <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />}
                                    {r.status === 'success' && <span className="material-symbols-outlined text-emerald-500 text-[18px]">check_circle</span>}
                                    {r.status === 'failed' && <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900">{r.groupName}</p>
                                        {r.status === 'success' && (
                                            <p className="text-[11px] text-emerald-600">{r.assigned}/{r.totalPlayers} assigned</p>
                                        )}
                                        {r.status === 'failed' && (
                                            <p className="text-[11px] text-red-600">{r.error}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {phase === 'done' && (
                            <button
                                onClick={onClose}
                                className="w-full mt-4 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                            >
                                Done
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

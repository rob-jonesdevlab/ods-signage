'use client';

import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { authenticatedFetch } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';

interface Player {
    id: string;
    name: string;
    status: string;
    cpu_serial: string;
    device_uuid?: string;
    paired_at?: string | null;
    account_id?: string;
    group_id?: string | null;
    playlist_id?: string | null;
    created_at: string;
    updated_at?: string;
    last_seen?: string | null;
    config?: string;
    // Phase A: Capture Everything fields
    hostname?: string;
    rustdesk_id?: string;
    ip_address?: string;
    mac_address?: string;
    os_version?: string;
    disk_free_mb?: number;
    memory_total_mb?: number;
    uptime_seconds?: number;
    screen_resolution?: string;
    cache_asset_count?: number;
    cache_last_sync?: string;
    rustdesk_password?: string;
}

interface PlayerGroup {
    id: string;
    name: string;
}

interface Playlist {
    id: string;
    name: string;
}

interface PlayerDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    player: Player | null;
    groups: PlayerGroup[];
    playlists: Playlist[];
    onPlayerUpdated: () => void;
}

export default function PlayerDetailModal({ isOpen, onClose, player, groups, playlists, onPlayerUpdated }: PlayerDetailModalProps) {
    const { showToast } = useToast();
    const { profile } = useAuth();
    const isODS = profile?.role === 'odsadmin' || profile?.role === 'odstech';
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState('');
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
    const [isAssigningGroup, setIsAssigningGroup] = useState(false);
    const [isAssigningPlaylist, setIsAssigningPlaylist] = useState(false);
    const [remoteViewerActive, setRemoteViewerActive] = useState(false);

    // Sync state when player changes
    useEffect(() => {
        if (player) {
            setEditName(player.name);
            setSelectedGroupId(player.group_id || null);
            setSelectedPlaylistId(player.playlist_id || null);
            setIsEditing(false);
            setIsAssigningGroup(false);
            setIsAssigningPlaylist(false);
            setRemoteViewerActive(false);
        }
    }, [player]);

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    const formatDate = (dateString?: string | null) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatRelativeTime = (dateString?: string | null) => {
        if (!dateString) return 'Never';
        const diff = Date.now() - new Date(dateString).getTime();
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        if (seconds < 60) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const formatUptime = (seconds?: number) => {
        if (!seconds) return '—';
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
        return `${h}h ${m}m`;
    };

    const formatDiskFree = (mb?: number) => {
        if (mb == null) return '—';
        if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
        return `${mb} MB`;
    };

    const formatMemory = (mb?: number) => {
        if (mb == null) return '—';
        if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
        return `${mb} MB`;
    };

    // Rename player
    const handleRename = async () => {
        if (!player || !editName.trim() || editName === player.name) {
            setIsEditing(false);
            return;
        }
        try {
            const res = await authenticatedFetch(`${API_URL}/api/players/${player.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ name: editName.trim() }),
            });
            if (res.ok) {
                showToast({ type: 'success', title: 'Renamed', message: `Player renamed to "${editName.trim()}"` });
                setIsEditing(false);
                onPlayerUpdated();
            } else {
                showToast({ type: 'error', title: 'Failed', message: 'Failed to rename player' });
            }
        } catch {
            showToast({ type: 'error', title: 'Error', message: 'Error renaming player' });
        }
    };

    // Assign group
    const handleAssignGroup = async (groupId: string | null) => {
        if (!player) return;
        try {
            const res = await authenticatedFetch(`${API_URL}/api/players/${player.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ group_id: groupId }),
            });
            if (res.ok) {
                setSelectedGroupId(groupId);
                setIsAssigningGroup(false);
                const groupName = groupId ? groups.find(g => g.id === groupId)?.name : 'None';
                showToast({ type: 'success', title: 'Group Updated', message: `Assigned to "${groupName}"` });
                onPlayerUpdated();
            } else {
                showToast({ type: 'error', title: 'Failed', message: 'Failed to assign group' });
            }
        } catch {
            showToast({ type: 'error', title: 'Error', message: 'Error assigning group' });
        }
    };

    // Assign playlist
    const handleAssignPlaylist = async (playlistId: string | null) => {
        if (!player) return;
        try {
            const res = await authenticatedFetch(`${API_URL}/api/players/${player.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ playlist_id: playlistId }),
            });
            if (res.ok) {
                setSelectedPlaylistId(playlistId);
                setIsAssigningPlaylist(false);
                const plName = playlistId ? playlists.find(p => p.id === playlistId)?.name : 'None';
                showToast({ type: 'success', title: 'Playlist Updated', message: `Assigned "${plName}"` });
                onPlayerUpdated();
            } else {
                showToast({ type: 'error', title: 'Failed', message: 'Failed to assign playlist' });
            }
        } catch {
            showToast({ type: 'error', title: 'Error', message: 'Error assigning playlist' });
        }
    };

    // Unpair player
    const handleUnpair = async () => {
        if (!player) return;
        if (!confirm(`Are you sure you want to unpair "${player.name}"? This will clear the pairing data but keep the player record.`)) return;
        try {
            const res = await authenticatedFetch(`${API_URL}/api/players/${player.id}/unpair`, {
                method: 'POST',
            });
            if (res.ok) {
                showToast({ type: 'info', title: 'Unpaired', message: `"${player.name}" has been unpaired` });
                onPlayerUpdated();
                onClose();
            } else {
                showToast({ type: 'error', title: 'Failed', message: 'Failed to unpair player' });
            }
        } catch {
            showToast({ type: 'error', title: 'Error', message: 'Error unpairing player' });
        }
    };

    // Delete player
    const handleDelete = async () => {
        if (!player) return;
        if (!confirm(`Are you sure you want to permanently delete "${player.name}"? This cannot be undone.`)) return;
        try {
            const res = await authenticatedFetch(`${API_URL}/api/players/${player.id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                showToast({ type: 'info', title: 'Deleted', message: `"${player.name}" has been deleted` });
                onPlayerUpdated();
                onClose();
            } else {
                showToast({ type: 'error', title: 'Failed', message: 'Failed to delete player' });
            }
        } catch {
            showToast({ type: 'error', title: 'Error', message: 'Error deleting player' });
        }
    };

    if (!isOpen || !player) return null;

    const isOnline = player.status === 'online';
    const isPaired = !!player.paired_at;
    const currentGroup = groups.find(g => g.id === selectedGroupId);
    const currentPlaylist = playlists.find(p => p.id === selectedPlaylistId);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
            onClick={onClose}
        >
            {/* Modal Container */}
            <div
                className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[95vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-700">
                    <div className="flex flex-col gap-1 flex-1 min-w-0 mr-4">
                        {/* Player Name (editable) */}
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditing(false); }}
                                    className="text-2xl font-semibold text-white tracking-tight bg-slate-800 border border-blue-500 rounded-lg px-3 py-1 outline-none w-full"
                                    autoFocus
                                />
                                <button onClick={handleRename} className="text-blue-400 hover:text-blue-300">
                                    <span className="material-symbols-outlined">check</span>
                                </button>
                                <button onClick={() => { setIsEditing(false); setEditName(player.name); }} className="text-slate-400 hover:text-white">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 group">
                                <h2 className="text-2xl font-semibold text-white tracking-tight truncate">{player.name}</h2>
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white transition-opacity"
                                >
                                    <span className="material-symbols-outlined text-lg">edit</span>
                                </button>
                            </div>
                        )}
                        {/* Status + Group Tags */}
                        <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></div>
                                <span className={`text-sm font-medium ${isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                            {isPaired && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Paired</span>
                            )}
                            {!isPaired && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Unpaired</span>
                            )}
                            {currentGroup && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    {currentGroup.name}
                                </span>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors rounded-lg p-2 hover:bg-white/5"
                    >
                        <span className="material-symbols-outlined text-2xl">close</span>
                    </button>
                </div>

                {/* Content Area (Scrollable) */}
                <div className="flex-1 overflow-y-auto">
                    {/* Remote Viewer Viewport */}
                    <div className="p-6 pb-0">
                        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-slate-700">
                            {player.rustdesk_id && isODS && remoteViewerActive ? (
                                // Live RustDesk web client iframe
                                <>
                                    <iframe
                                        src={`https://rd.odsfactory.com/?id=${player.rustdesk_id}&password=${encodeURIComponent(player.rustdesk_password || 'p@rTn3R')}&relay=134.199.136.112&key=dwBt7VPSXk9D8li3cBCsdqrIAryWtfC4AD05tpeoxW0%3D`}
                                        className="w-full h-full border-0"
                                        allow="clipboard-read; clipboard-write"
                                        sandbox="allow-scripts allow-same-origin allow-popups"
                                    />
                                    {/* Disconnect button overlay */}
                                    <button
                                        onClick={() => setRemoteViewerActive(false)}
                                        className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-red-600/80 hover:bg-red-600 text-white text-xs font-medium backdrop-blur-sm transition-colors flex items-center gap-1 z-10"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                        Disconnect
                                    </button>
                                </>
                            ) : player.rustdesk_id && isODS ? (
                                // ODS: Ready to connect
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/80">
                                    <span className="material-symbols-outlined text-6xl text-blue-400 mb-3">desktop_windows</span>
                                    <p className="text-white text-lg font-medium">Remote View Available</p>
                                    <p className="text-slate-400 text-sm mt-1">RustDesk ID: <span className="font-mono text-blue-400">{player.rustdesk_id}</span></p>
                                    <button
                                        onClick={() => setRemoteViewerActive(true)}
                                        className="mt-4 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20"
                                    >
                                        <span className="material-symbols-outlined text-lg">play_circle</span>
                                        Connect Remote Viewer
                                    </button>
                                </div>
                            ) : player.rustdesk_id && !isODS ? (
                                // Non-ODS users: Show remote access indicator (no iframe)
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/80">
                                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-blue-500/20">
                                        <span className="material-symbols-outlined text-5xl text-blue-400">desktop_windows</span>
                                    </div>
                                    <p className="text-white text-lg font-medium">Remote Access Configured</p>
                                    <p className="text-slate-400 text-sm mt-1">Contact ODS support for remote assistance</p>
                                </div>
                            ) : (
                                // No RustDesk ID yet — show status display
                                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800/80">
                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isOnline ? 'bg-emerald-500/20' : 'bg-slate-700'}`}>
                                        <span className={`material-symbols-outlined text-5xl ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            {isOnline ? 'monitor_heart' : 'desktop_access_disabled'}
                                        </span>
                                    </div>
                                    <p className="text-white text-lg font-medium">
                                        {isOnline ? 'Player Active' : 'Player Offline'}
                                    </p>
                                    <p className="text-slate-400 text-sm mt-1">
                                        {isOnline ? 'Remote viewer will be available once RustDesk ID is reported' : `Last seen: ${formatRelativeTime(player.last_seen)}`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Device Info Grid — role-based views */}
                    <div className="p-6">
                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 px-2">Device Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
                            {/* Row 1 — ODS only: CPU Serial, RustDesk ID, Paired At */}
                            {isODS && (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700 md:border-r">
                                        <span className="text-slate-400 text-sm">CPU Serial</span>
                                        <span className="text-white text-sm font-mono mt-1 sm:mt-0 truncate max-w-[140px]" title={player.cpu_serial}>{player.cpu_serial || '—'}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700 md:border-r">
                                        <span className="text-slate-400 text-sm">RustDesk ID</span>
                                        <span className="text-white text-sm font-mono mt-1 sm:mt-0">{player.rustdesk_id || '—'}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700">
                                        <span className="text-slate-400 text-sm">Paired At</span>
                                        <span className="text-white text-sm font-medium mt-1 sm:mt-0">{formatDate(player.paired_at)}</span>
                                    </div>
                                </>
                            )}

                            {/* Row 2 — shared: Hostname, OS Version, IP Address/Created */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700 md:border-r">
                                <span className="text-slate-400 text-sm">Hostname</span>
                                <span className="text-white text-sm font-medium mt-1 sm:mt-0">{player.hostname || '—'}</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700 md:border-r">
                                <span className="text-slate-400 text-sm">OS Version</span>
                                <span className="text-white text-sm font-medium mt-1 sm:mt-0">{player.os_version || '—'}</span>
                            </div>
                            {isODS ? (
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700">
                                    <span className="text-slate-400 text-sm">Created</span>
                                    <span className="text-white text-sm font-medium mt-1 sm:mt-0">{formatDate(player.created_at)}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700">
                                    <span className="text-slate-400 text-sm">Created</span>
                                    <span className="text-white text-sm font-medium mt-1 sm:mt-0">{formatDate(player.created_at)}</span>
                                </div>
                            )}

                            {/* Row 3 — ODS: IP, MAC, Disk; User: IP, Uptime, Resolution */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700 md:border-r">
                                <span className="text-slate-400 text-sm">IP Address</span>
                                <span className="text-white text-sm font-mono mt-1 sm:mt-0">{player.ip_address || '—'}</span>
                            </div>
                            {isODS ? (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700 md:border-r">
                                        <span className="text-slate-400 text-sm">MAC Address</span>
                                        <span className="text-white text-sm font-mono mt-1 sm:mt-0">{player.mac_address || '—'}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700">
                                        <span className="text-slate-400 text-sm">Disk Free</span>
                                        <span className="text-white text-sm font-medium mt-1 sm:mt-0">{formatDiskFree(player.disk_free_mb)}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700 md:border-r">
                                        <span className="text-slate-400 text-sm">Uptime</span>
                                        <span className="text-white text-sm font-medium mt-1 sm:mt-0">{formatUptime(player.uptime_seconds)}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700">
                                        <span className="text-slate-400 text-sm">Resolution</span>
                                        <span className="text-white text-sm font-medium mt-1 sm:mt-0">{player.screen_resolution || '—'}</span>
                                    </div>
                                </>
                            )}

                            {/* Row 4 — ODS: Memory, Uptime, Resolution; User: Last Seen, Cache, (none) */}
                            {isODS ? (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700 md:border-r">
                                        <span className="text-slate-400 text-sm">Memory</span>
                                        <span className="text-white text-sm font-medium mt-1 sm:mt-0">{formatMemory(player.memory_total_mb)}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700 md:border-r">
                                        <span className="text-slate-400 text-sm">Uptime</span>
                                        <span className="text-white text-sm font-medium mt-1 sm:mt-0">{formatUptime(player.uptime_seconds)}</span>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700">
                                        <span className="text-slate-400 text-sm">Resolution</span>
                                        <span className="text-white text-sm font-medium mt-1 sm:mt-0">{player.screen_resolution || '—'}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700 md:border-r">
                                        <span className="text-slate-400 text-sm">Last Seen</span>
                                        <div className="flex items-center gap-2 mt-1 sm:mt-0">
                                            <span className="text-white text-sm font-medium">{formatRelativeTime(player.last_seen)}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700 md:border-r">
                                        <span className="text-slate-400 text-sm">Cache</span>
                                        <span className="text-white text-sm font-medium mt-1 sm:mt-0">{player.cache_asset_count ?? '—'}</span>
                                    </div>
                                    <div className="py-3 px-5 border-b border-slate-700"></div>
                                </>
                            )}

                            {/* Row 5 — Playlist + Group (both roles) + ODS: Last Seen/Cache */}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700 md:border-b-0 md:border-r">
                                <span className="text-slate-400 text-sm">Playlist</span>
                                {isAssigningPlaylist ? (
                                    <select
                                        value={selectedPlaylistId || ''}
                                        onChange={(e) => handleAssignPlaylist(e.target.value || null)}
                                        className="bg-slate-700 text-white text-sm rounded-md px-2 py-1 border border-slate-600 outline-none mt-1 sm:mt-0"
                                        autoFocus
                                        onBlur={() => setIsAssigningPlaylist(false)}
                                    >
                                        <option value="">None</option>
                                        {playlists.map(p => (
                                            <option key={p.id} value={p.id}>{p.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <button
                                        onClick={() => setIsAssigningPlaylist(true)}
                                        className="text-sm font-medium mt-1 sm:mt-0 hover:text-blue-400 transition-colors flex items-center gap-1"
                                    >
                                        <span className={currentPlaylist ? 'text-white' : 'text-slate-500'}>{currentPlaylist?.name || 'None'}</span>
                                        <span className="material-symbols-outlined text-xs text-slate-500">edit</span>
                                    </button>
                                )}
                            </div>

                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5 border-b border-slate-700 md:border-b-0 md:border-r">
                                <span className="text-slate-400 text-sm">Group</span>
                                {isAssigningGroup ? (
                                    <select
                                        value={selectedGroupId || ''}
                                        onChange={(e) => handleAssignGroup(e.target.value || null)}
                                        className="bg-slate-700 text-white text-sm rounded-md px-2 py-1 border border-slate-600 outline-none mt-1 sm:mt-0"
                                        autoFocus
                                        onBlur={() => setIsAssigningGroup(false)}
                                    >
                                        <option value="">None</option>
                                        {groups.map(g => (
                                            <option key={g.id} value={g.id}>{g.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <button
                                        onClick={() => setIsAssigningGroup(true)}
                                        className="text-sm font-medium mt-1 sm:mt-0 hover:text-blue-400 transition-colors flex items-center gap-1"
                                    >
                                        <span className={currentGroup ? 'text-white' : 'text-slate-500'}>{currentGroup?.name || 'None'}</span>
                                        <span className="material-symbols-outlined text-xs text-slate-500">edit</span>
                                    </button>
                                )}
                            </div>

                            {isODS ? (
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-3 px-5">
                                    <span className="text-slate-400 text-sm">Last Seen</span>
                                    <div className="flex items-center gap-2 mt-1 sm:mt-0">
                                        <span className="text-white text-sm font-medium">{formatRelativeTime(player.last_seen)}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="py-3 px-5"></div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-center justify-between p-6 bg-slate-800/50 border-t border-slate-700 rounded-b-xl gap-4">
                    <button
                        onClick={handleDelete}
                        className="flex items-center justify-center gap-2 px-5 h-10 w-full sm:w-auto rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all text-sm font-semibold"
                    >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                        <span>Delete Player</span>
                    </button>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {isPaired && (
                            <button
                                onClick={handleUnpair}
                                className="px-5 h-10 w-full sm:w-auto rounded-lg text-amber-400 hover:text-amber-300 border border-amber-500/30 hover:bg-amber-500/10 transition-all text-sm font-medium"
                            >
                                Unpair
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-5 h-10 w-full sm:w-auto rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600 border border-transparent transition-all text-sm font-medium shadow-sm"
                        >
                            Close
                        </button>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-5 h-10 w-full sm:w-auto rounded-lg text-white bg-blue-600 hover:bg-blue-500 border border-transparent transition-all text-sm font-medium shadow-lg shadow-blue-600/20"
                        >
                            Rename
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

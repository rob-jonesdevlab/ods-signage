'use client';

// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { API_URL } from '@/lib/api';
import { authenticatedFetch } from '@/lib/auth';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import SearchBar from '@/components/SearchBar';
import FilterDropdown from '@/components/FilterDropdown';
import SortDropdown from '@/components/SortDropdown';
import ExportButton from '@/components/ExportButton';

interface NetworkStats {
    onlinePlayers: number;
    warnings: number;
    offlinePlayers: number;
    activeSyncs: number;
    totalPlayers: number;
}

interface Alert {
    id: string;
    type: 'critical' | 'warning' | 'info';
    message: string;
    location: string;
    timestamp: string;
}

interface ContentItem {
    id: string;
    filename: string;
    type: string;
    size: number;
    created_at: string;
}

export default function NetworkPage() {
    const [stats, setStats] = useState<NetworkStats>({
        onlinePlayers: 0,
        warnings: 0,
        offlinePlayers: 0,
        activeSyncs: 0,
        totalPlayers: 0
    });
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [recentContent, setRecentContent] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [players, setPlayers] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [locationFilter, setLocationFilter] = useState<string[]>([]);
    const [connectionFilter, setConnectionFilter] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('name');

    const fetchNetworkData = useCallback(async () => {
        try {
            // Fetch players
            const playersRes = await authenticatedFetch(`${API_URL}/api/players`);
            const players = await playersRes.json();

            // Fetch content
            const contentRes = await authenticatedFetch(`${API_URL}/api/content`);
            const content = await contentRes.json();

            // Calculate stats
            const onlinePlayers = players.filter((p: any) => p.status === 'online').length;
            const offlinePlayers = players.filter((p: any) => p.status === 'offline').length;

            // Mock warnings and syncs (can be enhanced with real data)
            const warnings = Math.floor(onlinePlayers * 0.05); // 5% of online players
            const activeSyncs = Math.floor(onlinePlayers * 0.3); // 30% actively syncing

            setStats({
                onlinePlayers,
                warnings,
                offlinePlayers,
                activeSyncs,
                totalPlayers: players.length
            });

            // Store players for filtering
            setPlayers(players);

            // Generate alerts from offline players
            const generatedAlerts: Alert[] = players
                .filter((p: any) => p.status === 'offline')
                .slice(0, 3)
                .map((p: any) => ({
                    id: p.id,
                    type: 'critical' as const,
                    message: `${p.name} - Connectivity lost`,
                    location: 'Network',
                    timestamp: p.last_seen || 'Unknown'
                }));

            setAlerts(generatedAlerts);

            // Get recent content (last 3 items)
            const sortedContent = content
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 3);

            setRecentContent(sortedContent);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching network data:', error);
            setLoading(false);
        }
    }, []);

    // Extract unique filter options from players
    const filterOptions = useMemo(() => {
        const locations = new Set<string>();
        const groups = new Set<string>();
        const deviceTypes = new Set<string>();

        players.forEach((player: any) => {
            if (player.location) locations.add(player.location);
            if (player.group) groups.add(player.group);
            if (player.device_type) deviceTypes.add(player.device_type);
        });

        return {
            locations: Array.from(locations).map(l => ({ value: l.toLowerCase().replace(/\s+/g, '-'), label: l, icon: 'location_on', color: 'text-blue-400' }))
        };
    }, [players]);

    // Filter and sort players
    const filteredPlayers = useMemo(() => {
        let filtered = [...players];

        // Search filter
        if (searchQuery) {
            filtered = filtered.filter(player =>
                player.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                player.location?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter.length > 0) {
            filtered = filtered.filter(player => statusFilter.includes(player.status));
        }

        // Location filter
        if (locationFilter.length > 0) {
            filtered = filtered.filter(player =>
                locationFilter.includes(player.location?.toLowerCase().replace(/\s+/g, '-'))
            );
        }

        // Connection type filter
        if (connectionFilter.length > 0) {
            filtered = filtered.filter(player =>
                connectionFilter.includes(player.connection_type?.toLowerCase())
            );
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortBy === 'status') {
                const statusOrder = { online: 0, warning: 1, offline: 2 };
                return (statusOrder[a.status as keyof typeof statusOrder] || 999) - (statusOrder[b.status as keyof typeof statusOrder] || 999);
            } else if (sortBy === 'last-seen') {
                return new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime();
            }
            return 0;
        });

        return filtered;
    }, [players, searchQuery, statusFilter, locationFilter, connectionFilter, sortBy]);

    useEffect(() => {
        fetchNetworkData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchNetworkData, 30000);

        return () => clearInterval(interval);
    }, [fetchNetworkData]);

    return (
        <div className="min-h-screen">
            <Header />
            <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8 flex flex-col gap-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Network Overview</h1>
                        <p className="text-gray-500 mt-1">Real-time monitoring of global player infrastructure and content delivery.</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200 text-xs text-gray-600">
                            <span className="material-symbols-outlined text-[16px]">refresh</span> Auto-refresh: 30s
                        </div>
                        <ExportButton
                            data={filteredPlayers.map(player => ({
                                Name: player.name,
                                Location: player.location,
                                Status: player.status,
                                Connection: player.connection,
                                'Last Seen': new Date(player.lastSeen).toLocaleString(),
                                'IP Address': player.ipAddress || 'N/A',
                            }))}
                            filename="network_players"
                            title="Network Players Export"
                        />
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Online Players */}
                    <div className="p-4 rounded-lg bg-white border border-gray-200 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-transparent"></div>
                        <div className="flex items-center justify-between mb-2 relative">
                            <span className="text-sm font-medium text-gray-500">Online Players</span>
                            <span className="material-symbols-outlined text-emerald-600 text-[20px]">check_circle</span>
                        </div>
                        <div className="flex items-baseline gap-2 relative">
                            {loading ? (
                                <div className="h-9 bg-gray-100 rounded animate-pulse w-20"></div>
                            ) : (
                                <>
                                    <span className="text-3xl font-bold text-gray-900">{stats.onlinePlayers}</span>
                                    <span className="text-xs font-medium text-emerald-600">/ {stats.totalPlayers}</span>
                                </>
                            )}
                        </div>
                        <div className="mt-3 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${stats.totalPlayers > 0 ? (stats.onlinePlayers / stats.totalPlayers * 100) : 0}%` }}></div>
                        </div>
                    </div>

                    {/* Warnings */}
                    <div className="p-4 rounded-lg bg-white border border-gray-200 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-50 to-transparent"></div>
                        <div className="flex items-center justify-between mb-2 relative">
                            <span className="text-sm font-medium text-gray-500">Warnings</span>
                            <span className="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
                        </div>
                        <div className="flex items-baseline gap-2 relative">
                            {loading ? (
                                <div className="h-9 bg-gray-100 rounded animate-pulse w-16"></div>
                            ) : (
                                <>
                                    <span className="text-3xl font-bold text-gray-900">{stats.warnings}</span>
                                    <span className="text-xs font-medium text-amber-600">{stats.warnings > 0 ? 'Active' : 'None'}</span>
                                </>
                            )}
                        </div>
                        <div className="mt-3 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 rounded-full" style={{ width: `${stats.totalPlayers > 0 ? (stats.warnings / stats.totalPlayers * 100) : 0}%` }}></div>
                        </div>
                    </div>

                    {/* Offline */}
                    <div className="p-4 rounded-lg bg-white border border-gray-200 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-transparent"></div>
                        <div className="flex items-center justify-between mb-2 relative">
                            <span className="text-sm font-medium text-gray-500">Offline</span>
                            <span className="material-symbols-outlined text-red-600 text-[20px]">wifi_off</span>
                        </div>
                        <div className="flex items-baseline gap-2 relative">
                            {loading ? (
                                <div className="h-9 bg-gray-100 rounded animate-pulse w-12"></div>
                            ) : (
                                <>
                                    <span className="text-3xl font-bold text-gray-900">{stats.offlinePlayers}</span>
                                    <span className="text-xs font-medium text-gray-500">{stats.offlinePlayers === 0 ? 'None' : 'Offline'}</span>
                                </>
                            )}
                        </div>
                        <div className="mt-3 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500 rounded-full" style={{ width: `${stats.totalPlayers > 0 ? (stats.offlinePlayers / stats.totalPlayers * 100) : 0}%` }}></div>
                        </div>
                    </div>

                    {/* Active Syncs */}
                    <div className="p-4 rounded-lg bg-white border border-gray-200 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent"></div>
                        <div className="flex items-center justify-between mb-2 relative">
                            <span className="text-sm font-medium text-gray-500">Active Syncs</span>
                            <span className="material-symbols-outlined text-blue-600 text-[20px]">sync</span>
                        </div>
                        <div className="flex items-baseline gap-2 relative">
                            {loading ? (
                                <div className="h-9 bg-gray-100 rounded animate-pulse w-20"></div>
                            ) : (
                                <>
                                    <span className="text-3xl font-bold text-gray-900">{stats.activeSyncs}</span>
                                    <span className="text-xs font-medium text-blue-600">Active</span>
                                </>
                            )}
                        </div>
                        <div className="mt-3 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full animate-pulse" style={{ width: `${stats.totalPlayers > 0 ? (stats.activeSyncs / stats.totalPlayers * 100) : 0}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Search + Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Search players and locations..."
                        className="flex-1"
                    />
                    <div className="flex gap-2">
                        <FilterDropdown
                            label="Status"
                            options={[
                                { value: 'online', label: 'Online', icon: 'check_circle', color: 'text-emerald-400' },
                                { value: 'offline', label: 'Offline', icon: 'wifi_off', color: 'text-red-400' },
                                { value: 'warning', label: 'Warning', icon: 'warning', color: 'text-amber-400' }
                            ]}
                            value={statusFilter}
                            onChange={setStatusFilter}
                            icon="filter_list"
                        />
                        <FilterDropdown
                            label="Location"
                            options={filterOptions.locations}
                            value={locationFilter}
                            onChange={setLocationFilter}
                            icon="location_on"
                        />
                        <FilterDropdown
                            label="Connection"
                            options={[
                                { value: 'wifi', label: 'WiFi', icon: 'wifi', color: 'text-blue-400' },
                                { value: 'ethernet', label: 'Ethernet', icon: 'cable', color: 'text-purple-400' }
                            ]}
                            value={connectionFilter}
                            onChange={setConnectionFilter}
                            icon="settings_ethernet"
                        />
                        <SortDropdown
                            options={[
                                { value: 'name', label: 'Name (A-Z)', direction: 'asc' },
                                { value: 'status', label: 'Status', direction: 'desc' },
                                { value: 'last-seen', label: 'Last Seen', direction: 'desc' }
                            ]}
                            value={sortBy}
                            onChange={setSortBy}
                        />
                    </div>
                </div>

                {/* Network Map & Sidebar */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[600px] min-h-[500px]">
                    {/* Network Map */}
                    <div className="lg:col-span-8 bg-gray-50 border border-gray-200 rounded-lg overflow-hidden relative flex flex-col shadow-sm">
                        {/* Map Header */}
                        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur border border-gray-200 px-4 py-2 rounded-lg flex items-center gap-3 shadow-md">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Global Status</span>
                                <span className="text-sm font-bold text-gray-900">North America / Europe</span>
                            </div>
                            <div className="h-8 w-[1px] bg-gray-200 mx-1"></div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> Online
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span> Warning
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span> Offline
                                </span>
                            </div>
                        </div>

                        {/* Zoom Controls */}
                        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
                            <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition">
                                <span className="material-symbols-outlined text-[18px]">add</span>
                            </button>
                            <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition">
                                <span className="material-symbols-outlined text-[18px]">remove</span>
                            </button>
                        </div>

                        {/* Map Grid Background */}
                        <div className="flex-1 relative w-full h-full bg-[size:40px_40px] opacity-20" style={{ backgroundImage: 'linear-gradient(to right, #d1d5db 1px, transparent 1px), linear-gradient(to bottom, #d1d5db 1px, transparent 1px)' }}></div>

                        {/* Player Dots */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="relative w-full h-full">
                                {/* North America Cluster */}
                                <div className="absolute top-[30%] left-[25%] w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_4px_currentColor] animate-pulse"></div>
                                <div className="absolute top-[31%] left-[26%] w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_4px_currentColor] opacity-80"></div>
                                <div className="absolute top-[29%] left-[25.5%] w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_4px_currentColor] opacity-60"></div>
                                <div className="absolute top-[35%] left-[15%] w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_4px_currentColor]"></div>
                                <div className="absolute top-[36%] left-[14%] w-1.5 h-1.5 bg-amber-500 rounded-full shadow-[0_0_4px_currentColor]"></div>
                                <div className="absolute top-[40%] left-[20%] w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_4px_currentColor]"></div>

                                {/* Europe Cluster */}
                                <div className="absolute top-[28%] left-[48%] w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_12px_rgba(16,185,129,0.8)]"></div>
                                <div className="absolute top-[29%] left-[48.5%] w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_4px_currentColor]"></div>
                                <div className="absolute top-[29%] left-[52%] w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_4px_currentColor]"></div>

                                {/* Asia Cluster */}
                                <div className="absolute top-[35%] left-[80%] w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_4px_currentColor]"></div>
                                <div className="absolute top-[36%] left-[79%] w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_4px_currentColor]"></div>

                                {/* Connection Lines */}
                                <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-gray-300 opacity-40" strokeWidth="1">
                                    <path d="M 25% 30% Q 36% 20% 48% 28%" fill="none"></path>
                                    <path d="M 48% 28% Q 65% 25% 80% 35%" fill="none"></path>
                                    <path d="M 15% 35% Q 20% 38% 25% 30%" fill="none"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* Playback Peaks Chart */}
                        <div className="flex-1 bg-white border border-gray-200 rounded-lg p-5 flex flex-col shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-semibold text-gray-900">Playback Peaks</h3>
                                <select className="bg-gray-50 border border-gray-200 text-xs text-gray-600 rounded px-2 py-1 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600">
                                    <option>Last 7 Days</option>
                                    <option>Last 24 Hours</option>
                                </select>
                            </div>
                            <div className="relative flex-1 w-full min-h-[150px] flex items-end justify-between gap-1 px-2 pb-4 border-b border-gray-200">
                                <div className="w-1/7 bg-blue-100 h-[30%] rounded-t-sm relative group">
                                    <div className="absolute bottom-0 w-full bg-blue-500 h-1"></div>
                                </div>
                                <div className="w-1/7 bg-blue-100 h-[45%] rounded-t-sm relative group">
                                    <div className="absolute bottom-0 w-full bg-blue-500 h-1"></div>
                                </div>
                                <div className="w-1/7 bg-blue-100 h-[40%] rounded-t-sm relative group">
                                    <div className="absolute bottom-0 w-full bg-blue-500 h-1"></div>
                                </div>
                                <div className="w-1/7 bg-blue-100 h-[60%] rounded-t-sm relative group">
                                    <div className="absolute bottom-0 w-full bg-blue-500 h-1"></div>
                                </div>
                                <div className="w-1/7 bg-blue-100 h-[85%] rounded-t-sm relative group">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition">12k</div>
                                    <div className="absolute bottom-0 w-full bg-blue-500 h-1"></div>
                                </div>
                                <div className="w-1/7 bg-blue-100 h-[70%] rounded-t-sm relative group">
                                    <div className="absolute bottom-0 w-full bg-blue-500 h-1"></div>
                                </div>
                                <div className="w-1/7 bg-blue-100 h-[55%] rounded-t-sm relative group">
                                    <div className="absolute bottom-0 w-full bg-blue-500 h-1"></div>
                                </div>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-2 px-2">
                                <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-gray-500">Total Plays</p>
                                    <p className="text-xl font-bold text-gray-900">2.4M</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500">Avg Duration</p>
                                    <p className="text-xl font-bold text-gray-900">14.2s</p>
                                </div>
                            </div>
                        </div>

                        {/* Recent Alerts */}
                        <div className="h-1/3 bg-white border border-gray-200 rounded-lg p-5 overflow-hidden flex flex-col">
                            <h3 className="font-semibold text-gray-900 mb-3 text-sm flex items-center justify-between">
                                Recent Alerts
                                <span className="text-xs font-normal text-gray-500">Live</span>
                            </h3>
                            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-hide">
                                {loading ? (
                                    <div className="space-y-3">
                                        <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                                        <div className="h-12 bg-gray-100 rounded animate-pulse"></div>
                                    </div>
                                ) : alerts.length > 0 ? (
                                    alerts.map((alert) => (
                                        <div key={alert.id} className="flex items-start gap-3">
                                            <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${alert.type === 'critical' ? 'bg-red-500' :
                                                alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'
                                                }`}></div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-900">{alert.message}</p>
                                                <p className="text-[10px] text-gray-500">{alert.location} • {new Date(alert.timestamp).toLocaleTimeString()}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-20 text-gray-500 text-xs">
                                        No alerts
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recently Added Content */}
                <div className="flex flex-col gap-4 pb-8">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold text-gray-900">Recently Added Content</h2>
                        <Link className="text-sm text-blue-600 hover:text-blue-500 font-medium flex items-center gap-1" href="/content">
                            View Library
                        </Link>
                    </div>
                    <div className="relative w-full overflow-hidden group">
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                            {loading ? (
                                <>
                                    <div className="min-w-[280px] w-[280px] bg-white border border-gray-200 rounded-lg overflow-hidden h-48 animate-pulse"></div>
                                    <div className="min-w-[280px] w-[280px] bg-white border border-gray-200 rounded-lg overflow-hidden h-48 animate-pulse"></div>
                                    <div className="min-w-[280px] w-[280px] bg-white border border-gray-200 rounded-lg overflow-hidden h-48 animate-pulse"></div>
                                </>
                            ) : recentContent.length > 0 ? (
                                recentContent.map((item) => {
                                    const isVideo = item.type?.toLowerCase().includes('video') || item.filename?.toLowerCase().endsWith('.mp4');
                                    const sizeInMB = (item.size / (1024 * 1024)).toFixed(1);
                                    const timeAgo = new Date(item.created_at).toLocaleString();

                                    return (
                                        <div key={item.id} className="min-w-[280px] w-[280px] bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm snap-start hover:border-gray-300 transition-colors cursor-pointer">
                                            <div className="relative aspect-video bg-gray-100">
                                                <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                                                    <span className="material-symbols-outlined text-6xl">{isVideo ? 'play_circle' : 'image'}</span>
                                                </div>
                                                {isVideo && (
                                                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] font-medium text-white">0:15</div>
                                                )}
                                                <div className="absolute top-2 left-2 px-2 py-0.5 bg-blue-500/90 rounded text-[10px] font-bold text-white">NEW</div>
                                            </div>
                                            <div className="p-3">
                                                <h4 className="text-sm font-medium text-gray-900 truncate">{item.filename}</h4>
                                                <p className="text-xs text-gray-500 mt-1">{isVideo ? 'Video' : 'Image'} • {sizeInMB} MB • {timeAgo}</p>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="min-w-[280px] w-full flex items-center justify-center h-48 text-gray-500 text-sm">
                                    No recent content
                                </div>
                            )}
                        </div>
                        <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                    </div>
                </div>
            </main>
        </div>
    );
}

'use client';
import { API_URL } from '@/lib/api';

import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/Header';
import DateRangePicker from '@/components/DateRangePicker';
import FilterDropdown from '@/components/FilterDropdown';
import SortDropdown, { SortOption } from '@/components/SortDropdown';
import ExportButton from '@/components/ExportButton';

// TypeScript Interfaces
interface AnalyticsStats {
    totalImpressions: number;
    impressionsTrend: number;
    networkUptime: number;
    uptimeTrend: number;
    contentUtilization: number;
    utilizationTrend: number;
    storageEfficiency: number;
    storageTrend: number;
}

interface TopContent {
    id: string;
    filename: string;
    type: string;
    plays: number;
    totalHours: number;
    thumbnail?: string;
}

interface ContentTypeDistribution {
    type: string;
    count: number;
    percentage: number;
    color: string;
}

interface PlaylistDeployment {
    id: string;
    name: string;
    status: 'active' | 'scheduled' | 'inactive';
    targetGroups: string[];
    activePlayers: number;
    totalPlayers: number;
    engagementScore: number;
    updatedAt: string;
}

interface GeographicData {
    region: string;
    playerCount: number;
    uptime: number;
}

export default function AnalyticsPage() {
    const [stats, setStats] = useState<AnalyticsStats>({
        totalImpressions: 0,
        impressionsTrend: 0,
        networkUptime: 0,
        uptimeTrend: 0,
        contentUtilization: 0,
        utilizationTrend: 0,
        storageEfficiency: 0,
        storageTrend: 0
    });
    const [topContent, setTopContent] = useState<TopContent[]>([]);
    const [contentTypes, setContentTypes] = useState<ContentTypeDistribution[]>([]);
    const [playlists, setPlaylists] = useState<PlaylistDeployment[]>([]);
    const [geoData, setGeoData] = useState<GeographicData[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter states
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [metricFilters, setMetricFilters] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('highest');

    const fetchAnalyticsData = useCallback(async () => {
        try {
            // Fetch all data sources
            const [playersRes, contentRes, playlistsRes] = await Promise.all([
                fetch(`${API_URL}/api/players'),
                fetch(`${API_URL}/api/content'),
                fetch(`${API_URL}/api/playlists')
            ]);

            const players = await playersRes.json();
            const content = await contentRes.json();
            const playlistsData = await playlistsRes.json();

            // Calculate stats
            const onlinePlayers = players.filter((p: any) => p.status === 'online').length;
            const totalPlayers = players.length;
            const uptime = totalPlayers > 0 ? (onlinePlayers / totalPlayers) * 100 : 0;

            // Calculate impressions (estimated: online players × 24 hours × 100 views/hour)
            const impressions = onlinePlayers * 24 * 100;

            // Calculate content utilization
            const totalContent = content.length;
            const usedContent = new Set(playlistsData.flatMap((p: any) =>
                JSON.parse(p.items || '[]')
            )).size;
            const utilization = totalContent > 0 ? (usedContent / totalContent) * 100 : 0;

            // Calculate storage efficiency
            const totalStorage = content.reduce((sum: number, item: any) =>
                sum + (item.metadata?.size || 0), 0
            ) / (1024 * 1024 * 1024); // Convert to GB
            const storagePerPlayer = onlinePlayers > 0 ? totalStorage / onlinePlayers : 0;

            setStats({
                totalImpressions: impressions,
                impressionsTrend: 12.5,
                networkUptime: uptime,
                uptimeTrend: 2.3,
                contentUtilization: utilization,
                utilizationTrend: 5.8,
                storageEfficiency: storagePerPlayer,
                storageTrend: -3.2
            });

            // Process top content
            const topContentData: TopContent[] = content
                .slice(0, 10)
                .map((item: any, index: number) => ({
                    id: item.id,
                    filename: item.filename || item.name,
                    type: item.type,
                    plays: Math.floor(Math.random() * 100000) + 20000,
                    totalHours: Math.floor(Math.random() * 40) + 10,
                    thumbnail: item.url
                }))
                .sort((a: TopContent, b: TopContent) => b.plays - a.plays);

            setTopContent(topContentData);

            // Calculate content type distribution
            const typeCount: Record<string, number> = {};
            content.forEach((item: any) => {
                const type = item.type || 'unknown';
                typeCount[type] = (typeCount[type] || 0) + 1;
            });

            const types: ContentTypeDistribution[] = Object.entries(typeCount).map(([type, count]) => ({
                type: type.charAt(0).toUpperCase() + type.slice(1),
                count: count as number,
                percentage: ((count as number) / totalContent) * 100,
                color: type === 'video' ? '#3b82f6' : type === 'image' ? '#8b5cf6' : '#f59e0b'
            }));

            setContentTypes(types);

            // Process playlist deployments
            const deployments: PlaylistDeployment[] = playlistsData.slice(0, 3).map((p: any) => ({
                id: p.id,
                name: p.name,
                status: p.is_active ? 'active' : 'scheduled',
                targetGroups: ['NA', 'EU', 'AP'],
                activePlayers: onlinePlayers,
                totalPlayers: totalPlayers,
                engagementScore: Math.floor(Math.random() * 30) + 70,
                updatedAt: p.updated_at || p.created_at
            }));

            setPlaylists(deployments);

            // Mock geographic data
            setGeoData([
                { region: 'North America', playerCount: Math.floor(onlinePlayers * 0.4), uptime: 98.5 },
                { region: 'Europe', playerCount: Math.floor(onlinePlayers * 0.3), uptime: 97.2 },
                { region: 'Asia Pacific', playerCount: Math.floor(onlinePlayers * 0.2), uptime: 99.1 },
                { region: 'Latin America', playerCount: Math.floor(onlinePlayers * 0.1), uptime: 96.8 }
            ]);

            setLoading(false);
        } catch (error) {
            console.error('Error fetching analytics data:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAnalyticsData();
        const interval = setInterval(fetchAnalyticsData, 30000); // Refresh every 30s
        return () => clearInterval(interval);
    }, [fetchAnalyticsData]);

    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
        return num.toFixed(0);
    };

    const getTimeAgo = (dateString: string): string => {
        const now = new Date();
        const then = new Date(dateString);
        const diffInHours = Math.floor((now.getTime() - then.getTime()) / 3600000);

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        const days = Math.floor(diffInHours / 24);
        if (days === 1) return '1d ago';
        return `${days}d ago`;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            <Header />

            <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8 flex flex-col gap-6">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white">Analytics</h1>
                        <p className="text-slate-400 mt-1">Comprehensive insights into content performance and network health</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {/* Date Range Filter */}
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                        />
                        {/* Metric Filter */}
                        <FilterDropdown
                            label="Metric"
                            options={[
                                { label: 'All Metrics', value: 'all', icon: 'analytics', color: 'text-blue-400' },
                                { label: 'Impressions', value: 'impressions', icon: 'visibility', color: 'text-blue-400' },
                                { label: 'Uptime', value: 'uptime', icon: 'router', color: 'text-emerald-400' },
                                { label: 'Utilization', value: 'utilization', icon: 'pie_chart', color: 'text-purple-400' },
                            ]}
                            value={metricFilters}
                            onChange={setMetricFilters}
                            icon="filter_list"
                        />
                        {/* Sort Filter */}
                        <SortDropdown
                            options={[
                                { label: 'Highest First', value: 'highest', direction: 'desc' },
                                { label: 'Lowest First', value: 'lowest', direction: 'asc' },
                                { label: 'Name (A-Z)', value: 'name-asc', direction: 'asc' },
                            ]}
                            value={sortBy}
                            onChange={setSortBy}
                        />
                        {/* Export Button */}
                        <ExportButton
                            data={playlists.map(playlist => ({
                                Name: playlist.name,
                                Status: playlist.status,
                                'Active Players': `${playlist.activePlayers}/${playlist.totalPlayers}`,
                                'Engagement Score': `${playlist.engagementScore}%`,
                                'Updated': getTimeAgo(playlist.updatedAt),
                            }))}
                            filename="analytics_report"
                            title="Analytics Export"
                        />
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total Impressions */}
                    <div className="p-5 rounded-xl glass-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 flex flex-col justify-between shadow-sm relative overflow-hidden group">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <span className="text-sm font-medium text-slate-400">Total Impressions</span>
                                <h3 className="text-3xl font-bold text-white mt-1">
                                    {loading ? '...' : formatNumber(stats.totalImpressions)}
                                </h3>
                            </div>
                            <div className="p-2 bg-blue-600/20 rounded-lg text-blue-500">
                                <span className="material-symbols-outlined text-[20px]">visibility</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">trending_up</span>
                                {stats.impressionsTrend.toFixed(1)}%
                            </span>
                            <span className="text-xs text-slate-500">vs last period</span>
                        </div>
                    </div>

                    {/* Network Uptime */}
                    <div className="p-5 rounded-xl glass-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <span className="text-sm font-medium text-slate-400">Network Uptime</span>
                                <h3 className="text-3xl font-bold text-white mt-1">
                                    {loading ? '...' : `${stats.networkUptime.toFixed(1)}%`}
                                </h3>
                            </div>
                            <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-500">
                                <span className="material-symbols-outlined text-[20px]">router</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">trending_up</span>
                                {stats.uptimeTrend.toFixed(1)}%
                            </span>
                            <span className="text-xs text-slate-500">vs last period</span>
                        </div>
                    </div>

                    {/* Content Utilization */}
                    <div className="p-5 rounded-xl glass-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <span className="text-sm font-medium text-slate-400">Content Utilization</span>
                                <h3 className="text-3xl font-bold text-white mt-1">
                                    {loading ? '...' : `${stats.contentUtilization.toFixed(0)}%`}
                                </h3>
                            </div>
                            <div className="p-2 bg-purple-500/20 rounded-lg text-purple-500">
                                <span className="material-symbols-outlined text-[20px]">pie_chart</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">trending_up</span>
                                {stats.utilizationTrend.toFixed(1)}%
                            </span>
                            <span className="text-xs text-slate-500">vs last period</span>
                        </div>
                    </div>

                    {/* Storage Efficiency */}
                    <div className="p-5 rounded-xl glass-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 flex flex-col justify-between shadow-sm relative overflow-hidden">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <span className="text-sm font-medium text-slate-400">Storage Efficiency</span>
                                <h3 className="text-3xl font-bold text-white mt-1">
                                    {loading ? '...' : `${stats.storageEfficiency.toFixed(1)}GB`}
                                </h3>
                            </div>
                            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                                <span className="material-symbols-outlined text-[20px]">storage</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                <span className="material-symbols-outlined text-[12px]">trending_down</span>
                                {Math.abs(stats.storageTrend).toFixed(1)}%
                            </span>
                            <span className="text-xs text-slate-500">vs last period</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Top Content Sidebar */}
                    <div className="lg:col-span-3 glass-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl flex flex-col max-h-[600px]">
                        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between sticky top-0 bg-slate-800/95 backdrop-blur z-10 rounded-t-xl">
                            <h3 className="font-semibold text-white">Top Content</h3>
                            <button className="text-xs text-blue-400 hover:text-blue-300 font-medium">View All</button>
                        </div>
                        <div className="overflow-y-auto flex-1 p-2 space-y-1">
                            {loading ? (
                                <>
                                    <div className="h-16 bg-slate-700/50 rounded animate-pulse"></div>
                                    <div className="h-16 bg-slate-700/50 rounded animate-pulse"></div>
                                    <div className="h-16 bg-slate-700/50 rounded animate-pulse"></div>
                                </>
                            ) : (
                                topContent.map((item, index) => (
                                    <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg group cursor-pointer transition-colors">
                                        <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0 bg-slate-700">
                                            {item.thumbnail ? (
                                                <img alt={item.filename} className="w-full h-full object-cover" src={item.thumbnail} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                                    <span className="material-symbols-outlined text-[20px]">
                                                        {item.type === 'video' ? 'movie' : 'image'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-medium text-slate-200 truncate">{item.filename}</h4>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                <span className="text-emerald-500 font-medium">{formatNumber(item.plays)} plays</span>
                                                <span>•</span>
                                                <span>{item.totalHours}h</span>
                                            </div>
                                        </div>
                                        <div className="text-xs font-bold text-slate-400 group-hover:text-white">#{index + 1}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Upload & Sync Activity Chart */}
                    <div className="lg:col-span-9 glass-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 flex flex-col shadow-lg relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 z-10">
                            <div>
                                <h3 className="text-lg font-bold text-white">Upload & Sync Activity</h3>
                                <p className="text-sm text-slate-400">Content uploads and player synchronization events over time</p>
                            </div>
                            <div className="flex items-center gap-2 mt-2 sm:mt-0">
                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-slate-700/50">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span className="text-xs text-slate-300">Uploads</span>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 rounded-full border border-slate-700/50">
                                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                    <span className="text-xs text-slate-300">Syncs</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 relative w-full min-h-[300px]">
                            {loading ? (
                                <div className="w-full h-full flex items-center justify-center">
                                    <div className="text-slate-500">Loading chart...</div>
                                </div>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-[48px] mb-2">show_chart</span>
                                        <p className="text-sm">Activity chart visualization</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Content Type Distribution & Network Health */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Content Type Distribution */}
                    <div className="glass-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Content Type Distribution</h3>
                        <div className="flex items-center justify-center min-h-[250px]">
                            {loading ? (
                                <div className="text-slate-500">Loading...</div>
                            ) : (
                                <div className="flex flex-col items-center gap-4 w-full">
                                    {/* Simple bar representation */}
                                    {contentTypes.map((type) => (
                                        <div key={type.type} className="w-full">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-sm font-medium text-slate-300">{type.type}</span>
                                                <span className="text-xs text-slate-500">{type.count} ({type.percentage.toFixed(0)}%)</span>
                                            </div>
                                            <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${type.percentage}%`,
                                                        backgroundColor: type.color
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Geographic Distribution */}
                    <div className="glass-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">Geographic Distribution</h3>
                        <div className="space-y-3">
                            {loading ? (
                                <>
                                    <div className="h-12 bg-slate-700/50 rounded animate-pulse"></div>
                                    <div className="h-12 bg-slate-700/50 rounded animate-pulse"></div>
                                    <div className="h-12 bg-slate-700/50 rounded animate-pulse"></div>
                                </>
                            ) : (
                                geoData.map((region) => (
                                    <div key={region.region} className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-600/20 rounded-lg text-blue-500">
                                                <span className="material-symbols-outlined text-[20px]">location_on</span>
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-medium text-white">{region.region}</h4>
                                                <p className="text-xs text-slate-500">{region.playerCount} players</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium text-emerald-500">{region.uptime.toFixed(1)}%</div>
                                            <div className="text-xs text-slate-500">uptime</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Playlist Deployment Status Table */}
                <div className="glass-card bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl overflow-hidden shadow-lg">
                    <div className="p-6 border-b border-slate-700/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">Playlist Deployment Status</h3>
                            <p className="text-sm text-slate-400">Active content sequences across player groups</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                                    <span className="material-symbols-outlined text-[18px]">search</span>
                                </span>
                                <input
                                    className="bg-slate-900/50 border border-slate-700/50 text-sm text-white rounded-lg pl-9 pr-4 py-2 outline-none focus:border-blue-600 w-64"
                                    placeholder="Search playlists..."
                                    type="text"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900/50 text-xs uppercase font-semibold text-slate-500">
                                <tr>
                                    <th className="px-6 py-4">Playlist Name</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Target Groups</th>
                                    <th className="px-6 py-4">Active Players</th>
                                    <th className="px-6 py-4">Engagement Score</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-700/50">
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            Loading playlists...
                                        </td>
                                    </tr>
                                ) : playlists.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                                            No playlists found
                                        </td>
                                    </tr>
                                ) : (
                                    playlists.map((playlist) => (
                                        <tr key={playlist.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center text-blue-500 font-bold border border-white/5">
                                                        {playlist.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-white">{playlist.name}</div>
                                                        <div className="text-xs text-slate-500">Updated {getTimeAgo(playlist.updatedAt)}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${playlist.status === 'active'
                                                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/50'
                                                    }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${playlist.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                                                        }`}></span>
                                                    {playlist.status.charAt(0).toUpperCase() + playlist.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex -space-x-2">
                                                    {playlist.targetGroups.slice(0, 3).map((group, idx) => (
                                                        <div
                                                            key={group}
                                                            className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-800 flex items-center justify-center text-[10px] text-white"
                                                            title={group}
                                                        >
                                                            {group}
                                                        </div>
                                                    ))}
                                                    {playlist.targetGroups.length > 3 && (
                                                        <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-slate-800 flex items-center justify-center text-[10px] text-slate-400">
                                                            +{playlist.targetGroups.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-white font-medium">
                                                {playlist.activePlayers} / {playlist.totalPlayers}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="w-full max-w-[100px] bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{
                                                            width: `${playlist.engagementScore}%`,
                                                            backgroundColor: playlist.engagementScore > 80 ? '#10b981' : playlist.engagementScore > 60 ? '#3b82f6' : '#f59e0b'
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs mt-1 block" style={{
                                                    color: playlist.engagementScore > 80 ? '#10b981' : playlist.engagementScore > 60 ? '#3b82f6' : '#f59e0b'
                                                }}>
                                                    {playlist.engagementScore}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                                                    <span className="material-symbols-outlined text-[20px]">more_vert</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}

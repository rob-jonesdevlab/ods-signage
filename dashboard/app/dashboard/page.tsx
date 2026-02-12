'use client';
import { API_URL } from '@/lib/api';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
    activePlayers: number;
    totalPlayers: number;
    totalContent: number;
    storageUsed: number;
    storageTotal: number;
    storagePercentage: number;
    activePlaylists: number;
    scheduledPlaylists: number;
    networkUptime: number;
}

interface ActivityItem {
    id: string;
    type: 'playlist' | 'content' | 'player' | 'system';
    message: string;
    details: string;
    timestamp: string;
    color: 'blue' | 'purple' | 'orange' | 'emerald';
}

export default function DashboardPage() {
    const { profile } = useAuth();
    const displayName = profile?.full_name || profile?.email?.split('@')[0] || 'User';

    const [stats, setStats] = useState<DashboardStats>({
        activePlayers: 0,
        totalPlayers: 0,
        totalContent: 0,
        storageUsed: 0,
        storageTotal: 20,
        storagePercentage: 0,
        activePlaylists: 0,
        scheduledPlaylists: 0,
        networkUptime: 99.8
    });
    const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchDashboardData = useCallback(async () => {
        try {
            // Fetch players
            const playersRes = await fetch(`${API_URL}/api/players`);
            const players = await playersRes.json();

            // Fetch content
            const contentRes = await fetch(`${API_URL}/api/content`);
            const content = await contentRes.json();

            // Fetch playlists
            const playlistsRes = await fetch(`${API_URL}/api/playlists`);
            const playlists = await playlistsRes.json();

            // Calculate storage from content metadata
            const totalBytes = content.reduce((sum: number, item: any) => {
                return sum + (item.metadata?.size || 0);
            }, 0);
            const storageGB = totalBytes / (1024 * 1024 * 1024);
            const storageTotal = 20; // GB
            const storagePercentage = Math.min((storageGB / storageTotal) * 100, 100);

            // Count active players (status === 'online')
            const activePlayers = players.filter((p: any) => p.status === 'online').length;

            // Count active playlists (is_active === 1)
            const activePlaylists = playlists.filter((p: any) => p.is_active === 1).length;

            setStats({
                activePlayers,
                totalPlayers: players.length,
                totalContent: content.length,
                storageUsed: storageGB,
                storageTotal,
                storagePercentage,
                activePlaylists,
                scheduledPlaylists: playlists.length - activePlaylists,
                networkUptime: 99.8 // TODO: Calculate from player uptime data
            });

            // Generate recent activity from API data
            const activities: ActivityItem[] = [];

            // Add recent playlists
            const recentPlaylists = playlists
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 1);

            recentPlaylists.forEach((playlist: any) => {
                const playersCount = players.filter((p: any) => p.status === 'online').length;
                activities.push({
                    id: `playlist-${playlist.id}`,
                    type: 'playlist',
                    message: `New Playlist deployed to ${playlist.name}`,
                    details: `Successfully synced with ${playersCount} players.`,
                    timestamp: playlist.created_at,
                    color: 'blue'
                });
            });

            // Add recent content uploads
            const recentContent = content
                .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .slice(0, 1);

            recentContent.forEach((item: any) => {
                const sizeInMB = ((item.metadata?.size || item.size || 0) / (1024 * 1024)).toFixed(1);
                activities.push({
                    id: `content-${item.id}`,
                    type: 'content',
                    message: `Content Upload: ${item.filename}`,
                    details: `Uploaded by System • ${sizeInMB}MB`,
                    timestamp: item.created_at,
                    color: 'purple'
                });
            });

            // Add offline player alerts
            const offlinePlayers = players.filter((p: any) => p.status === 'offline').slice(0, 1);
            offlinePlayers.forEach((player: any) => {
                activities.push({
                    id: `player-${player.id}`,
                    type: 'player',
                    message: `Player Offline Alert: ${player.name}`,
                    details: 'Connectivity lost. Automatic retry scheduled.',
                    timestamp: player.last_seen || player.created_at,
                    color: 'orange'
                });
            });

            // Add system update (static for now)
            activities.push({
                id: 'system-update',
                type: 'system',
                message: 'System Update Completed',
                details: 'All players updated to Firmware v3.4.1',
                timestamp: new Date(Date.now() - 86400000).toISOString(), // Yesterday
                color: 'emerald'
            });

            // Sort by timestamp and take top 4
            const sortedActivities = activities
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, 4);

            setRecentActivity(sortedActivities);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);

        return () => clearInterval(interval);
    }, [fetchDashboardData]);

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            <Header />

            <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8 flex flex-col gap-8">
                {/* Page Header */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Welcome back, {displayName}</h1>
                        <p className="text-slate-400 mt-1 text-sm md:text-base">Here's what's happening with your digital signage network today.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {/* Date Range Filter */}
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-all border border-slate-700 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-slate-600">
                            <span className="material-symbols-outlined text-[18px] text-slate-400">calendar_today</span>
                            Last 7 Days
                            <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
                        </button>

                        {/* Status Filter */}
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-all border border-slate-700 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-slate-600">
                            <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
                            All Status
                            <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
                        </button>

                        {/* Sort Filter */}
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/50 hover:bg-slate-800 text-white rounded-xl text-sm font-medium transition-all border border-slate-700 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-slate-600">
                            <span className="material-symbols-outlined text-[18px] text-blue-400">sort</span>
                            Newest First
                            <span className="material-symbols-outlined text-[16px] text-slate-400">expand_more</span>
                        </button>

                        {/* Export Button */}
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/20 border border-blue-500">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Export
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {/* Active Players */}
                    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-blue-500">monitor</span>
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20 text-blue-400">
                                <span className="material-symbols-outlined text-xl">monitor</span>
                            </div>
                            <div className="flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                                <span className="material-symbols-outlined text-sm mr-0.5">trending_up</span>
                                +3
                            </div>
                        </div>
                        <div className="mb-2">
                            <p className="text-sm font-medium text-slate-400">Active Players</p>
                            {loading ? (
                                <div className="h-9 bg-slate-700/50 rounded animate-pulse mt-1"></div>
                            ) : (
                                <h3 className="text-3xl font-bold text-white mt-1">{stats.activePlayers}<span className="text-lg text-slate-500 font-normal ml-1">/ {stats.totalPlayers}</span></h3>
                            )}
                        </div>
                        <div className="flex items-end gap-1 h-8 mt-4">
                            <div className="w-1/6 bg-blue-900/40 h-[40%] rounded-sm"></div>
                            <div className="w-1/6 bg-blue-900/40 h-[60%] rounded-sm"></div>
                            <div className="w-1/6 bg-blue-900/40 h-[50%] rounded-sm"></div>
                            <div className="w-1/6 bg-blue-900/40 h-[80%] rounded-sm"></div>
                            <div className="w-1/6 bg-blue-800/60 h-[70%] rounded-sm"></div>
                            <div className="w-1/6 bg-blue-500 h-[90%] rounded-sm shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        </div>
                    </div>

                    {/* Total Content */}
                    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/30 transition-colors bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <span className="material-symbols-outlined text-6xl text-purple-500">perm_media</span>
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20 text-purple-400">
                                <span className="material-symbols-outlined text-xl">perm_media</span>
                            </div>
                            <div className="text-xs font-medium text-slate-400">
                                75% Used
                            </div>
                        </div>
                        <div className="mb-2">
                            <p className="text-sm font-medium text-slate-400">Total Content</p>
                            {loading ? (
                                <div className="h-9 bg-slate-700/50 rounded animate-pulse mt-1"></div>
                            ) : (
                                <h3 className="text-3xl font-bold text-white mt-1">{stats.totalContent.toLocaleString()}</h3>
                            )}
                        </div>
                        <div className="mt-5">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Storage</span>
                                {loading ? (
                                    <div className="h-3 w-20 bg-slate-700/50 rounded animate-pulse"></div>
                                ) : (
                                    <span>{stats.storageUsed.toFixed(1)}GB / {stats.storageTotal}GB</span>
                                )}
                            </div>
                            <div className="w-full bg-slate-800 rounded-full h-2">
                                <div className="bg-gradient-to-r from-purple-600 to-indigo-500 h-2 rounded-full shadow-[0_0_10px_rgba(147,51,234,0.3)]" style={{ width: `${stats.storagePercentage}%` }}></div>
                            </div>
                        </div>
                    </div>

                    {/* Active Playlists */}
                    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-orange-500/30 transition-colors bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20 text-orange-400">
                                <span className="material-symbols-outlined text-xl">featured_play_list</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-end">
                            <div className="mb-2">
                                <p className="text-sm font-medium text-slate-400">Active Playlists</p>
                                {loading ? (
                                    <div className="h-9 bg-slate-700/50 rounded animate-pulse mt-1"></div>
                                ) : (
                                    <>
                                        <h3 className="text-3xl font-bold text-white mt-1">{stats.activePlaylists}</h3>
                                        <p className="text-xs text-slate-500 mt-1">{stats.scheduledPlaylists} scheduled for later</p>
                                    </>
                                )}
                            </div>
                            <div className="relative size-12 mr-2">
                                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                    <path className="text-slate-800" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4"></path>
                                    <path className="text-orange-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="75, 100" strokeLinecap="round" strokeWidth="4"></path>
                                </svg>
                            </div>
                        </div>
                    </div>

                    {/* Network Uptime */}
                    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl group-hover:bg-emerald-500/30 transition-colors"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                                <span className="material-symbols-outlined text-xl">check_circle</span>
                            </div>
                            <div className="p-1 bg-emerald-500/20 rounded-full">
                                <span className="material-symbols-outlined text-emerald-400 text-sm">check</span>
                            </div>
                        </div>
                        <div className="mb-2">
                            <p className="text-sm font-medium text-slate-400">Network Uptime</p>
                            {loading ? (
                                <div className="h-9 bg-slate-700/50 rounded animate-pulse mt-1"></div>
                            ) : (
                                <h3 className="text-3xl font-bold text-white mt-1">{stats.networkUptime}%</h3>
                            )}
                        </div>
                        <p className="text-xs text-emerald-400 mt-4 flex items-center gap-1">
                            <span className="material-symbols-outlined text-sm">verified</span>
                            System is healthy
                        </p>
                    </div>
                </div>

                {/* Recent Activity & Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Recent Activity */}
                    <div className="lg:col-span-3 glass-card rounded-2xl p-6 border border-slate-800 bg-slate-800/50 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
                            <button className="text-xs font-medium text-blue-400 hover:text-blue-300">View All</button>
                        </div>
                        <div className="relative pl-4 border-l border-slate-800 space-y-8">
                            {loading ? (
                                <>
                                    <div className="h-16 bg-slate-700/50 rounded animate-pulse"></div>
                                    <div className="h-16 bg-slate-700/50 rounded animate-pulse"></div>
                                    <div className="h-16 bg-slate-700/50 rounded animate-pulse"></div>
                                </>
                            ) : recentActivity.length > 0 ? (
                                recentActivity.map((activity) => {
                                    const getTimeAgo = (timestamp: string) => {
                                        const now = new Date();
                                        const then = new Date(timestamp);
                                        const diffInMs = now.getTime() - then.getTime();
                                        const diffInMinutes = Math.floor(diffInMs / 60000);
                                        const diffInHours = Math.floor(diffInMs / 3600000);
                                        const diffInDays = Math.floor(diffInMs / 86400000);

                                        if (diffInMinutes < 1) return 'Just now';
                                        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
                                        if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
                                        if (diffInDays === 1) return 'Yesterday';
                                        return `${diffInDays} days ago`;
                                    };

                                    const colorClasses = {
                                        blue: 'bg-blue-500',
                                        purple: 'bg-purple-500',
                                        orange: 'bg-orange-500',
                                        emerald: 'bg-emerald-500'
                                    };

                                    return (
                                        <div key={activity.id} className="relative pl-6">
                                            <div className={`absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full ${colorClasses[activity.color]} ring-4 ring-slate-900/50`}></div>
                                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1">
                                                <div>
                                                    <p className="text-sm font-medium text-white" dangerouslySetInnerHTML={{ __html: activity.message.replace(/(deployed to|Upload:|Alert:) (.+?)(?=<|$)/, '$1 <span class="text-' + activity.color + '-400">$2</span>') }}></p>
                                                    <p className="text-xs text-slate-500 mt-1">{activity.details}</p>
                                                </div>
                                                <span className="text-xs text-slate-500 whitespace-nowrap">{getTimeAgo(activity.timestamp)}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    No recent activity
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Performance & System Health */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        {/* Performance Chart */}
                        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex-1 flex flex-col bg-slate-800/50 backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-white">Performance</h2>
                                <select className="bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none">
                                    <option>Last 24h</option>
                                    <option>Last 7d</option>
                                    <option>Last 30d</option>
                                </select>
                            </div>
                            <div className="relative flex-1 min-h-[160px] w-full flex items-end justify-between gap-1 pt-8 px-2">
                                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                                    <div className="border-t border-slate-800 w-full h-0"></div>
                                    <div className="border-t border-slate-800/50 w-full h-0"></div>
                                    <div className="border-t border-slate-800/50 w-full h-0"></div>
                                    <div className="border-t border-slate-800/50 w-full h-0"></div>
                                </div>
                                <div className="w-full h-full flex items-end gap-1 z-10">
                                    <div className="flex-1 bg-blue-500/20 rounded-t-sm h-[30%]"></div>
                                    <div className="flex-1 bg-blue-500/30 rounded-t-sm h-[35%]"></div>
                                    <div className="flex-1 bg-blue-500/40 rounded-t-sm h-[45%]"></div>
                                    <div className="flex-1 bg-blue-500/50 rounded-t-sm h-[40%]"></div>
                                    <div className="flex-1 bg-blue-500/40 rounded-t-sm h-[55%]"></div>
                                    <div className="flex-1 bg-blue-500/30 rounded-t-sm h-[65%]"></div>
                                    <div className="flex-1 bg-blue-500/40 rounded-t-sm h-[75%]"></div>
                                    <div className="flex-1 bg-blue-500/60 rounded-t-sm h-[80%]"></div>
                                    <div className="flex-1 bg-blue-500/80 rounded-t-sm h-[70%]"></div>
                                    <div className="flex-1 bg-blue-500 rounded-t-sm h-[85%]"></div>
                                    <div className="flex-1 bg-blue-500/70 rounded-t-sm h-[75%]"></div>
                                    <div className="flex-1 bg-blue-500/50 rounded-t-sm h-[60%]"></div>
                                    <div className="flex-1 bg-blue-500/40 rounded-t-sm h-[65%]"></div>
                                    <div className="flex-1 bg-blue-500/30 rounded-t-sm h-[50%]"></div>
                                    <div className="flex-1 bg-blue-500/20 rounded-t-sm h-[40%]"></div>
                                </div>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 mt-2 px-1">
                                <span>00:00</span>
                                <span>06:00</span>
                                <span>12:00</span>
                                <span>18:00</span>
                                <span>Now</span>
                            </div>
                        </div>

                        {/* System Health */}
                        <div className="glass-card rounded-2xl p-6 border border-slate-800 bg-slate-800/50 backdrop-blur-sm">
                            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">System Health</h2>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-500">
                                            <span className="material-symbols-outlined text-lg">database</span>
                                        </div>
                                        <span className="text-sm text-white">Database Latency</span>
                                    </div>
                                    <span className="text-sm font-medium text-emerald-400">12ms</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-500">
                                            <span className="material-symbols-outlined text-lg">cloud_queue</span>
                                        </div>
                                        <span className="text-sm text-white">API Response</span>
                                    </div>
                                    <span className="text-sm font-medium text-blue-400">45ms</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-md bg-purple-500/10 text-purple-500">
                                            <span className="material-symbols-outlined text-lg">memory</span>
                                        </div>
                                        <span className="text-sm text-white">Server Load</span>
                                    </div>
                                    <span className="text-sm font-medium text-purple-400">24%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

'use client';

// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { API_URL } from '@/lib/api';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header';
import NewScheduleModal, { ScheduleFormData } from '@/components/NewScheduleModal';

interface OperationsStats {
    serverUptime: number;
    databaseLatency: number;
    storageUsed: number;
    storageTotal: number;
    storagePercentage: number;
}

interface Alert {
    id: string;
    type: 'critical' | 'warning';
    message: string;
    details: string;
}

interface AuditLog {
    id: string;
    user_email: string;
    action: string;
    resource_type: string;
    resource_id: string;
    details: string;
    created_at: string;
}

export default function OperationsPage() {
    const [stats, setStats] = useState<OperationsStats>({
        serverUptime: 99.9,
        databaseLatency: 0,
        storageUsed: 0,
        storageTotal: 20,
        storagePercentage: 0
    });
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const fetchOperationsData = useCallback(async () => {
        try {
            // Fetch players for system metrics
            const playersRes = await fetch(`${API_URL}/api/players`);
            const players = await playersRes.json();

            // Fetch content for storage metrics
            const contentRes = await fetch(`${API_URL}/api/content`);
            const content = await contentRes.json();

            // Calculate storage from content metadata
            const totalBytes = content.reduce((sum: any, item: any) => {
                return sum + (item.metadata?.size || item.size || 0);
            }, 0);
            const storageGB = totalBytes / (1024 * 1024 * 1024);
            const storageTotal = 20; // GB
            const storagePercentage = Math.min((storageGB / storageTotal) * 100, 100);

            // Mock database latency (in production, this would come from actual metrics)
            const databaseLatency = Math.floor(Math.random() * 20) + 15; // 15-35ms

            setStats({
                serverUptime: 99.9,
                databaseLatency,
                storageUsed: storageGB,
                storageTotal,
                storagePercentage
            });

            // Generate alerts from offline players and storage
            const generatedAlerts: Alert[] = [];

            const offlinePlayers = players.filter((p: any) => p.status === 'offline');
            if (offlinePlayers.length > 0) {
                generatedAlerts.push({
                    id: 'offline-players',
                    type: 'critical',
                    message: `${offlinePlayers.length} Player${offlinePlayers.length > 1 ? 's' : ''} Offline`,
                    details: `${offlinePlayers.map((p: any) => p.name).join(', ')} • Check connectivity`
                });
            }

            if (storagePercentage > 75) {
                generatedAlerts.push({
                    id: 'storage-warning',
                    type: 'warning',
                    message: 'Approaching Storage Limit',
                    details: `${storagePercentage.toFixed(0)}% Used • Consider archiving old content`
                });
            }

            setAlerts(generatedAlerts);

            // Fetch audit logs
            try {
                const auditRes = await fetch(`${API_URL}/api/audit-logs?limit=10`);
                const auditData = await auditRes.json();
                setAuditLogs(auditData);
            } catch (error) {
                console.error('Error fetching audit logs:', error);
            }

            setLoading(false);
        } catch (error) {
            console.error('Error fetching operations data:', error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOperationsData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(fetchOperationsData, 30000);

        return () => clearInterval(interval);
    }, [fetchOperationsData]);

    const handleCreateSchedule = async (scheduleData: ScheduleFormData) => {
        try {
            // TODO: Implement API call to create schedule
            console.log('Creating schedule:', scheduleData);
            // const response = await fetch(`${API_URL}/api/schedules`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify(scheduleData),
            // });
            // if (!response.ok) throw new Error('Failed to create schedule');

            // Show success message (you can add a toast notification here)
            alert('Schedule created successfully!');

            // Refresh data to show new schedule
            await fetchOperationsData();
        } catch (error) {
            console.error('Error creating schedule:', error);
            alert('Failed to create schedule. Please try again.');
        }
    };

    return (
        <div className="min-h-screen">
            <main className="flex-1 w-full max-w-[1400px] mx-auto p-6 md:p-8 lg:px-12 flex flex-col gap-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">System Operations</h1>
                        <p className="text-gray-500 mt-1">Monitor infrastructure health and manage scheduled deployments.</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => fetchOperationsData()}
                            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-200 shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                            Refresh Data
                        </button>
                        <button
                            onClick={() => setIsScheduleModalOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors shadow-md shadow-blue-500/20"
                        >
                            <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            New Schedule
                        </button>
                    </div>
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Server Status */}
                    <div className="glass-panel p-5 rounded-lg border-l-4 border-l-emerald-600 bg-white shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-500">Server Status</span>
                            <span className="material-symbols-outlined text-emerald-600">dns</span>
                        </div>
                        <div className="flex items-end gap-2">
                            {loading ? (
                                <div className="h-8 bg-gray-100 rounded animate-pulse w-24"></div>
                            ) : (
                                <>
                                    <span className="text-2xl font-bold text-gray-900">{stats.serverUptime.toFixed(3)}%</span>
                                    <span className="text-xs text-emerald-600 mb-1">Uptime</span>
                                </>
                            )}
                        </div>
                        <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> All regions operational
                        </div>
                    </div>

                    {/* Database Load */}
                    <div className="glass-panel p-5 rounded-lg border-l-4 border-l-emerald-600 bg-white shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-gray-500">Database Load</span>
                            <span className="material-symbols-outlined text-emerald-600">database</span>
                        </div>
                        <div className="flex items-end gap-2">
                            {loading ? (
                                <div className="h-8 bg-gray-100 rounded animate-pulse w-20"></div>
                            ) : (
                                <>
                                    <span className="text-2xl font-bold text-gray-900">{stats.databaseLatency}ms</span>
                                    <span className="text-xs text-emerald-600 mb-1">Latency</span>
                                </>
                            )}
                        </div>
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min((stats.databaseLatency / 100) * 100, 100)}%` }}></div>
                        </div>
                    </div>

                    {/* Storage Usage */}
                    <div className="glass-panel p-5 rounded-lg border-l-4 border-l-amber-600 bg-amber-50 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-amber-600">Storage Usage</span>
                            <span className="material-symbols-outlined text-amber-600">hard_drive</span>
                        </div>
                        <div className="flex items-end gap-2">
                            {loading ? (
                                <div className="h-8 bg-gray-100 rounded animate-pulse w-20"></div>
                            ) : (
                                <>
                                    <span className="text-2xl font-bold text-gray-900">{stats.storagePercentage.toFixed(0)}%</span>
                                    <span className="text-xs text-amber-600 mb-1">{stats.storagePercentage > 75 ? 'Warning' : 'Normal'}</span>
                                </>
                            )}
                        </div>
                        <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${stats.storagePercentage}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                    {/* Left Column - Scheduled Updates & Active Alerts */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        {/* Scheduled Updates */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600">calendar_month</span>
                                    Scheduled Updates
                                </h2>
                                <button className="text-sm text-blue-600 hover:text-blue-500 font-medium">View Calendar</button>
                            </div>
                            <div className="relative pl-4 border-l border-gray-200 space-y-8">
                                {/* Update 1 */}
                                <div className="relative group">
                                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-blue-500 bg-white group-hover:bg-blue-500 transition-colors"></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-600 uppercase">Playlist</span>
                                                <h3 className="text-sm font-semibold text-gray-900">Q3 Marketing Campaign</h3>
                                            </div>
                                            <p className="text-xs text-gray-500">Target: All Retail Displays (North America)</p>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                Today, 14:00 PM
                                            </div>
                                            <button className="px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-700 hover:text-blue-600 transition-colors">Edit</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Update 2 */}
                                <div className="relative group">
                                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-gray-300 bg-white group-hover:bg-gray-400 transition-colors"></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-600 uppercase">Firmware</span>
                                                <h3 className="text-sm font-semibold text-gray-900">Player OS Update v4.2.1</h3>
                                            </div>
                                            <p className="text-xs text-gray-500">Target: Lobby Screens (Group B)</p>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                Tomorrow, 02:00 AM
                                            </div>
                                            <button className="px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-700 hover:text-blue-600 transition-colors">Edit</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Update 3 */}
                                <div className="relative group">
                                    <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-gray-300 bg-white group-hover:bg-gray-400 transition-colors"></div>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-600 uppercase">Maint</span>
                                                <h3 className="text-sm font-semibold text-gray-900">Database Optimization</h3>
                                            </div>
                                            <p className="text-xs text-gray-500">System-wide performance tune</p>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs">
                                            <div className="flex items-center gap-1 text-gray-500">
                                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                Sat, 23:00 PM
                                            </div>
                                            <button className="px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-700 hover:text-blue-600 transition-colors">Edit</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Active Alerts */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-rose-600">warning</span>
                                    Active Alerts
                                </h2>
                                {alerts.filter(a => a.type === 'critical').length > 0 && (
                                    <span className="text-xs font-medium px-2 py-1 bg-rose-100 text-rose-600 rounded-full">
                                        {alerts.filter(a => a.type === 'critical').length} Critical
                                    </span>
                                )}
                            </div>
                            <div className="space-y-3">
                                {loading ? (
                                    <>
                                        <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                                        <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                                    </>
                                ) : alerts.length > 0 ? (
                                    alerts.map((alert) => (
                                        <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border ${alert.type === 'critical'
                                            ? 'border-rose-200 bg-rose-50'
                                            : 'border-amber-200 bg-amber-50'
                                            }`}>
                                            <div className="flex items-center gap-3">
                                                <span className={`material-symbols-outlined ${alert.type === 'critical' ? 'text-rose-600' : 'text-amber-600'
                                                    }`}>
                                                    {alert.type === 'critical' ? 'wifi_off' : 'sd_card_alert'}
                                                </span>
                                                <div>
                                                    <p className={`text-sm font-medium ${alert.type === 'critical' ? 'text-rose-900' : 'text-amber-900'
                                                        }`}>{alert.message}</p>
                                                    <p className={`text-xs ${alert.type === 'critical' ? 'text-rose-600' : 'text-amber-600'
                                                        }`}>{alert.details}</p>
                                                </div>
                                            </div>
                                            <button className={`text-xs font-medium hover:underline ${alert.type === 'critical' ? 'text-rose-600' : 'text-amber-600'
                                                }`}>
                                                {alert.type === 'critical' ? 'Troubleshoot' : 'Manage'}
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center justify-center h-20 text-gray-500 text-sm">
                                        No active alerts
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Audit Trail */}
                    <div className="lg:col-span-4 flex flex-col">
                        {/* Audit Trail */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-full">
                            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-600 text-[20px]">history</span>
                                    Audit Trail
                                </h3>
                                <button className="text-xs text-gray-500 hover:text-blue-600 transition-colors">View All</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
                                {loading ? (
                                    <div className="space-y-2 p-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                                        ))}
                                    </div>
                                ) : auditLogs.length > 0 ? (
                                    <ul className="space-y-1">
                                        {auditLogs.map((log) => (
                                            <li key={log.id} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group">
                                                <div className="relative shrink-0">
                                                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 ring-2 ring-white">
                                                        {log.user_email?.substring(0, 2).toUpperCase() || 'SY'}
                                                    </div>
                                                    <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full ring-2 ring-white ${log.action.includes('create') ? 'bg-green-500' :
                                                        log.action.includes('delete') ? 'bg-red-500' :
                                                            log.action.includes('update') ? 'bg-blue-500' :
                                                                'bg-gray-400'
                                                        }`}>
                                                        <span className="material-symbols-outlined text-[10px] block text-white">
                                                            {log.action.includes('create') ? 'add' :
                                                                log.action.includes('delete') ? 'delete' :
                                                                    log.action.includes('update') ? 'edit' :
                                                                        'check'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs text-gray-600 mb-0.5">
                                                        <span className="font-medium text-gray-900">{log.user_email || 'System'}</span>
                                                        {' '}{log.action} {log.resource_type}
                                                    </p>
                                                    {log.details && (
                                                        <p className="text-[10px] text-gray-500 truncate">{log.details}</p>
                                                    )}
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {new Date(log.created_at).toLocaleString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-40 text-gray-500">
                                        <span className="material-symbols-outlined text-4xl mb-2">history</span>
                                        <p className="text-sm">No audit logs yet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            <NewScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSubmit={handleCreateSchedule}
            />
        </div>
    );
}

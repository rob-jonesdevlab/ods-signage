'use client';

// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { API_URL } from '@/lib/api';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Header from '@/components/Header';
import NewScheduleModal, { ScheduleFormData } from '@/components/NewScheduleModal';
import AuditTrailModal, { AuditLogDetail } from '@/components/AuditTrailModal';
import SearchBar from '@/components/SearchBar';
import FilterDropdown from '@/components/FilterDropdown';
import SortDropdown from '@/components/SortDropdown';
import ExportButton from '@/components/ExportButton';

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
    const [selectedAuditLog, setSelectedAuditLog] = useState<AuditLogDetail | null>(null);
    const [editingSchedule, setEditingSchedule] = useState<any | null>(null);

    // Filter states
    const [alertFilters, setAlertFilters] = useState<Record<string, string[]>>({
        type: []
    });
    const [auditSearchQuery, setAuditSearchQuery] = useState('');
    const [auditActionFilter, setAuditActionFilter] = useState<string[]>([]);
    const [auditResourceFilter, setAuditResourceFilter] = useState<string[]>([]);
    const [auditTimeRange, setAuditTimeRange] = useState('all');
    const [auditSortBy, setAuditSortBy] = useState('newest');

    // Scheduled updates state
    const [scheduledUpdates, setScheduledUpdates] = useState<any[]>([]);

    const fetchOperationsData = useCallback(async () => {
        try {
            // Fetch real system metrics
            const metricsRes = await fetch(`${API_URL}/api/system-metrics`, {
                credentials: 'include'
            });
            const metricsData = await metricsRes.json();

            setStats({
                serverUptime: metricsData.serverUptime,
                databaseLatency: metricsData.databaseLatency,
                storageUsed: metricsData.storageUsed,
                storageTotal: metricsData.storageTotal,
                storagePercentage: metricsData.storagePercentage
            });

            // Fetch players for alert generation
            const playersRes = await fetch(`${API_URL}/api/players`, {
                credentials: 'include'
            });
            const players = await playersRes.json();

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

            if (metricsData.storagePercentage > 75) {
                generatedAlerts.push({
                    id: 'storage-warning',
                    type: 'warning',
                    message: 'Approaching Storage Limit',
                    details: `${metricsData.storagePercentage.toFixed(0)}% Used • Consider archiving old content`
                });
            }

            setAlerts(generatedAlerts);

            // Fetch scheduled updates
            try {
                const scheduledRes = await fetch(`${API_URL}/api/scheduled-updates`, {
                    credentials: 'include'
                });
                const scheduledData = await scheduledRes.json();
                setScheduledUpdates(scheduledData);
            } catch (error) {
                console.error('Error fetching scheduled updates:', error);
            }

            // Fetch audit logs
            try {
                const auditRes = await fetch(`${API_URL}/api/audit-logs?limit=10`, {
                    credentials: 'include'
                });
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
            const isEditing = editingSchedule !== null;
            const url = isEditing
                ? `${API_URL}/api/scheduled-updates/${editingSchedule.id}`
                : `${API_URL}/api/scheduled-updates`;
            const method = isEditing ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: scheduleData.title,
                    type: scheduleData.type,
                    targets: scheduleData.targets,
                    scheduleDate: scheduleData.scheduleDate,
                    scheduleTime: scheduleData.scheduleTime,
                    recurrence: scheduleData.recurrence.enabled ? scheduleData.recurrence : null,
                    notifications: scheduleData.notifications
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || `Failed to ${isEditing ? 'update' : 'create'} schedule`);
            }

            // Show success message
            alert(`Schedule ${isEditing ? 'updated' : 'created'} successfully!`);

            // Close modal and reset editing state
            setIsScheduleModalOpen(false);
            setEditingSchedule(null);

            // Refresh data to show updated schedule
            await fetchOperationsData();
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert(`Failed to ${editingSchedule ? 'update' : 'create'} schedule. Please try again.`);
        }
    };

    const handleEditSchedule = (schedule: any) => {
        setEditingSchedule(schedule);
        setIsScheduleModalOpen(true);
    };

    const handleDeleteSchedule = async (scheduleId: string) => {
        if (!confirm('Are you sure you want to delete this scheduled update? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/scheduled-updates/${scheduleId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.details || 'Failed to delete schedule');
            }

            alert('Schedule deleted successfully!');
            await fetchOperationsData();
        } catch (error) {
            console.error('Error deleting schedule:', error);
            alert('Failed to delete schedule. Please try again.');
        }
    };




    // Filter alerts
    const filteredAlerts = useMemo(() => {
        return alerts.filter(alert => {
            if (alertFilters.type.length && !alertFilters.type.includes(alert.type)) return false;
            return true;
        });
    }, [alerts, alertFilters]);

    // Filter audit logs
    const filteredAuditLogs = useMemo(() => {
        let filtered = [...auditLogs];

        // Search filter
        if (auditSearchQuery) {
            filtered = filtered.filter(log =>
                log.user_email?.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                log.action?.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                log.resource_type?.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                log.details?.toLowerCase().includes(auditSearchQuery.toLowerCase())
            );
        }

        // Action filter
        if (auditActionFilter.length > 0) {
            filtered = filtered.filter(log =>
                auditActionFilter.some(a => log.action.toLowerCase().includes(a))
            );
        }

        // Resource type filter
        if (auditResourceFilter.length > 0) {
            filtered = filtered.filter(log => auditResourceFilter.includes(log.resource_type));
        }

        // Time range filter
        if (auditTimeRange && auditTimeRange !== 'all') {
            const now = Date.now();
            const ranges: Record<string, number> = {
                '1h': 3600000,
                '24h': 86400000,
                '7d': 604800000,
                '30d': 2592000000
            };
            if (ranges[auditTimeRange]) {
                filtered = filtered.filter(log => {
                    const logTime = new Date(log.created_at).getTime();
                    return now - logTime <= ranges[auditTimeRange];
                });
            }
        }

        // Sort
        filtered.sort((a, b) => {
            const timeA = new Date(a.created_at).getTime();
            const timeB = new Date(b.created_at).getTime();
            return auditSortBy === 'newest' ? timeB - timeA : timeA - timeB;
        });

        return filtered;
    }, [auditLogs, auditSearchQuery, auditActionFilter, auditResourceFilter, auditTimeRange, auditSortBy]);

    return (
        <div className="min-h-screen">
            <Header />
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
                        <ExportButton
                            data={filteredAuditLogs.map(log => ({
                                Timestamp: new Date(log.created_at).toLocaleString(),
                                Action: log.action,
                                Resource: log.resource_type,
                                User: log.user_email || 'System',
                                Details: log.details || 'N/A',
                            }))}
                            filename="operations_audit_logs"
                            title="Audit Logs Export"
                        />
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

                {/* Audit Trail Search + Filters */}
                <div className="flex flex-col md:flex-row gap-3">
                    <SearchBar
                        value={auditSearchQuery}
                        onChange={setAuditSearchQuery}
                        placeholder="Search audit logs..."
                        className="flex-1"
                    />
                    <div className="flex gap-2 flex-wrap">
                        <FilterDropdown
                            label="Action"
                            options={[
                                { value: 'create', label: 'Create', icon: 'add_circle', color: 'text-green-400' },
                                { value: 'update', label: 'Update', icon: 'edit', color: 'text-blue-400' },
                                { value: 'delete', label: 'Delete', icon: 'delete', color: 'text-red-400' },
                                { value: 'login', label: 'Login', icon: 'login', color: 'text-purple-400' }
                            ]}
                            value={auditActionFilter}
                            onChange={setAuditActionFilter}
                            icon="bolt"
                        />
                        <FilterDropdown
                            label="Resource"
                            options={[
                                { value: 'player', label: 'Player', icon: 'devices', color: 'text-blue-400' },
                                { value: 'playlist', label: 'Playlist', icon: 'playlist_play', color: 'text-purple-400' },
                                { value: 'content', label: 'Content', icon: 'perm_media', color: 'text-green-400' },
                                { value: 'schedule', label: 'Schedule', icon: 'schedule', color: 'text-amber-400' }
                            ]}
                            value={auditResourceFilter}
                            onChange={setAuditResourceFilter}
                            icon="category"
                        />
                        <FilterDropdown
                            label="Alert Type"
                            options={[
                                { value: 'critical', label: 'Critical', icon: 'error', color: 'text-rose-400' },
                                { value: 'warning', label: 'Warning', icon: 'warning', color: 'text-amber-400' }
                            ]}
                            value={alertFilters.type}
                            onChange={(values) => setAlertFilters(prev => ({ ...prev, type: values }))}
                            icon="warning"
                        />
                        <FilterDropdown
                            label="Time Range"
                            options={[
                                { value: '1h', label: 'Last Hour', icon: 'schedule' },
                                { value: '24h', label: 'Last 24 Hours', icon: 'today' },
                                { value: '7d', label: 'Last 7 Days', icon: 'date_range' },
                                { value: '30d', label: 'Last 30 Days', icon: 'calendar_month' },
                                { value: 'all', label: 'All Time', icon: 'all_inclusive' }
                            ]}
                            value={auditTimeRange ? [auditTimeRange] : []}
                            onChange={(values) => setAuditTimeRange(values[0] || 'all')}
                            icon="access_time"
                        />
                        <SortDropdown
                            options={[
                                { value: 'newest', label: 'Newest First', direction: 'desc' },
                                { value: 'oldest', label: 'Oldest First', direction: 'asc' }
                            ]}
                            value={auditSortBy}
                            onChange={setAuditSortBy}
                        />
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
                                <button
                                    onClick={() => alert('Calendar view coming soon! This will show a monthly calendar view of all scheduled updates.')}
                                    className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                                >
                                    View Calendar
                                </button>
                            </div>
                            <div className="relative pl-4 border-l border-gray-200 space-y-8">
                                {loading ? (
                                    <>
                                        <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                                        <div className="h-20 bg-gray-100 rounded-lg animate-pulse"></div>
                                    </>
                                ) : scheduledUpdates.length === 0 ? (
                                    <p className="text-sm text-gray-500 text-center py-8">
                                        No scheduled updates. Click "New Schedule" to create one.
                                    </p>
                                ) : (
                                    scheduledUpdates.map((update, index) => {
                                        const typeColors: Record<string, string> = {
                                            playlist: 'bg-purple-100 text-purple-600',
                                            firmware: 'bg-blue-100 text-blue-600',
                                            maintenance: 'bg-amber-100 text-amber-600',
                                            content: 'bg-green-100 text-green-600'
                                        };

                                        const scheduleDateTime = new Date(`${update.schedule_date}T${update.schedule_time}`);
                                        const isToday = scheduleDateTime.toDateString() === new Date().toDateString();
                                        const isSoon = index === 0; // First item is upcoming

                                        return (
                                            <div key={update.id} className="relative group">
                                                <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 ${isSoon ? 'border-blue-500 bg-white group-hover:bg-blue-500' : 'border-gray-300 bg-white group-hover:bg-gray-400'
                                                    } transition-colors`}></div>
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${typeColors[update.type]}`}>
                                                                {update.type}
                                                            </span>
                                                            <h3 className="text-sm font-semibold text-gray-900">{update.title}</h3>
                                                        </div>
                                                        <p className="text-xs text-gray-500">
                                                            Target: {Array.isArray(update.targets) ? update.targets.length : 0} device{update.targets?.length !== 1 ? 's' : ''}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-xs">
                                                        <div className="flex items-center gap-1 text-gray-500">
                                                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                            {isToday ? 'Today, ' : ''}{scheduleDateTime.toLocaleString([], {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => handleEditSchedule(update)}
                                                                className="px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-700 hover:text-blue-600 transition-colors"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteSchedule(update.id)}
                                                                className="px-3 py-1.5 rounded-md bg-white border border-gray-200 text-gray-700 hover:text-red-600 transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Active Alerts */}
                        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-rose-600">warning</span>
                                    Active Alerts
                                </h2>
                                {filteredAlerts.filter(a => a.type === 'critical').length > 0 && (
                                    <span className="text-xs font-medium px-2 py-1 bg-rose-100 text-rose-600 rounded-full">
                                        {filteredAlerts.filter(a => a.type === 'critical').length} Critical
                                    </span>
                                )}
                            </div>
                            <div className="space-y-3">
                                {loading ? (
                                    <>
                                        <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                                        <div className="h-16 bg-gray-100 rounded-lg animate-pulse"></div>
                                    </>
                                ) : filteredAlerts.length > 0 ? (
                                    filteredAlerts.map((alert) => (
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
                                ) : filteredAuditLogs.length > 0 ? (
                                    <ul className="space-y-1">
                                        {filteredAuditLogs.map((log) => (
                                            <li
                                                key={log.id}
                                                onClick={() => setSelectedAuditLog(log as AuditLogDetail)}
                                                className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors group cursor-pointer"
                                            >
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
                onClose={() => {
                    setIsScheduleModalOpen(false);
                    setEditingSchedule(null);
                }}
                onSubmit={handleCreateSchedule}
                initialData={editingSchedule ? {
                    title: editingSchedule.title,
                    type: editingSchedule.type,
                    targets: editingSchedule.targets,
                    scheduleDate: editingSchedule.schedule_date,
                    scheduleTime: editingSchedule.schedule_time,
                    recurrence: editingSchedule.recurrence || { enabled: false, pattern: 'daily', interval: 1 },
                    notifications: editingSchedule.notifications || { email: false, sms: false }
                } : undefined}
            />
            <AuditTrailModal
                isOpen={selectedAuditLog !== null}
                onClose={() => setSelectedAuditLog(null)}
                auditLog={selectedAuditLog}
            />
        </div>
    );
}

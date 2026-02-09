'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import ExportButton from '@/components/ExportButton';
import DateRangePicker from '@/components/DateRangePicker';
import FilterDropdown from '@/components/FilterDropdown';
import PairDeviceModal from '@/components/PairDeviceModal';

interface Player {
    id: string;
    name: string;
    cpu_serial: string;
    status: string;
    last_seen: string | null;
    created_at: string;
}

export default function PlayersPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const { showToast } = useToast();
    const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);

    // Filter states
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [statusFilters, setStatusFilters] = useState<string[]>([]);

    const statusFilterOptions = [
        { label: 'Online', value: 'online', icon: 'check_circle', color: 'text-green-400' },
        { label: 'Offline', value: 'offline', icon: 'cancel', color: 'text-slate-400' },
    ];

    useEffect(() => {
        // Fetch initial players
        fetch('http://localhost:3001/api/players')
            .then((res) => res.json())
            .then((data) => setPlayers(data))
            .catch((err) => console.error('Error fetching players:', err));

        // Connect to WebSocket
        const newSocket = io('http://localhost:3001');

        newSocket.on('connect', () => {
            console.log('✅ Connected to server');
            setConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            setConnected(false);
        });

        newSocket.on('player:status', (data) => {
            console.log('📊 Player status update:', data);

            // Show toast notification
            const player = data.player;
            const wasOnline = players.find(p => p.id === player.id)?.status === 'online';
            const isNowOnline = player.status === 'online';

            if (!wasOnline && isNowOnline) {
                showToast({
                    type: 'success',
                    title: 'Player Online',
                    message: `${player.name} is now online`,
                    duration: 5000
                });
            } else if (wasOnline && !isNowOnline) {
                showToast({
                    type: 'warning',
                    title: 'Player Offline',
                    message: `${player.name} has gone offline`,
                    duration: 5000
                });
            }

            // Refresh players list
            fetch('http://localhost:3001/api/players')
                .then((res) => res.json())
                .then((data) => setPlayers(data));
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online':
                return 'bg-emerald-500';
            case 'offline':
                return 'bg-slate-500';
            default:
                return 'bg-yellow-500';
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never';
        return new Date(dateString).toLocaleString();
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col">
            <Header />

            <main className="flex-1 w-full max-w-[1600px] mx-auto p-6 md:p-8 flex flex-col gap-8">
                {/* Page Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Players</h1>
                        <p className="text-slate-400 mt-1 text-sm md:text-base">Manage your digital signage players</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsPairingModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
                        >
                            <span className="material-symbols-outlined text-xl">add_circle</span>
                            Pair Device
                        </button>
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                        />
                        <FilterDropdown
                            label="Status"
                            options={statusFilterOptions}
                            value={statusFilters}
                            onChange={setStatusFilters}
                            icon="filter_list"
                        />
                        <ExportButton
                            data={players.map(player => ({
                                Name: player.name,
                                'CPU Serial': player.cpu_serial,
                                Status: player.status,
                                'Last Seen': formatDate(player.last_seen),
                                'Created At': new Date(player.created_at).toLocaleDateString(),
                            }))}
                            filename="players"
                            title="Players Export"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-blue-500/30 transition-colors bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                        <div className="text-3xl font-bold mb-2 text-white">{players.length}</div>
                        <div className="text-slate-400">Total Players</div>
                    </div>
                    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-emerald-500/30 transition-colors bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                        <div className="text-3xl font-bold mb-2 text-emerald-400">
                            {players.filter((p) => p.status === 'online').length}
                        </div>
                        <div className="text-slate-400">Online</div>
                    </div>
                    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group hover:border-slate-500/30 transition-colors bg-slate-800/50 backdrop-blur-sm border border-slate-700/50">
                        <div className="text-3xl font-bold mb-2 text-slate-400">
                            {players.filter((p) => p.status === 'offline').length}
                        </div>
                        <div className="text-slate-400">Offline</div>
                    </div>
                </div>

                {/* Players List */}
                <div className="glass-card rounded-2xl border border-slate-700/50 overflow-hidden bg-slate-800/50 backdrop-blur-sm">
                    <div className="p-6 border-b border-slate-700/50">
                        <h2 className="text-2xl font-bold text-white">All Players</h2>
                    </div>

                    {players.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <div className="text-6xl mb-4">📱</div>
                            <div className="text-xl mb-2">No players registered</div>
                            <div className="text-sm">Connect a player to get started</div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-900/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            CPU Serial
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            Last Seen
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                                            Created
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {players.map((player) => (
                                        <tr key={player.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${getStatusColor(player.status)}`} />
                                                    <span className="text-sm capitalize text-white">{player.status}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-white">
                                                {player.name}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 font-mono">
                                                {player.cpu_serial}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                {formatDate(player.last_seen)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                                                {formatDate(player.created_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Pair Device Modal */}
            <PairDeviceModal
                isOpen={isPairingModalOpen}
                onClose={() => setIsPairingModalOpen(false)}
                onSuccess={() => {
                    // Refresh players list
                    fetch('http://localhost:3001/api/players')
                        .then((res) => res.json())
                        .then((data) => setPlayers(data));

                    showToast({
                        type: 'success',
                        title: 'Device Paired',
                        message: 'Your device has been successfully paired',
                        duration: 5000
                    });
                }}
            />
        </div>
    );
}

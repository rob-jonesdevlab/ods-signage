'use client';

// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { API_URL } from '@/lib/api';
import { authenticatedFetch } from '@/lib/auth';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import Header from '@/components/Header';
import { useToast } from '@/hooks/useToast';
import ExportButton from '@/components/ExportButton';
import DateRangePicker from '@/components/DateRangePicker';
import FilterDropdown from '@/components/FilterDropdown';
import SearchBar from '@/components/SearchBar';
import PairDeviceModal from '@/components/PairDeviceModal';
import PlayerGroupTree, { PlayerGroup } from '@/components/PlayerGroupTree';
import NewGroupModal from '@/components/NewGroupModal';
import GroupContextMenu from '@/components/GroupContextMenu';
import RenameGroupModal from '@/components/RenameGroupModal';
import DeleteGroupModal from '@/components/DeleteGroupModal';
import DeployPlaylistModal from '@/components/DeployPlaylistModal';

interface Player {
    id: string;
    name: string;
    cpu_serial: string;
    status: string;
    last_seen: string | null;
    created_at: string;
    paired_at: string | null;
    pairing_code: string | null;
    group_id: string | null;
}

export default function PlayersPage() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [groups, setGroups] = useState<PlayerGroup[]>([]);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);
    const { showToast } = useToast();

    // Modals
    const [isPairingModalOpen, setIsPairingModalOpen] = useState(false);
    const [showNewGroupModal, setShowNewGroupModal] = useState(false);
    const [showRenameGroupModal, setShowRenameGroupModal] = useState(false);
    const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
    const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
    const [showDeployModal, setShowDeployModal] = useState(false);
    const [deployGroupId, setDeployGroupId] = useState<string | null>(null);

    // Context menu
    const [contextMenu, setContextMenu] = useState<{ groupId: string; x: number; y: number } | null>(null);

    // Drag and drop
    const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
    const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

    // Bulk operations
    const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    // Filter states
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [statusFilters, setStatusFilters] = useState<string[]>([]);

    const statusFilterOptions = [
        { label: 'Online', value: 'online', icon: 'check_circle', color: 'text-green-400' },
        { label: 'Offline', value: 'offline', icon: 'cancel', color: 'text-slate-400' },
    ];

    // Fetch groups
    const fetchGroups = async () => {
        try {
            const res = await authenticatedFetch(`${API_URL}/api/player-groups`);
            if (!res.ok) {
                console.error('Failed to fetch groups:', res.status);
                setGroups([]);
                return;
            }
            const data = await res.json();
            setGroups(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching groups:', error);
            setGroups([]);
        }
    };

    // Fetch players
    const fetchPlayers = async () => {
        try {
            const res = await authenticatedFetch(`${API_URL}/api/players`);
            if (!res.ok) {
                console.error('Failed to fetch players:', res.status);
                setPlayers([]);
                return;
            }
            const data = await res.json();
            setPlayers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching players:', error);
            setPlayers([]);
        }
    };

    useEffect(() => {
        fetchPlayers();
        fetchGroups();

        // Connect to WebSocket
        const newSocket = io(`${API_URL}`);

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

            fetchPlayers();
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, []);

    // Group handlers
    const handleCreateGroup = async (name: string, description: string, location: string) => {
        try {
            const res = await fetch(`${API_URL}/api/player-groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, description, location })
            });

            if (res.ok) {
                showToast({ type: 'success', title: 'Group Created', message: `${name} has been created` });
                fetchGroups();
            }
        } catch (error) {
            showToast({ type: 'error', title: 'Error', message: 'Failed to create group' });
        }
    };

    const handleRenameGroup = async (groupId: string, newName: string) => {
        try {
            const group = groups.find(g => g.id === groupId);
            const res = await authenticatedFetch(`${API_URL}/api/player-groups/${groupId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, description: group?.description, location: group?.location })
            });

            if (res.ok) {
                showToast({ type: 'success', title: 'Group Renamed', message: `Renamed to ${newName}` });
                fetchGroups();
            }
        } catch (error) {
            showToast({ type: 'error', title: 'Error', message: 'Failed to rename group' });
        }
    };

    const handleDeleteGroup = async (groupId: string) => {
        try {
            const res = await authenticatedFetch(`${API_URL}/api/player-groups/${groupId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                showToast({ type: 'success', title: 'Group Deleted', message: 'Group has been deleted' });
                if (selectedGroupId === groupId) {
                    setSelectedGroupId(null);
                }
                fetchGroups();
                fetchPlayers();
            }
        } catch (error) {
            showToast({ type: 'error', title: 'Error', message: 'Failed to delete group' });
        }
    };

    // Bulk operation handlers
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedPlayers([]);
            setSelectAll(false);
        } else {
            setSelectedPlayers(filteredPlayers.map(p => p.id));
            setSelectAll(true);
        }
    };

    const handleTogglePlayer = (playerId: string) => {
        if (selectedPlayers.includes(playerId)) {
            setSelectedPlayers(selectedPlayers.filter(id => id !== playerId));
            setSelectAll(false);
        } else {
            const newSelected = [...selectedPlayers, playerId];
            setSelectedPlayers(newSelected);
            if (newSelected.length === filteredPlayers.length) {
                setSelectAll(true);
            }
        }
    };

    const handleBulkAssignGroup = async (groupId: string) => {
        try {
            const res = await authenticatedFetch(`${API_URL}/api/player-groups/${groupId}/assign-players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_ids: selectedPlayers })
            });

            if (res.ok) {
                showToast({
                    type: 'success',
                    title: 'Players Assigned',
                    message: `${selectedPlayers.length} player(s) assigned to group`
                });
                setSelectedPlayers([]);
                setSelectAll(false);
                setShowBulkAssignModal(false);
                fetchPlayers();
                fetchGroups();
            }
        } catch (error) {
            showToast({ type: 'error', title: 'Error', message: 'Failed to assign players' });
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedPlayers.length} player(s)? This action cannot be undone.`)) {
            return;
        }

        try {
            await Promise.all(
                selectedPlayers.map(id =>
                    authenticatedFetch(`${API_URL}/api/players/${id}`, { method: 'DELETE' })
                )
            );

            showToast({
                type: 'success',
                title: 'Players Deleted',
                message: `${selectedPlayers.length} player(s) deleted successfully`
            });
            setSelectedPlayers([]);
            setSelectAll(false);
            fetchPlayers();
            fetchGroups();
        } catch (error) {
            showToast({ type: 'error', title: 'Error', message: 'Failed to delete players' });
        }
    };

    // Drag and drop handlers
    const handlePlayerDragStart = (playerId: string) => {
        setDraggedPlayerId(playerId);
    };

    const handleGroupDrop = async (groupId: string) => {
        if (!draggedPlayerId) return;

        try {
            const res = await authenticatedFetch(`${API_URL}/api/player-groups/${groupId}/assign-players`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ player_ids: [draggedPlayerId] })
            });

            if (res.ok) {
                const player = players.find(p => p.id === draggedPlayerId);
                const group = groups.find(g => g.id === groupId);
                showToast({
                    type: 'success',
                    title: 'Player Assigned',
                    message: `${player?.name} assigned to ${group?.name}`
                });
                fetchPlayers();
                fetchGroups();
            }
        } catch (error) {
            showToast({ type: 'error', title: 'Error', message: 'Failed to assign player' });
        } finally {
            setDraggedPlayerId(null);
            setDragOverGroup(null);
        }
    };

    // Filter players based on selected group, search, status, and date range
    const filteredPlayers = players.filter((player) => {
        // Group filter
        if (selectedGroupId && player.group_id !== selectedGroupId) return false;

        // Search filter (name, CPU serial, location)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesName = player.name.toLowerCase().includes(query);
            const matchesCpuSerial = player.cpu_serial.toLowerCase().includes(query);
            // Note: location field may not exist on all players
            const matchesLocation = (player as any).location?.toLowerCase().includes(query);
            if (!matchesName && !matchesCpuSerial && !matchesLocation) return false;
        }

        // Status filter
        if (statusFilters.length > 0 && !statusFilters.includes(player.status)) return false;

        // Date range filter
        if (dateRange.start || dateRange.end) {
            const lastSeen = player.last_seen ? new Date(player.last_seen) : null;
            if (!lastSeen) return false;
            if (dateRange.start && lastSeen < dateRange.start) return false;
            if (dateRange.end && lastSeen > dateRange.end) return false;
        }

        return true;
    });

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

    const selectedGroup = groups.find(g => g.id === contextMenu?.groupId);

    return (
        <div className="min-h-screen">
            <Header />
            <main className="w-full max-w-[1600px] mx-auto p-6 md:p-8 flex gap-6">
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0">
                    <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm sticky top-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Groups</h3>
                            <button
                                onClick={() => setShowNewGroupModal(true)}
                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                title="New Group"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                            </button>
                        </div>

                        <PlayerGroupTree
                            groups={groups}
                            selectedGroupId={selectedGroupId}
                            onSelectGroup={setSelectedGroupId}
                            onContextMenu={(groupId, event) => {
                                setContextMenu({ groupId, x: event.clientX, y: event.clientY });
                            }}
                            onGroupDrop={handleGroupDrop}
                            dragOverGroup={dragOverGroup}
                            setDragOverGroup={setDragOverGroup}
                        />
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-8">
                    {/* Page Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
                                {selectedGroupId ? groups.find(g => g.id === selectedGroupId)?.name : 'All Players'}
                            </h1>
                            <p className="text-gray-500 mt-1 text-sm md:text-base">
                                {selectedGroupId
                                    ? `${filteredPlayers.length} player${filteredPlayers.length !== 1 ? 's' : ''} in this group`
                                    : 'Manage your digital signage players'
                                }
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsPairingModalOpen(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <span className="material-symbols-outlined text-xl">add_circle</span>
                                Pair Device
                            </button>
                            <ExportButton
                                data={filteredPlayers.map(player => ({
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
                        <div className="p-6 rounded-lg relative overflow-hidden group hover:border-blue-300 transition-colors bg-white border border-gray-200 shadow-sm">
                            <div className="text-3xl font-bold mb-2 text-gray-900">{filteredPlayers.length}</div>
                            <div className="text-gray-500">{selectedGroupId ? 'Players in Group' : 'Total Players'}</div>
                        </div>
                        <div className="p-6 rounded-lg relative overflow-hidden group hover:border-emerald-300 transition-colors bg-white border border-gray-200 shadow-sm">
                            <div className="text-3xl font-bold mb-2 text-emerald-600">
                                {filteredPlayers.filter((p) => p.status === 'online').length}
                            </div>
                            <div className="text-gray-500">Online</div>
                        </div>
                        <div className="p-6 rounded-lg relative overflow-hidden group hover:border-gray-300 transition-colors bg-white border border-gray-200 shadow-sm">
                            <div className="text-3xl font-bold mb-2 text-gray-500">
                                {filteredPlayers.filter((p) => p.status === 'offline').length}
                            </div>
                            <div className="text-gray-500">Offline</div>
                        </div>
                    </div>

                    {/* Search + Filters */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search by name, CPU serial, or location..."
                            className="flex-1"
                        />
                        <div className="flex gap-2">
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
                        </div>
                    </div>

                    {/* Players List */}
                    <div className="rounded-lg border border-gray-200 overflow-hidden bg-white shadow-sm">
                        {filteredPlayers.length === 0 ? (
                            <div className="p-12 text-center text-gray-500">
                                <div className="text-6xl mb-4">📱</div>
                                <div className="text-xl mb-2">
                                    {selectedGroupId ? 'No players in this group' : 'No players registered'}
                                </div>
                                <div className="text-sm">
                                    {selectedGroupId ? 'Drag players here to assign them' : 'Connect a player to get started'}
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={selectAll}
                                                    onChange={handleSelectAll}
                                                    className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500 focus:ring-offset-white"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Pairing
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                CPU Serial
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Last Seen
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Created
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {filteredPlayers.map((player) => (
                                            <tr
                                                key={player.id}
                                                className="hover:bg-gray-50 transition-colors cursor-move"
                                                draggable
                                                onDragStart={() => handlePlayerDragStart(player.id)}
                                                onDragEnd={() => setDraggedPlayerId(null)}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedPlayers.includes(player.id)}
                                                        onChange={() => handleTogglePlayer(player.id)}
                                                        className="w-4 h-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500 focus:ring-offset-white"
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-3 h-3 rounded-full ${getStatusColor(player.status)}`} />
                                                        <span className="text-sm capitalize text-gray-900">{player.status}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {player.paired_at ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
                                                            <span className="text-sm text-emerald-600 font-medium">Paired</span>
                                                        </div>
                                                    ) : player.pairing_code ? (
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-amber-500 text-lg animate-pulse">pending</span>
                                                            <span className="text-sm text-amber-600 font-medium font-mono">{player.pairing_code}</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-gray-400 text-lg">radio_button_unchecked</span>
                                                            <span className="text-sm text-gray-500">Not initiated</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                                    {player.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                    {player.cpu_serial}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(player.last_seen)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {formatDate(player.created_at)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Modals */}
            <PairDeviceModal
                isOpen={isPairingModalOpen}
                onClose={() => setIsPairingModalOpen(false)}
                onSuccess={() => {
                    fetchPlayers();
                    showToast({
                        type: 'success',
                        title: 'Device Paired',
                        message: 'Your device has been successfully paired',
                        duration: 5000
                    });
                }}
            />

            <NewGroupModal
                isOpen={showNewGroupModal}
                onClose={() => setShowNewGroupModal(false)}
                onSubmit={handleCreateGroup}
            />

            <RenameGroupModal
                isOpen={showRenameGroupModal}
                groupId={contextMenu?.groupId || null}
                currentName={selectedGroup?.name || ''}
                onClose={() => setShowRenameGroupModal(false)}
                onSubmit={handleRenameGroup}
            />

            <DeleteGroupModal
                isOpen={showDeleteGroupModal}
                groupId={contextMenu?.groupId || null}
                groupName={selectedGroup?.name || ''}
                playerCount={selectedGroup?.playerCount || 0}
                onClose={() => setShowDeleteGroupModal(false)}
                onConfirm={handleDeleteGroup}
            />

            {/* Bulk Actions Toolbar */}
            {selectedPlayers.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
                    <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-2xl">
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-700 font-medium">
                                {selectedPlayers.length} player{selectedPlayers.length > 1 ? 's' : ''} selected
                            </span>
                            <div className="h-6 w-px bg-gray-200"></div>
                            <button
                                onClick={() => setShowBulkAssignModal(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">folder</span>
                                Assign to Group
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                Delete
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedPlayers([]);
                                    setSelectAll(false);
                                }}
                                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Assign Modal */}
            {showBulkAssignModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Assign to Group</h2>
                        <p className="text-gray-600 mb-6">
                            Select a group to assign {selectedPlayers.length} player{selectedPlayers.length > 1 ? 's' : ''}:
                        </p>
                        <div className="space-y-2 max-h-64 overflow-y-auto mb-6">
                            {groups.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => handleBulkAssignGroup(group.id)}
                                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-left transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-900 font-medium">{group.name}</span>
                                        <span className="text-sm text-gray-500">{group.playerCount || 0} players</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowBulkAssignModal(false)}
                            className="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Context Menu */}
            {contextMenu && (
                <GroupContextMenu
                    groupId={contextMenu.groupId}
                    position={{ x: contextMenu.x, y: contextMenu.y }}
                    onClose={() => setContextMenu(null)}
                    onRename={() => setShowRenameGroupModal(true)}
                    onDelete={() => setShowDeleteGroupModal(true)}
                    onDeploy={() => {
                        setDeployGroupId(contextMenu.groupId);
                        setShowDeployModal(true);
                        setContextMenu(null);
                    }}
                />
            )}
            {/* Deploy Playlist Modal */}
            <DeployPlaylistModal
                isOpen={showDeployModal}
                groupId={deployGroupId}
                groupName={groups.find(g => g.id === deployGroupId)?.name || ''}
                playerCount={players.filter(p => p.group_id === deployGroupId).length}
                onClose={() => {
                    setShowDeployModal(false);
                    setDeployGroupId(null);
                }}
                onDeployed={() => {
                    fetchPlayers();
                    showToast({ type: 'success', title: 'Deployed', message: 'Playlist deployed to group' });
                }}
            />
        </div>
    );
}

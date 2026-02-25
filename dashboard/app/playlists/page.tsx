'use client';

// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { API_URL } from '@/lib/api';
import { authenticatedFetch } from '@/lib/auth';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import EmptyState from '@/components/EmptyState';
import { useToast } from '@/hooks/useToast';
import SearchBar from '@/components/SearchBar';
import SortDropdown, { SortOption } from '@/components/SortDropdown';
import ExportButton from '@/components/ExportButton';
import DateRangePicker from '@/components/DateRangePicker';
import FilterDropdown from '@/components/FilterDropdown';
import PlaylistTemplateTree, { PlaylistTemplate } from '@/components/PlaylistTemplateTree';
import NewTemplateModal from '@/components/NewTemplateModal';
import TemplateContextMenu from '@/components/TemplateContextMenu';
import RenameTemplateModal from '@/components/RenameTemplateModal';
import DeleteTemplateModal from '@/components/DeleteTemplateModal';
import CreatePlaylistFromTemplateModal from '@/components/CreatePlaylistFromTemplateModal';

interface Playlist {
    id: string;
    name: string;
    description: string;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export default function PlaylistsPage() {
    const [playlists, setPlaylists] = useState<Playlist[]>([]);
    const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
    const [setAsActive, setSetAsActive] = useState(true);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { showToast } = useToast();

    // Template state
    const [templates, setTemplates] = useState<PlaylistTemplate[]>([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
    const [showRenameTemplateModal, setShowRenameTemplateModal] = useState(false);
    const [showDeleteTemplateModal, setShowDeleteTemplateModal] = useState(false);
    const [showCreatePlaylistModal, setShowCreatePlaylistModal] = useState(false);
    const [contextMenu, setContextMenu] = useState<{ templateId: string; x: number; y: number } | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<PlaylistTemplate | null>(null);

    // Sort options for playlists
    const sortOptions: SortOption[] = [
        { label: 'Newest First', value: 'newest', direction: 'desc' },
        { label: 'Oldest First', value: 'oldest', direction: 'asc' },
        { label: 'Name (A-Z)', value: 'name-asc', direction: 'asc' },
        { label: 'Name (Z-A)', value: 'name-desc', direction: 'desc' },
        { label: 'Most Items', value: 'items-desc', direction: 'desc' },
        { label: 'Least Items', value: 'items-asc', direction: 'asc' },
    ];

    // Filter states
    const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
    const [statusFilters, setStatusFilters] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string>('newest');

    const statusFilterOptions = [
        { label: 'Active', value: 'active', icon: 'check_circle', color: 'text-green-400' },
        { label: 'Draft', value: 'draft', icon: 'edit_note', color: 'text-yellow-400' },
        { label: 'Archived', value: 'archived', icon: 'archive', color: 'text-slate-400' },
    ];

    // Fetch playlists and templates
    useEffect(() => {
        fetchPlaylists();
        fetchTemplates();
    }, []);

    const fetchPlaylists = async () => {
        try {
            const response = await authenticatedFetch(`${API_URL}/api/playlists`);
            const data = await response.json();
            setPlaylists(data);
        } catch (error) {
            console.error('Error fetching playlists:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const response = await authenticatedFetch(`${API_URL}/api/playlist-templates`);
            const data = await response.json();
            setTemplates(data);
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleCreatePlaylist = async () => {
        if (!newPlaylistName.trim()) return;

        try {
            const response = await authenticatedFetch(`${API_URL}/api/playlists`, {
                method: 'POST',
                body: JSON.stringify({
                    name: newPlaylistName,
                    description: newPlaylistDescription,
                    created_by: 'System'
                })
            });

            if (response.ok) {
                setShowNewPlaylistModal(false);
                setNewPlaylistName('');
                setNewPlaylistDescription('');
                setSetAsActive(true);
                fetchPlaylists();
                showToast({
                    type: 'success',
                    title: 'Playlist Created',
                    message: `"${newPlaylistName}" has been created successfully`,
                    duration: 5000
                });
            } else {
                showToast({
                    type: 'error',
                    title: 'Creation Failed',
                    message: 'Failed to create playlist',
                    duration: 5000
                });
            }
        } catch (error) {
            console.error('Error creating playlist:', error);
            showToast({
                type: 'error',
                title: 'Error',
                message: 'An error occurred while creating playlist',
                duration: 5000
            });
        }
    };

    // Template handlers
    const handleCreateTemplate = async (name: string, description: string, durationPerItem: number) => {
        try {
            const response = await authenticatedFetch(`${API_URL}/api/playlist-templates`, {
                method: 'POST',
                body: JSON.stringify({ name, description, duration_per_item: durationPerItem, content_items: [] })
            });

            if (response.ok) {
                fetchTemplates();
                showToast({
                    type: 'success',
                    title: 'Template Created',
                    message: `"${name}" has been created successfully`
                });
            }
        } catch (error) {
            console.error('Error creating template:', error);
            showToast({ type: 'error', title: 'Error', message: 'Failed to create template' });
        }
    };

    const handleRenameTemplate = async (templateId: string, newName: string) => {
        try {
            const template = templates.find(t => t.id === templateId);
            if (!template) return;

            const response = await authenticatedFetch(`${API_URL}/api/playlist-templates/${templateId}`, {
                method: 'PUT',
                body: JSON.stringify({ ...template, name: newName })
            });

            if (response.ok) {
                fetchTemplates();
                showToast({
                    type: 'success',
                    title: 'Template Renamed',
                    message: `Renamed to "${newName}"`
                });
            }
        } catch (error) {
            console.error('Error renaming template:', error);
            showToast({ type: 'error', title: 'Error', message: 'Failed to rename template' });
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        try {
            const response = await authenticatedFetch(`${API_URL}/api/playlist-templates/${templateId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchTemplates();
                if (selectedTemplateId === templateId) {
                    setSelectedTemplateId(null);
                }
                showToast({
                    type: 'success',
                    title: 'Template Deleted',
                    message: 'Template has been deleted'
                });
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            showToast({ type: 'error', title: 'Error', message: 'Failed to delete template' });
        }
    };

    const handleCreatePlaylistFromTemplate = async (name: string) => {
        if (!selectedTemplate) return;

        try {
            const response = await authenticatedFetch(`${API_URL}/api/playlist-templates/${selectedTemplate.id}/create-playlist`, {
                method: 'POST',
                body: JSON.stringify({ name })
            });

            if (response.ok) {
                fetchPlaylists();
                showToast({
                    type: 'success',
                    title: 'Playlist Created',
                    message: `"${name}" created from template "${selectedTemplate.name}"`
                });
            }
        } catch (error) {
            console.error('Error creating playlist from template:', error);
            showToast({ type: 'error', title: 'Error', message: 'Failed to create playlist' });
        }
    };

    const handleTemplateContextMenu = (templateId: string, event: React.MouseEvent) => {
        event.preventDefault();
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(template);
            setContextMenu({ templateId, x: event.clientX, y: event.clientY });
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return '1 day ago';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 14) return '1 week ago';
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        if (diffInDays < 60) return '1 month ago';
        return `${Math.floor(diffInDays / 30)} months ago`;
    };

    const filteredPlaylists = playlists.filter(playlist =>
        playlist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        playlist.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen">
            <Header />
            {/* Main Content */}
            <main className="w-full max-w-[1600px] mx-auto p-6 md:p-8 flex gap-6">
                {/* Sidebar */}
                <aside className="w-64 flex-shrink-0">
                    <div className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm sticky top-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Templates</h3>
                            <button
                                onClick={() => setShowNewTemplateModal(true)}
                                className="w-8 h-8 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center shadow-sm"
                                title="New Template"
                            >
                                <span className="material-symbols-outlined text-[20px]">add</span>
                            </button>
                        </div>
                        <PlaylistTemplateTree
                            templates={templates}
                            selectedTemplateId={selectedTemplateId}
                            onSelectTemplate={setSelectedTemplateId}
                            onContextMenu={handleTemplateContextMenu}
                        />
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col gap-8">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Playlists</h1>
                            <p className="text-gray-500 mt-1">Create and manage content sequences for your players</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowNewPlaylistModal(true)}
                                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
                            >
                                <span className="text-xl">+</span>
                                New Playlist
                            </button>
                            <ExportButton
                                data={playlists.map(playlist => ({
                                    Name: playlist.name,
                                    Description: playlist.description,
                                    'Created By': playlist.created_by,
                                    'Created At': new Date(playlist.created_at).toLocaleDateString(),
                                    'Updated At': new Date(playlist.updated_at).toLocaleDateString(),
                                }))}
                                filename="playlists"
                                title="Playlists Export"
                            />
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-6 rounded-lg relative overflow-hidden group hover:border-blue-300 transition-colors bg-white border border-gray-200 shadow-sm">
                            <div className="text-3xl font-bold mb-2 text-gray-900">{filteredPlaylists.length}</div>
                            <div className="text-gray-500">Total Playlists</div>
                        </div>
                        <div className="p-6 rounded-lg relative overflow-hidden group hover:border-emerald-300 transition-colors bg-white border border-gray-200 shadow-sm">
                            <div className="text-3xl font-bold mb-2 text-emerald-600">
                                {filteredPlaylists.filter((p) => (p as any).status === 'active').length}
                            </div>
                            <div className="text-gray-500">Active</div>
                        </div>
                        <div className="p-6 rounded-lg relative overflow-hidden group hover:border-purple-300 transition-colors bg-white border border-gray-200 shadow-sm">
                            <div className="text-3xl font-bold mb-2 text-purple-600">
                                {filteredPlaylists.filter((p) => (p as any).status === 'scheduled').length}
                            </div>
                            <div className="text-gray-500">Scheduled</div>
                        </div>
                    </div>

                    {/* Search + Filters */}
                    <div className="flex flex-col md:flex-row gap-3">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search playlists..."
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
                            <SortDropdown
                                options={sortOptions}
                                value={sortBy}
                                onChange={setSortBy}
                            />
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">Loading playlists...</div>
                    ) : filteredPlaylists.length === 0 && searchQuery === '' ? (
                        /* Empty State */
                        <EmptyState
                            icon="queue_music"
                            title="No playlists yet"
                            description="Create your first playlist to get started organizing your digital signage content into effective schedules."
                            actionLabel="Create Playlist"
                            onAction={() => setShowNewPlaylistModal(true)}
                            showSecondaryActions={true}
                        />
                    ) : filteredPlaylists.length === 0 ? (
                        /* No Search Results */
                        <div className="text-center py-12">
                            <p className="text-gray-500">No playlists found matching "{searchQuery}"</p>
                        </div>
                    ) : (
                        /* Playlists Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredPlaylists.map((playlist, index) => (
                                <Link
                                    key={playlist.id}
                                    href={`/playlists/${playlist.id}`}
                                    className={`group relative rounded-lg p-6 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-white border border-gray-200 hover:border-blue-300 hover:shadow-md ${index === 0 ? 'ring-1 ring-blue-300 shadow-sm' : ''
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center transition-colors duration-300 ${index === 0 ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-600 group-hover:text-white'
                                            }`}>
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                            </svg>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-1 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wide">
                                                {playlist.created_by}
                                            </span>
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                        {playlist.name}
                                    </h3>
                                    {playlist.description && (
                                        <p className="text-sm text-gray-500 mb-6 line-clamp-2">
                                            {playlist.description}
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <div className="flex -space-x-2">
                                                <div className="h-6 w-6 rounded-full bg-gray-300 border border-white"></div>
                                                <div className="h-6 w-6 rounded-full bg-gray-200 border border-white"></div>
                                            </div>
                                            <span className="text-xs text-gray-500">0 items</span>
                                        </div>
                                        <span className="text-xs text-gray-500">Created {formatDate(playlist.created_at)}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* New Playlist Modal */}
            {showNewPlaylistModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={() => setShowNewPlaylistModal(false)}></div>
                    <div className="relative w-full max-w-lg transform rounded-lg bg-white border border-gray-200 shadow-2xl transition-all p-6 sm:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">Create New Playlist</h3>
                            </div>
                            <button onClick={() => setShowNewPlaylistModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="playlist-name">Name</label>
                                <input
                                    className="block w-full rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-sm px-4 py-2.5 placeholder-gray-400"
                                    id="playlist-name"
                                    placeholder="e.g. Main Lobby Loop"
                                    type="text"
                                    value={newPlaylistName}
                                    onChange={(e) => setNewPlaylistName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="playlist-desc">
                                    Description <span className="text-gray-500 font-normal ml-1">(Optional)</span>
                                </label>
                                <textarea
                                    className="block w-full rounded-lg border-gray-300 bg-white text-gray-900 shadow-sm focus:border-blue-600 focus:ring-blue-600 sm:text-sm px-4 py-2.5 placeholder-gray-400 resize-none"
                                    id="playlist-desc"
                                    placeholder="Briefly describe the purpose of this playlist..."
                                    rows={4}
                                    value={newPlaylistDescription}
                                    onChange={(e) => setNewPlaylistDescription(e.target.value)}
                                ></textarea>
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <div className="flex items-center h-5">
                                    <input
                                        checked={setAsActive}
                                        className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-600 focus:ring-offset-white"
                                        id="active-toggle"
                                        type="checkbox"
                                        onChange={(e) => setSetAsActive(e.target.checked)}
                                    />
                                </div>
                                <label className="text-sm font-medium text-gray-700 select-none" htmlFor="active-toggle">
                                    Set as active playlist immediately
                                </label>
                            </div>
                        </div>
                        <div className="mt-8 flex items-center justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowNewPlaylistModal(false);
                                    setNewPlaylistName('');
                                    setNewPlaylistDescription('');
                                    setSetAsActive(true);
                                }}
                                className="px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 border border-gray-300 hover:border-gray-400 transition-all focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreatePlaylist}
                                disabled={!newPlaylistName.trim()}
                                className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Create Playlist
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Template Modals */}
            <NewTemplateModal
                isOpen={showNewTemplateModal}
                onClose={() => setShowNewTemplateModal(false)}
                onSubmit={handleCreateTemplate}
            />

            <RenameTemplateModal
                isOpen={showRenameTemplateModal}
                templateId={selectedTemplate?.id || null}
                currentName={selectedTemplate?.name || ''}
                onClose={() => setShowRenameTemplateModal(false)}
                onSubmit={handleRenameTemplate}
            />

            <DeleteTemplateModal
                isOpen={showDeleteTemplateModal}
                templateId={selectedTemplate?.id || null}
                templateName={selectedTemplate?.name || ''}
                onClose={() => setShowDeleteTemplateModal(false)}
                onConfirm={handleDeleteTemplate}
            />

            <CreatePlaylistFromTemplateModal
                isOpen={showCreatePlaylistModal}
                template={selectedTemplate}
                onClose={() => setShowCreatePlaylistModal(false)}
                onSubmit={handleCreatePlaylistFromTemplate}
            />

            {contextMenu && (
                <TemplateContextMenu
                    templateId={contextMenu.templateId}
                    position={{ x: contextMenu.x, y: contextMenu.y }}
                    onClose={() => setContextMenu(null)}
                    onCreatePlaylist={() => setShowCreatePlaylistModal(true)}
                    onRename={() => setShowRenameTemplateModal(true)}
                    onDelete={() => setShowDeleteTemplateModal(true)}
                />
            )}
        </div>
    );
}

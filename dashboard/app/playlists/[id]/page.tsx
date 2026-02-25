'use client';


// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { authenticatedFetch } from '@/lib/auth';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AddContentModal from '../../../components/AddContentModal';

interface Content {
    id: string;
    name: string;
    type: 'image' | 'video' | 'url';
    url: string;
    duration: number;
    metadata: {
        size?: number;
        dimensions?: string;
    };
}

interface PlaylistContent extends Content {
    display_order: number;
    assignment_id: string;
}

interface AssetDirectoryItem extends Content {
    added_at: string;
    asset_id: string;
}

interface Playlist {
    id: string;
    name: string;
    description: string;
    created_by: string;
    created_at: string;
}

// Sortable playlist item component
function SortablePlaylistItem({ content, index, onRemove }: { content: PlaylistContent; index: number; onRemove: () => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: content.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
    };

    const isVideo = content.type === 'video' || content.url?.includes('.mp4') || content.url?.includes('.webm');

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center rounded-lg p-3 select-none transition-all ${isDragging
                ? 'bg-slate-800 border border-blue-500/50 shadow-[0_0_15px_rgba(60,131,246,0.3)] ring-1 ring-blue-500/30 relative z-10'
                : index === 0
                    ? 'bg-slate-800 border border-blue-500/50 shadow-[0_0_15px_rgba(60,131,246,0.3)] ring-1 ring-blue-500/30'
                    : 'bg-slate-900 border border-slate-800 hover:border-slate-600'
                }`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className={`cursor-grab active:cursor-grabbing mr-4 ${isDragging ? 'text-white' : 'text-slate-500 hover:text-white'
                    }`}
            >
                <span className="material-symbols-outlined">drag_indicator</span>
            </div>

            {/* Order Number */}
            <div className={`w-8 text-lg font-bold ${index === 0 ? 'text-blue-500' : 'text-slate-500'}`}>
                #{index + 1}
            </div>

            {/* Thumbnail */}
            <div className="w-24 h-14 bg-black rounded overflow-hidden mr-4 relative shrink-0 border border-white/10">
                {content.url.startsWith('http') ? (
                    <img
                        src={content.url}
                        alt={content.name}
                        className={`w-full h-full object-cover ${isDragging ? 'opacity-80' : 'opacity-60'}`}
                    />
                ) : (
                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-slate-600">image</span>
                    </div>
                )}
                {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-white/80 text-xl">play_circle</span>
                    </div>
                )}
            </div>

            {/* Content Info */}
            <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-medium truncate ${isDragging ? 'text-white' : 'text-slate-200'}`}>
                    {content.name}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                    <span
                        className={`text-xs px-1.5 py-0.5 rounded border ${content.type === 'video'
                            ? 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                            : content.type === 'image'
                                ? 'text-purple-400 bg-purple-400/10 border-purple-400/20'
                                : 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
                            }`}
                    >
                        {content.type === 'video' ? 'Video' : content.type === 'image' ? 'Image' : 'URL'}
                    </span>
                    {content.metadata?.dimensions && (
                        <span className="text-xs text-slate-500">{content.metadata.dimensions}</span>
                    )}
                </div>
            </div>

            {/* Duration */}
            <div className="text-sm font-mono text-slate-400 mr-6">{content.duration}s</div>

            {/* Delete Button */}
            <button
                onClick={onRemove}
                className={`text-slate-500 hover:text-red-400 p-2 rounded hover:bg-red-500/10 transition-colors ${index === 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
            >
                <span className="material-symbols-outlined">delete</span>
            </button>
        </div>
    );
}

export default function PlaylistEditorPage() {
    const params = useParams();
    const router = useRouter();
    const playlistId = params.id as string;

    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [playlistContent, setPlaylistContent] = useState<PlaylistContent[]>([]);
    const [assetDirectory, setAssetDirectory] = useState<AssetDirectoryItem[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'assigned' | 'unassigned'>('all');
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Fetch playlist details
    useEffect(() => {
        authenticatedFetch(`${API_URL}/api/playlists/${playlistId}`)
            .then((res) => res.json())
            .then((data) => setPlaylist(data))
            .catch((err) => console.error('Failed to fetch playlist:', err));
    }, [playlistId]);

    // Fetch playlist content
    useEffect(() => {
        fetchPlaylistContent();
    }, [playlistId]);

    // Fetch Asset Directory
    useEffect(() => {
        fetchAssetDirectory();
    }, [playlistId]);

    const fetchPlaylistContent = () => {
        authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/content`)
            .then((res) => res.json())
            .then((data) => setPlaylistContent(data))
            .catch((err) => console.error('Failed to fetch playlist content:', err));
    };

    const fetchAssetDirectory = () => {
        authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/assets`)
            .then((res) => res.json())
            .then((data) => setAssetDirectory(data))
            .catch((err) => console.error('Failed to fetch asset directory:', err));
    };

    // Calculate total duration
    const totalDuration = playlistContent.reduce((sum, item) => sum + (item.duration || 0), 0);
    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Handle drag end
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setPlaylistContent((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update display_order for all items
                return newItems.map((item, index) => ({
                    ...item,
                    display_order: index,
                }));
            });
            setHasChanges(true);
        }
    };

    // Add asset from directory to playlist
    const handleAddAssetToPlaylist = async (asset: AssetDirectoryItem) => {
        const nextOrder = playlistContent.length;

        try {
            const response = await authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/content`, {
                method: 'POST',
                body: JSON.stringify({
                    content_id: asset.id,
                    display_order: nextOrder,
                }),
            });

            if (response.ok) {
                fetchPlaylistContent();
            }
        } catch (err) {
            console.error('Failed to add asset to playlist:', err);
        }
    };

    // Remove content from playlist
    const handleRemoveContent = async (content: PlaylistContent) => {
        try {
            const response = await authenticatedFetch(
                `${API_URL}/api/playlists/${playlistId}/content/${content.id}`,
                { method: 'DELETE' }
            );

            if (response.ok) {
                setPlaylistContent(playlistContent.filter((item) => item.id !== content.id));
                setHasChanges(true);
            }
        } catch (err) {
            console.error('Failed to remove content:', err);
        }
    };

    // Save playlist order
    const handleSave = async () => {
        setIsSaving(true);

        try {
            // Update display_order for each item
            await Promise.all(
                playlistContent.map((item) =>
                    authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/content/${item.id}/order`, {
                        method: 'PUT',
                        body: JSON.stringify({ display_order: item.display_order }),
                    })
                )
            );

            setHasChanges(false);
        } catch (err) {
            console.error('Failed to save playlist:', err);
        } finally {
            setIsSaving(false);
        }
    };

    // Filter asset directory
    const filteredAssets = assetDirectory.filter((asset) => {
        const isAssigned = playlistContent.some((item) => item.id === asset.id);

        if (filterType === 'assigned') return isAssigned;
        if (filterType === 'unassigned') return !isAssigned;
        return true; // 'all'
    });

    if (!playlist) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-slate-400">Loading playlist...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center px-6 shrink-0 z-20">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <button
                        onClick={() => router.push('/playlists')}
                        className="hover:text-white transition-colors"
                    >
                        Playlists
                    </button>
                    <span className="material-symbols-outlined text-base">chevron_right</span>
                    <span className="text-white font-medium">{playlist.name}</span>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="flex items-center text-xs font-mono text-slate-400">
                        Total Duration: {formatDuration(totalDuration)}
                    </div>
                    <div className="h-6 w-px bg-slate-700"></div>
                    <button className="bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded border border-slate-700 text-sm font-medium transition-colors">
                        Preview
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded text-sm font-medium shadow-lg shadow-blue-600/20 transition-colors">
                        Publish
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left: Playlist Content */}
                <section className="w-[70%] flex flex-col border-r border-slate-800 bg-slate-950 relative">
                    {/* Toolbar */}
                    <div className="h-12 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors" title="Settings">
                                <span className="material-symbols-outlined text-[20px]">settings</span>
                            </button>
                            <button className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors" title="Layout">
                                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                            </button>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">Total Duration: {formatDuration(totalDuration)}</div>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 overflow-y-auto p-8">
                        {playlistContent.length === 0 ? (
                            <div className="h-full w-full border-2 border-dashed border-slate-700 hover:border-blue-500/50 bg-slate-900/20 hover:bg-slate-900/40 rounded-xl transition-all flex flex-col items-center justify-center gap-6 group">
                                <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                                    <span className="material-symbols-outlined text-4xl text-slate-500 group-hover:text-blue-500 transition-colors">
                                        playlist_add
                                    </span>
                                </div>
                                <div className="text-center space-y-2 max-w-sm">
                                    <h3 className="text-xl font-semibold text-white">No content yet</h3>
                                    <p className="text-slate-400">
                                        Drag items here from the library or select from your computer to get started.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 mt-2">
                                    <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-white font-medium transition-colors flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px]">upload_file</span>
                                        Upload Files
                                    </button>
                                    <span className="text-slate-600 text-sm">or</span>
                                    <button onClick={() => setShowAddModal(true)} className="px-4 py-2 text-blue-500 hover:text-blue-400 font-medium text-sm flex items-center gap-1 group/btn">
                                        add from the browser
                                        <span className="material-symbols-outlined text-[16px] group-hover/btn:translate-x-1 transition-transform">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                    <SortableContext items={playlistContent.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                                        {playlistContent.map((content, index) => (
                                            <SortablePlaylistItem
                                                key={content.id}
                                                content={content}
                                                index={index}
                                                onRemove={() => handleRemoveContent(content)}
                                            />
                                        ))}
                                    </SortableContext>
                                </DndContext>
                                <div className="h-16"></div>
                            </div>
                        )}
                    </div>

                    {/* Timeline Footer */}
                    <div className="h-16 border-t border-slate-800 bg-slate-900 flex items-center justify-center shrink-0">
                        <p className="text-xs text-slate-600">Timeline will appear here when content is added</p>
                    </div>

                    {/* Save Bar */}
                    {hasChanges && (
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex items-center justify-between z-20">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
                            >
                                Discard Changes
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Save Playlist'}
                            </button>
                        </div>
                    )}
                </section>

                {/* Right: Asset Directory */}
                <aside className="w-[30%] bg-slate-950 flex flex-col border-l border-slate-800 self-stretch">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800 bg-slate-900/50 shrink-0">
                        <h2 className="text-lg font-semibold text-white mb-4">Asset Directory</h2>

                        {/* Filter Tabs - Full Width */}
                        <div className="flex space-x-1 bg-slate-800 p-1 rounded-lg">
                            <button
                                onClick={() => setFilterType('all')}
                                className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${filterType === 'all'
                                    ? 'text-white bg-blue-600'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilterType('assigned')}
                                className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${filterType === 'assigned'
                                    ? 'text-white bg-blue-600'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Assigned
                            </button>
                            <button
                                onClick={() => setFilterType('unassigned')}
                                className={`flex-1 py-2 text-xs font-medium rounded transition-colors ${filterType === 'unassigned'
                                    ? 'text-white bg-blue-600'
                                    : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                Unassigned
                            </button>
                        </div>
                    </div>

                    {/* Asset Grid - Takes remaining space */}
                    <div className="flex-1 overflow-y-auto p-4 min-h-0">
                        {filteredAssets.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">folder_open</span>
                                <p className="text-slate-400 text-sm">
                                    {filterType === 'all'
                                        ? 'No assets in directory yet'
                                        : filterType === 'assigned'
                                            ? 'No assigned assets'
                                            : 'No unassigned assets'}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {filteredAssets.map((asset) => {
                                    const isAssigned = playlistContent.some((item) => item.id === asset.id);
                                    const isVideo = asset.type === 'video' || asset.url?.includes('.mp4') || asset.url?.includes('.webm');

                                    return (
                                        <div
                                            key={asset.id}
                                            className="group relative bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-all cursor-pointer"
                                        >
                                            <div className="aspect-video relative bg-black">
                                                {asset.url.startsWith('http') ? (
                                                    <img
                                                        src={asset.url}
                                                        alt={asset.name}
                                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-4xl text-slate-600">image</span>
                                                    </div>
                                                )}

                                                {/* Video Play Icon */}
                                                {isVideo && (
                                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                                                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 text-white">
                                                            <span className="material-symbols-outlined text-2xl">play_arrow</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Duration Badge */}
                                                {asset.duration && (
                                                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
                                                        {asset.duration}s
                                                    </span>
                                                )}

                                                {/* Add/Check Button */}
                                                <div className="absolute top-2 right-2">
                                                    {!isAssigned ? (
                                                        <button
                                                            onClick={() => handleAddAssetToPlaylist(asset)}
                                                            className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg opacity-0 group-hover:opacity-100 transition-all transform scale-90 hover:scale-100"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">add</span>
                                                        </button>
                                                    ) : (
                                                        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                                            <span className="material-symbols-outlined text-sm">check</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Card Info */}
                                            <div className="p-3">
                                                <h3 className="text-sm font-medium text-white truncate mb-1">{asset.name}</h3>
                                                <div className="flex justify-between items-center text-[11px] text-slate-400">
                                                    <span>{asset.metadata?.size ? `${(asset.metadata.size / 1024 / 1024).toFixed(1)} MB` : 'N/A'}</span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[12px]">
                                                            {asset.type === 'video' ? 'videocam' : asset.type === 'image' ? 'image' : 'link'}
                                                        </span>
                                                        {asset.type === 'video' ? 'Video' : asset.type === 'image' ? 'Image' : 'URL'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Upload Drop Zone - Anchored above button */}
                    <div className="p-4 border-t border-slate-800 bg-slate-900/50 shrink-0">
                        <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-lg p-4 text-center transition-colors group cursor-pointer">
                            <p className="text-xs text-slate-500 group-hover:text-slate-400">Drop local files here to upload</p>
                        </div>
                    </div>

                    {/* Add Content Button - Always anchored at bottom */}
                    <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40"
                        >
                            <span className="material-symbols-outlined">add</span>
                            Add Content
                        </button>
                    </div>
                </aside>
            </main>

            {/* Add Content Modal */}
            <AddContentModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                playlistId={playlistId}
                onContentAdded={() => {
                    fetchAssetDirectory();
                }}
            />
        </div>
    );
}

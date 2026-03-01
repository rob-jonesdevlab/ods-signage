'use client';

// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { authenticatedFetch } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';
import Header from '@/components/Header';
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
import PlaylistScheduler, { PlaylistSchedule } from '../../../components/PlaylistScheduler';
import DeployFromEditorModal from '../../../components/DeployFromEditorModal';

// ── Types ───────────────────────────────────────────────────
interface Content {
    id: string;
    name: string;
    type: 'image' | 'video' | 'url';
    url: string;
    duration: number;
    metadata: { size?: number; dimensions?: string };
}

interface PlaylistContent extends Content {
    display_order: number;
    assignment_id: string;
    transition: string;
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
    schedule: PlaylistSchedule | null;
}

// ── Transition Options ──────────────────────────────────────
const TRANSITIONS = [
    { value: 'fade', label: 'Fade', icon: 'gradient' },
    { value: 'slide', label: 'Slide', icon: 'swap_horiz' },
    { value: 'cut', label: 'Cut', icon: 'content_cut' },
    { value: 'dissolve', label: 'Dissolve', icon: 'blur_on' },
    { value: 'zoom', label: 'Zoom', icon: 'zoom_in' },
];

// ── Sortable Playlist Item ──────────────────────────────────
function SortablePlaylistItem({
    content,
    index,
    onRemove,
    onDurationChange,
    onTransitionChange,
    onPreview,
}: {
    content: PlaylistContent;
    index: number;
    onRemove: () => void;
    onDurationChange: (duration: number) => void;
    onTransitionChange: (transition: string) => void;
    onPreview: () => void;
}) {
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
    const [showTransitionMenu, setShowTransitionMenu] = useState(false);
    const [localDuration, setLocalDuration] = useState(content.duration || 10);
    const transitionRef = useRef<HTMLDivElement>(null);

    // Sync local duration when content prop changes
    useEffect(() => {
        setLocalDuration(content.duration || 10);
    }, [content.duration]);

    // Close transition menu on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (transitionRef.current && !transitionRef.current.contains(e.target as Node)) {
                setShowTransitionMenu(false);
            }
        }
        if (showTransitionMenu) document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showTransitionMenu]);

    const handleDurationBlur = () => {
        const clamped = Math.max(5, Math.min(300, localDuration));
        setLocalDuration(clamped);
        onDurationChange(clamped);
    };

    const currentTransition = TRANSITIONS.find(t => t.value === (content.transition || 'fade')) || TRANSITIONS[0];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center rounded-xl p-3 select-none transition-all ${isDragging
                ? 'bg-blue-50 border-2 border-blue-400 shadow-lg ring-2 ring-blue-200 relative z-10'
                : 'bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
        >
            {/* Drag Handle */}
            <div
                {...attributes}
                {...listeners}
                className={`cursor-grab active:cursor-grabbing mr-3 ${isDragging ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}
            >
                <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
            </div>

            {/* Order Number */}
            <div className={`w-7 text-sm font-bold tabular-nums ${index === 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                {index + 1}
            </div>

            {/* Thumbnail */}
            <button
                onClick={onPreview}
                className="w-20 h-12 bg-gray-100 rounded-lg overflow-hidden mr-3 relative shrink-0 border border-gray-200 hover:border-blue-400 transition-colors group/thumb"
                title="Preview"
            >
                {content.url?.startsWith('http') ? (
                    <img src={content.url} alt={content.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400">
                            {content.type === 'url' ? 'language' : 'image'}
                        </span>
                    </div>
                )}
                {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="material-symbols-outlined text-white text-lg">play_circle</span>
                    </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-white text-sm">visibility</span>
                </div>
            </button>

            {/* Content Info */}
            <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">{content.name}</h3>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide ${content.type === 'video'
                        ? 'text-blue-600 bg-blue-50 border border-blue-200'
                        : content.type === 'image'
                            ? 'text-purple-600 bg-purple-50 border border-purple-200'
                            : 'text-emerald-600 bg-emerald-50 border border-emerald-200'
                        }`}>
                        {content.type}
                    </span>
                    {content.metadata?.dimensions && (
                        <span className="text-[10px] text-gray-400">{content.metadata.dimensions}</span>
                    )}
                </div>
            </div>

            {/* Duration Editor */}
            <div className="flex items-center gap-1 mr-3">
                <span className="material-symbols-outlined text-gray-400 text-[16px]">timer</span>
                <input
                    type="number"
                    min={5}
                    max={300}
                    value={localDuration}
                    onChange={e => setLocalDuration(parseInt(e.target.value) || 5)}
                    onBlur={handleDurationBlur}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    className="w-14 text-sm font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-2 py-1 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-xs text-gray-400">s</span>
            </div>

            {/* Transition Picker */}
            <div className="relative mr-3" ref={transitionRef}>
                <button
                    onClick={() => setShowTransitionMenu(!showTransitionMenu)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    title="Transition effect"
                >
                    <span className="material-symbols-outlined text-[14px]">{currentTransition.icon}</span>
                    <span className="hidden sm:inline">{currentTransition.label}</span>
                    <span className="material-symbols-outlined text-[12px]">expand_more</span>
                </button>
                {showTransitionMenu && (
                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-30 py-1 min-w-[140px]">
                        {TRANSITIONS.map(t => (
                            <button
                                key={t.value}
                                onClick={() => { onTransitionChange(t.value); setShowTransitionMenu(false); }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${t.value === (content.transition || 'fade') ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Delete Button */}
            <button
                onClick={onRemove}
                className="text-gray-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
                title="Remove"
            >
                <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
        </div>
    );
}

// ── Preview Modal ───────────────────────────────────────────
function PreviewModal({ content, onClose }: { content: PlaylistContent | null; onClose: () => void }) {
    if (!content) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium uppercase ${content.type === 'video' ? 'text-blue-600 bg-blue-50' :
                            content.type === 'image' ? 'text-purple-600 bg-purple-50' :
                                'text-emerald-600 bg-emerald-50'
                            }`}>{content.type}</span>
                        <h3 className="text-lg font-semibold text-gray-900">{content.name}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="aspect-video bg-gray-900">
                    {content.type === 'url' ? (
                        <iframe src={content.url} className="w-full h-full border-0" title={content.name} sandbox="allow-scripts allow-same-origin" />
                    ) : content.type === 'video' ? (
                        <video src={content.url} controls className="w-full h-full object-contain" autoPlay />
                    ) : (
                        <img src={content.url} alt={content.name} className="w-full h-full object-contain" />
                    )}
                </div>
                <div className="p-4 bg-gray-50 flex items-center justify-between text-sm text-gray-500">
                    <span>Duration: {content.duration}s</span>
                    <span>Transition: {content.transition || 'fade'}</span>
                </div>
            </div>
        </div>
    );
}

// ── Timeline Bar ────────────────────────────────────────────
function TimelineBar({ items, totalDuration }: { items: PlaylistContent[]; totalDuration: number }) {
    if (items.length === 0 || totalDuration === 0) return null;

    const colors = [
        'bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-amber-500',
        'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-orange-500',
    ];

    return (
        <div className="flex items-center gap-0.5 h-3 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
            {items.map((item, i) => {
                const width = Math.max((item.duration / totalDuration) * 100, 2);
                return (
                    <div
                        key={item.id}
                        className={`h-full ${colors[i % colors.length]} transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
                        style={{ width: `${width}%` }}
                        title={`${item.name} — ${item.duration}s`}
                    />
                );
            })}
        </div>
    );
}

// ── Main Page ───────────────────────────────────────────────
export default function PlaylistEditorPage() {
    const params = useParams();
    const router = useRouter();
    const { showToast } = useToast();
    const playlistId = params.id as string;

    const [playlist, setPlaylist] = useState<Playlist | null>(null);
    const [playlistContent, setPlaylistContent] = useState<PlaylistContent[]>([]);
    const [originalContent, setOriginalContent] = useState<PlaylistContent[]>([]);
    const [assetDirectory, setAssetDirectory] = useState<AssetDirectoryItem[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'assigned' | 'unassigned'>('all');
    const [hasChanges, setHasChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [previewContent, setPreviewContent] = useState<PlaylistContent | null>(null);
    const [schedule, setSchedule] = useState<PlaylistSchedule | null>(null);
    const [sidebarTab, setSidebarTab] = useState<'assets' | 'schedule'>('assets');
    const [showDeploy, setShowDeploy] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Fetch playlist details
    useEffect(() => {
        authenticatedFetch(`${API_URL}/api/playlists/${playlistId}`)
            .then(res => res.json())
            .then(data => { setPlaylist(data); setSchedule(data.schedule || null); })
            .catch(err => console.error('Failed to fetch playlist:', err));
    }, [playlistId]);

    // Fetch playlist content
    const fetchPlaylistContent = useCallback(() => {
        authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/content`)
            .then(res => res.json())
            .then(data => {
                setPlaylistContent(data);
                setOriginalContent(JSON.parse(JSON.stringify(data)));
                setHasChanges(false);
            })
            .catch(err => console.error('Failed to fetch playlist content:', err));
    }, [playlistId]);

    useEffect(() => { fetchPlaylistContent(); }, [fetchPlaylistContent]);

    // Fetch Asset Directory
    const fetchAssetDirectory = useCallback(() => {
        authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/assets`)
            .then(res => res.json())
            .then(data => setAssetDirectory(data))
            .catch(err => console.error('Failed to fetch asset directory:', err));
    }, [playlistId]);

    useEffect(() => { fetchAssetDirectory(); }, [fetchAssetDirectory]);

    // Computed
    const totalDuration = playlistContent.reduce((sum, item) => sum + (item.duration || 10), 0);
    const formatDuration = (seconds: number) => {
        if (seconds >= 3600) {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = seconds % 60;
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Handlers
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setPlaylistContent(items => {
                const oldIndex = items.findIndex(item => item.id === active.id);
                const newIndex = items.findIndex(item => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex).map((item, i) => ({ ...item, display_order: i }));
            });
            setHasChanges(true);
        }
    };

    const handleDurationChange = (contentId: string, duration: number) => {
        setPlaylistContent(items =>
            items.map(item => item.id === contentId ? { ...item, duration } : item)
        );
        setHasChanges(true);
    };

    const handleTransitionChange = (contentId: string, transition: string) => {
        setPlaylistContent(items =>
            items.map(item => item.id === contentId ? { ...item, transition } : item)
        );
        setHasChanges(true);
    };

    const handleAddAssetToPlaylist = async (asset: AssetDirectoryItem) => {
        try {
            const response = await authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/content`, {
                method: 'POST',
                body: JSON.stringify({ content_id: asset.id, display_order: playlistContent.length }),
            });
            if (response.ok) {
                fetchPlaylistContent();
                fetchAssetDirectory();
                showToast({ type: 'success', title: 'Added', message: `"${asset.name}" added to playlist` });
            }
        } catch (err) {
            console.error('Failed to add asset:', err);
        }
    };

    const handleRemoveContent = async (content: PlaylistContent) => {
        try {
            const response = await authenticatedFetch(
                `${API_URL}/api/playlists/${playlistId}/content/${content.id}`,
                { method: 'DELETE' }
            );
            if (response.ok) {
                setPlaylistContent(prev => prev.filter(item => item.id !== content.id));
                setHasChanges(true);
                showToast({ type: 'success', title: 'Removed', message: `"${content.name}" removed` });
            }
        } catch (err) {
            console.error('Failed to remove content:', err);
        }
    };

    const handleScheduleChange = (newSchedule: PlaylistSchedule) => {
        setSchedule(newSchedule);
        setHasChanges(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            // Save order + per-item changes (duration, transition)
            await authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/content/reorder`, {
                method: 'PUT',
                body: JSON.stringify({
                    items: playlistContent.map((item, index) => ({
                        content_id: item.id,
                        position: index,
                        duration: item.duration,
                        transition: item.transition || 'fade',
                    })),
                }),
            });
            // Save schedule
            await authenticatedFetch(`${API_URL}/api/playlists/${playlistId}`, {
                method: 'PATCH',
                body: JSON.stringify({ schedule }),
            });
            setHasChanges(false);
            setOriginalContent(JSON.parse(JSON.stringify(playlistContent)));
            showToast({ type: 'success', title: 'Saved', message: 'Playlist changes saved' });
        } catch (err) {
            console.error('Failed to save:', err);
            showToast({ type: 'error', title: 'Error', message: 'Failed to save playlist' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDiscard = () => {
        setPlaylistContent(JSON.parse(JSON.stringify(originalContent)));
        setHasChanges(false);
    };

    // Filter assets
    const filteredAssets = assetDirectory.filter(asset => {
        const isAssigned = playlistContent.some(item => item.id === asset.id);
        if (filterType === 'assigned') return isAssigned;
        if (filterType === 'unassigned') return !isAssigned;
        return true;
    });

    if (!playlist) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-400">Loading playlist...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            {/* Editor Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.push('/playlists')}
                            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold text-gray-900">{playlist.name}</h1>
                                {hasChanges && (
                                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        Unsaved
                                    </span>
                                )}
                            </div>
                            {playlist.description && (
                                <p className="text-sm text-gray-500 mt-0.5">{playlist.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Stats */}
                        <div className="flex items-center gap-4 mr-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">layers</span>
                                {playlistContent.length} item{playlistContent.length !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                {formatDuration(totalDuration)}
                            </span>
                        </div>
                        {/* Actions */}
                        {hasChanges && (
                            <>
                                <button
                                    onClick={handleDiscard}
                                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Discard
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-[16px]">save</span>
                                    {isSaving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setShowDeploy(true)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                            Deploy
                        </button>
                    </div>
                </div>
            </div>

            {/* Timeline Bar */}
            {playlistContent.length > 0 && (
                <div className="bg-white border-b border-gray-200 px-6 py-3">
                    <div className="max-w-[1600px] mx-auto">
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400 font-mono shrink-0">00:00</span>
                            <div className="flex-1">
                                <TimelineBar items={playlistContent} totalDuration={totalDuration} />
                            </div>
                            <span className="text-xs text-gray-400 font-mono shrink-0">{formatDuration(totalDuration)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden bg-gray-50">
                {/* Left: Playlist Content */}
                <section className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto p-6">
                        <div className="max-w-3xl mx-auto">
                            {playlistContent.length === 0 ? (
                                <div className="h-96 border-2 border-dashed border-gray-300 hover:border-blue-400 bg-white rounded-xl transition-all flex flex-col items-center justify-center gap-4 group">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <span className="material-symbols-outlined text-3xl text-gray-400 group-hover:text-blue-500 transition-colors">
                                            playlist_add
                                        </span>
                                    </div>
                                    <div className="text-center space-y-1">
                                        <h3 className="text-lg font-semibold text-gray-900">No content yet</h3>
                                        <p className="text-sm text-gray-500">Add items from the asset library or upload new content</p>
                                    </div>
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                        Add Content
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                        <SortableContext items={playlistContent.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                            {playlistContent.map((content, index) => (
                                                <SortablePlaylistItem
                                                    key={content.id}
                                                    content={content}
                                                    index={index}
                                                    onRemove={() => handleRemoveContent(content)}
                                                    onDurationChange={d => handleDurationChange(content.id, d)}
                                                    onTransitionChange={t => handleTransitionChange(content.id, t)}
                                                    onPreview={() => setPreviewContent(content)}
                                                />
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Right: Asset Directory */}
                <aside className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0">
                    {/* Sidebar Tabs */}
                    <div className="flex border-b border-gray-200 shrink-0">
                        <button
                            onClick={() => setSidebarTab('assets')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${sidebarTab === 'assets' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">perm_media</span>
                            Assets
                        </button>
                        <button
                            onClick={() => setSidebarTab('schedule')}
                            className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${sidebarTab === 'schedule' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                            Schedule
                            {(schedule?.blocks?.length ?? 0) > 0 && (
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                            )}
                        </button>
                    </div>

                    {sidebarTab === 'assets' ? (
                        <>
                            {/* Filter Tabs */}
                            <div className="p-4 border-b border-gray-200 shrink-0">
                                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                    {(['all', 'assigned', 'unassigned'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setFilterType(type)}
                                            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors capitalize ${filterType === type ? 'text-white bg-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Asset Grid */}
                            <div className="flex-1 overflow-y-auto p-4 min-h-0">
                                {filteredAssets.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-6">
                                        <span className="material-symbols-outlined text-5xl text-gray-300 mb-3">folder_open</span>
                                        <p className="text-sm text-gray-400">
                                            {filterType === 'all' ? 'No assets yet' : filterType === 'assigned' ? 'No assigned assets' : 'No unassigned assets'}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {filteredAssets.map(asset => {
                                            const isAssigned = playlistContent.some(item => item.id === asset.id);
                                            const isVideo = asset.type === 'video' || asset.url?.includes('.mp4');
                                            return (
                                                <div key={asset.id} className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all">
                                                    <div className="aspect-video relative bg-gray-100">
                                                        {asset.url?.startsWith('http') ? (
                                                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-3xl text-gray-300">
                                                                    {asset.type === 'url' ? 'language' : 'image'}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {isVideo && (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-white text-xl drop-shadow-md">play_circle</span>
                                                            </div>
                                                        )}
                                                        {asset.duration && (
                                                            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded font-mono">
                                                                {asset.duration}s
                                                            </span>
                                                        )}
                                                        <div className="absolute top-1 right-1">
                                                            {!isAssigned ? (
                                                                <button
                                                                    onClick={() => handleAddAssetToPlaylist(asset)}
                                                                    className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-md opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                                                                >
                                                                    <span className="material-symbols-outlined text-[14px]">add</span>
                                                                </button>
                                                            ) : (
                                                                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-md">
                                                                    <span className="material-symbols-outlined text-[14px]">check</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="p-2">
                                                        <h3 className="text-xs font-medium text-gray-900 truncate">{asset.name}</h3>
                                                        <span className="text-[10px] text-gray-400 capitalize">{asset.type}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Add Button */}
                            <div className="p-3 border-t border-gray-200 shrink-0">
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">add</span>
                                    Add Content
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 overflow-y-auto p-4">
                            <PlaylistScheduler
                                schedule={schedule}
                                onChange={handleScheduleChange}
                            />
                        </div>
                    )}
                </aside>
            </main>

            {/* Modals */}
            <AddContentModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                playlistId={playlistId}
                onContentAdded={() => { fetchAssetDirectory(); fetchPlaylistContent(); }}
            />

            <PreviewModal content={previewContent} onClose={() => setPreviewContent(null)} />

            <DeployFromEditorModal
                isOpen={showDeploy}
                playlistId={playlistId}
                playlistName={playlist?.name || 'Playlist'}
                onClose={() => setShowDeploy(false)}
            />
        </div>
    );
}

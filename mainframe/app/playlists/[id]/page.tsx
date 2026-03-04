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
import ScreenLayoutPicker, { ScreenLayout, LayoutZone } from '../../../components/ScreenLayoutPicker';

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
    zone_id: string;
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
    layout_id: string;
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
    isSelected,
    onToggleSelect,
    onRemove,
    onDurationChange,
    onTransitionChange,
    onPreview,
    onDuplicate,
}: {
    content: PlaylistContent;
    index: number;
    isSelected: boolean;
    onToggleSelect: () => void;
    onRemove: () => void;
    onDurationChange: (duration: number) => void;
    onTransitionChange: (transition: string) => void;
    onPreview: () => void;
    onDuplicate: () => void;
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

    // Derive a display name: content.name → extract from URL → fallback
    const displayName = content.name
        || (content.url ? content.url.split('/').pop()?.split('?')[0] || 'Untitled' : 'Untitled');

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
                className={`cursor-grab active:cursor-grabbing mr-2 ${isDragging ? 'text-blue-500' : 'text-gray-300 hover:text-gray-500'}`}
            >
                <span className="material-symbols-outlined text-[20px]">drag_indicator</span>
            </div>

            {/* Bulk Select Checkbox */}
            <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggleSelect}
                className="mr-2 w-3.5 h-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />

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
                {content.type === 'url' ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
                        <span className="material-symbols-outlined text-emerald-500">language</span>
                    </div>
                ) : content.url?.startsWith('http') ? (
                    <img src={content.url} alt={content.name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400">image</span>
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
                <h3 className="text-sm font-medium text-gray-900 truncate">{displayName}</h3>
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
                    {content.type === 'url' && content.url && (
                        <span className="text-[10px] text-gray-400 truncate max-w-[140px]" title={content.url}>
                            {content.url.replace(/^https?:\/\//, '').split('/')[0]}
                        </span>
                    )}
                </div>
            </div>

            {/* Duration Editor with Stepper */}
            <div className="flex items-center gap-0.5 mr-3">
                <span className="material-symbols-outlined text-gray-400 text-[16px]">timer</span>
                <button
                    onClick={() => { const d = Math.max(5, localDuration - 5); setLocalDuration(d); onDurationChange(d); }}
                    className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors text-xs"
                    title="-5s"
                >
                    −
                </button>
                <input
                    type="number"
                    min={5}
                    max={300}
                    value={localDuration}
                    onChange={e => setLocalDuration(parseInt(e.target.value) || 5)}
                    onBlur={handleDurationBlur}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    className="w-12 text-sm font-mono text-gray-700 bg-gray-50 border border-gray-200 rounded-md px-1.5 py-1 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                    onClick={() => { const d = Math.min(300, localDuration + 5); setLocalDuration(d); onDurationChange(d); }}
                    className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors text-xs"
                    title="+5s"
                >
                    +
                </button>
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

            {/* Duplicate Button */}
            <button
                onClick={onDuplicate}
                className="text-gray-300 hover:text-blue-500 p-1.5 rounded-lg hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
                title="Duplicate"
            >
                <span className="material-symbols-outlined text-[18px]">content_copy</span>
            </button>

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
    const [screenLayouts, setScreenLayouts] = useState<ScreenLayout[]>([]);
    const [currentLayout, setCurrentLayout] = useState<ScreenLayout | null>(null);
    const [showLayoutPicker, setShowLayoutPicker] = useState(false);
    const [activeZoneId, setActiveZoneId] = useState<string>('main');

    // Phase 2: enhancements state
    const [assetSearch, setAssetSearch] = useState('');
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [isEditingName, setIsEditingName] = useState(false);
    const [editingName, setEditingName] = useState('');
    const [defaultTransition, setDefaultTransition] = useState('fade');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // Fetch screen layouts
    useEffect(() => {
        authenticatedFetch(`${API_URL}/api/screen-layouts`)
            .then(res => res.json())
            .then(data => setScreenLayouts(data || []))
            .catch(err => console.error('Failed to fetch screen layouts:', err));
    }, []);

    // Fetch playlist details
    useEffect(() => {
        authenticatedFetch(`${API_URL}/api/playlists/${playlistId}`)
            .then(res => res.json())
            .then(data => {
                setPlaylist(data);
                setSchedule(data.schedule || null);
                // Set current layout from playlist
                if (data.layout_id && screenLayouts.length > 0) {
                    const layout = screenLayouts.find((l: ScreenLayout) => l.id === data.layout_id);
                    if (layout) setCurrentLayout(layout);
                }
            })
            .catch(err => console.error('Failed to fetch playlist:', err));
    }, [playlistId]);

    // Fetch playlist content
    const fetchPlaylistContent = useCallback(() => {
        authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/content`)
            .then(res => res.json())
            .then((data: any[]) => {
                // Flatten nested content(*) join from Supabase
                const flattened: PlaylistContent[] = data.map((item: any) => ({
                    id: item.content?.id || item.content_id || item.id,
                    name: item.content?.name || item.name || '',
                    type: item.content?.type || item.type || 'image',
                    url: item.content?.url || item.url || '',
                    duration: item.duration || item.content?.duration || 10,
                    metadata: item.content?.metadata || item.metadata || {},
                    display_order: item.position ?? item.display_order ?? 0,
                    assignment_id: item.id || '',
                    transition: item.transition || 'fade',
                    zone_id: item.zone_id || 'main',
                }));
                setPlaylistContent(flattened);
                setOriginalContent(JSON.parse(JSON.stringify(flattened)));
                setHasChanges(false);
            })
            .catch(err => console.error('Failed to fetch playlist content:', err));
    }, [playlistId]);

    useEffect(() => { fetchPlaylistContent(); }, [fetchPlaylistContent]);

    // Fetch Asset Directory
    const fetchAssetDirectory = useCallback(() => {
        authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/assets`)
            .then(res => res.json())
            .then((data: any[]) => {
                // Flatten nested content(*) join from Supabase
                const flattened: AssetDirectoryItem[] = data.map((item: any) => ({
                    id: item.content?.id || item.content_id || item.id,
                    name: item.content?.name || item.name || '',
                    type: item.content?.type || item.type || 'image',
                    url: item.content?.url || item.url || '',
                    duration: item.content?.duration || item.duration || 10,
                    metadata: item.content?.metadata || item.metadata || {},
                    added_at: item.created_at || item.added_at || '',
                    asset_id: item.content_id || item.asset_id || item.id,
                }));
                setAssetDirectory(flattened);
            })
            .catch(err => console.error('Failed to fetch asset directory:', err));
    }, [playlistId]);

    useEffect(() => { fetchAssetDirectory(); }, [fetchAssetDirectory]);

    // Resolve layout when screenLayouts or playlist changes
    useEffect(() => {
        if (playlist?.layout_id && screenLayouts.length > 0) {
            const layout = screenLayouts.find(l => l.id === playlist.layout_id);
            if (layout) {
                setCurrentLayout(layout);
                // Set activeZoneId to first zone if current zone doesn't exist
                if (!layout.zones.find(z => z.id === activeZoneId)) {
                    setActiveZoneId(layout.zones[0]?.id || 'main');
                }
            }
        }
    }, [playlist?.layout_id, screenLayouts]);

    // Group content by zone
    const zones = currentLayout?.zones || [{ id: 'main', label: '1', x: 0, y: 0, w: 100, h: 100 }];
    const contentByZone: Record<string, PlaylistContent[]> = {};
    zones.forEach(z => { contentByZone[z.id] = []; });
    playlistContent.forEach(item => {
        const zid = item.zone_id || 'main';
        if (contentByZone[zid]) {
            contentByZone[zid].push(item);
        } else {
            // Fallback: if zone doesn't exist, put in first zone
            const fallback = zones[0]?.id || 'main';
            if (!contentByZone[fallback]) contentByZone[fallback] = [];
            contentByZone[fallback].push(item);
        }
    });

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
    const handleDragEnd = (zoneId: string) => (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setPlaylistContent(items => {
                // Only reorder items within this zone
                const zoneItems = items.filter(i => (i.zone_id || 'main') === zoneId);
                const otherItems = items.filter(i => (i.zone_id || 'main') !== zoneId);
                const oldIndex = zoneItems.findIndex(item => item.id === active.id);
                const newIndex = zoneItems.findIndex(item => item.id === over.id);
                const reordered = arrayMove(zoneItems, oldIndex, newIndex).map((item, i) => ({ ...item, display_order: i }));
                return [...otherItems, ...reordered];
            });
            setHasChanges(true);
        }
    };

    const handleLayoutChange = async (layoutId: string) => {
        const layout = screenLayouts.find(l => l.id === layoutId);
        if (!layout) return;

        // If switching from multi-zone to single, move all content to 'main'
        if (layout.zones.length === 1 && zones.length > 1) {
            setPlaylistContent(items => items.map(item => ({ ...item, zone_id: layout.zones[0].id })));
        }
        // If switching to a layout with different zones, reassign orphaned content to first zone
        if (layout.zones.length > 1) {
            const newZoneIds = layout.zones.map(z => z.id);
            setPlaylistContent(items => items.map(item => {
                if (!newZoneIds.includes(item.zone_id || 'main')) {
                    return { ...item, zone_id: layout.zones[0].id };
                }
                return item;
            }));
        }

        setCurrentLayout(layout);
        setShowLayoutPicker(false);
        setActiveZoneId(layout.zones[0]?.id || 'main');

        // Save layout change
        try {
            await authenticatedFetch(`${API_URL}/api/playlists/${playlistId}`, {
                method: 'PATCH',
                body: JSON.stringify({ layout_id: layoutId }),
            });
            setPlaylist(prev => prev ? { ...prev, layout_id: layoutId } : null);
            setHasChanges(true);
            showToast({ type: 'success', title: 'Layout Changed', message: `Layout set to "${layout.name}"` });
        } catch (err) {
            console.error('Failed to update layout:', err);
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

    const handleAddAssetToPlaylist = async (asset: AssetDirectoryItem, zoneId?: string) => {
        const targetZone = zoneId || activeZoneId || zones[0]?.id || 'main';
        const zoneItems = contentByZone[targetZone] || [];
        try {
            const response = await authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/content`, {
                method: 'POST',
                body: JSON.stringify({
                    content_id: asset.id,
                    display_order: zoneItems.length,
                    zone_id: targetZone,
                }),
            });
            if (response.ok) {
                fetchPlaylistContent();
                fetchAssetDirectory();
                const zoneName = zones.find(z => z.id === targetZone)?.label || '1';
                showToast({ type: 'success', title: 'Added', message: `"${asset.name}" added to Zone ${zoneName}` });
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
            // Save order + per-item changes (duration, transition, zone_id)
            // Rebuild positions per-zone to ensure ordering is correct
            const reorderedItems: { content_id: string; position: number; duration: number; transition: string; zone_id: string }[] = [];
            zones.forEach(zone => {
                const zoneItems = contentByZone[zone.id] || [];
                zoneItems.forEach((item, index) => {
                    reorderedItems.push({
                        content_id: item.id,
                        position: index,
                        duration: item.duration,
                        transition: item.transition || 'fade',
                        zone_id: zone.id,
                    });
                });
            });

            await authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/content/reorder`, {
                method: 'PUT',
                body: JSON.stringify({ items: reorderedItems }),
            });
            // Save schedule + layout
            await authenticatedFetch(`${API_URL}/api/playlists/${playlistId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    schedule,
                    layout_id: currentLayout?.id || 'single',
                }),
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

    // Filter assets (with search)
    const filteredAssets = assetDirectory.filter(asset => {
        const isAssigned = playlistContent.some(item => item.id === asset.id);
        if (filterType === 'assigned') return isAssigned;
        if (filterType === 'unassigned') return !isAssigned;
        return true;
    }).filter(asset => {
        if (!assetSearch.trim()) return true;
        const q = assetSearch.toLowerCase();
        return (asset.name?.toLowerCase().includes(q) || asset.type?.toLowerCase().includes(q));
    });

    // Phase 2: Bulk selection handlers
    const toggleItemSelect = (id: string) => {
        setSelectedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleBulkRemove = async () => {
        if (selectedItems.size === 0) return;
        const toRemove = Array.from(selectedItems);
        for (const id of toRemove) {
            try {
                await authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/content/${id}`, { method: 'DELETE' });
            } catch (err) {
                console.error('Failed to remove:', err);
            }
        }
        setPlaylistContent(prev => prev.filter(item => !selectedItems.has(item.id)));
        setSelectedItems(new Set());
        setHasChanges(true);
        showToast({ type: 'success', title: 'Removed', message: `${toRemove.length} item${toRemove.length > 1 ? 's' : ''} removed` });
    };

    const handleDuplicateItem = async (content: PlaylistContent) => {
        const targetZone = content.zone_id || activeZoneId || 'main';
        try {
            const response = await authenticatedFetch(`${API_URL}/api/playlists/${playlistId}/content`, {
                method: 'POST',
                body: JSON.stringify({
                    content_id: content.id,
                    display_order: playlistContent.length,
                    zone_id: targetZone,
                }),
            });
            if (response.ok) {
                fetchPlaylistContent();
                showToast({ type: 'success', title: 'Duplicated', message: `"${content.name}" duplicated` });
            }
        } catch (err) {
            console.error('Failed to duplicate:', err);
        }
    };

    const handleRename = async () => {
        if (!editingName.trim() || editingName === playlist?.name) {
            setIsEditingName(false);
            return;
        }
        try {
            const response = await authenticatedFetch(`${API_URL}/api/playlists/${playlistId}`, {
                method: 'PATCH',
                body: JSON.stringify({ name: editingName }),
            });
            if (response.ok) {
                setPlaylist(prev => prev ? { ...prev, name: editingName } : null);
                showToast({ type: 'success', title: 'Renamed', message: `Playlist renamed to "${editingName}"` });
            }
        } catch (err) {
            console.error('Failed to rename:', err);
        }
        setIsEditingName(false);
    };

    const handleSetGlobalTransition = (t: string) => {
        setDefaultTransition(t);
        setPlaylistContent(prev => prev.map(item => ({ ...item, transition: t })));
        setHasChanges(true);
        const label = TRANSITIONS.find(tr => tr.value === t)?.label || t;
        showToast({ type: 'success', title: 'Transition Updated', message: `All items set to "${label}"` });
    };

    // Phase 2: Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Avoid shortcuts when typing in inputs
            const tag = (e.target as HTMLElement).tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

            // Ctrl/Cmd + S = Save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (hasChanges) handleSave();
            }
            // Delete/Backspace = Remove selected items
            if ((e.key === 'Delete' || e.key === 'Backspace') && selectedItems.size > 0) {
                e.preventDefault();
                handleBulkRemove();
            }
            // Escape = Clear selection or close modals
            if (e.key === 'Escape') {
                if (selectedItems.size > 0) {
                    setSelectedItems(new Set());
                } else if (showLayoutPicker) {
                    setShowLayoutPicker(false);
                } else if (previewContent) {
                    setPreviewContent(null);
                }
            }
            // Ctrl/Cmd + A = Select all in active zone
            if ((e.ctrlKey || e.metaKey) && e.key === 'a' && playlistContent.length > 0) {
                e.preventDefault();
                const zoneItems = contentByZone[activeZoneId] || playlistContent;
                setSelectedItems(new Set(zoneItems.map(i => i.id)));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [hasChanges, selectedItems, showLayoutPicker, previewContent, activeZoneId, contentByZone, playlistContent]);

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
                                {isEditingName ? (
                                    <input
                                        type="text"
                                        value={editingName}
                                        onChange={e => setEditingName(e.target.value)}
                                        onBlur={handleRename}
                                        onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setIsEditingName(false); }}
                                        className="text-xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 outline-none px-0 py-0"
                                        autoFocus
                                    />
                                ) : (
                                    <h1
                                        className="text-xl font-bold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                                        onClick={() => { setEditingName(playlist.name); setIsEditingName(true); }}
                                        title="Click to rename"
                                    >
                                        {playlist.name}
                                    </h1>
                                )}
                                {hasChanges && (
                                    <span className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                        Unsaved
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                                {playlist.description && (
                                    <p className="text-sm text-gray-500">{playlist.description}</p>
                                )}
                                {/* Layout indicator */}
                                <button
                                    onClick={() => setShowLayoutPicker(true)}
                                    className="flex items-center gap-1.5 px-2 py-0.5 text-xs text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors border border-gray-200"
                                    title="Change screen layout"
                                >
                                    <span className="material-symbols-outlined text-[12px]">dashboard</span>
                                    {currentLayout?.name || 'Single'}
                                    {zones.length > 1 && (
                                        <span className="text-blue-600 font-medium">{zones.length} zones</span>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Stats + Global Transition */}
                        <div className="flex items-center gap-4 mr-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">layers</span>
                                {playlistContent.length} item{playlistContent.length !== 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[16px]">schedule</span>
                                {formatDuration(totalDuration)}
                            </span>
                            {/* Global Transition */}
                            <select
                                value={defaultTransition}
                                onChange={e => handleSetGlobalTransition(e.target.value)}
                                className="text-xs bg-gray-100 border border-gray-200 rounded-md px-2 py-1 text-gray-600 hover:bg-gray-200 cursor-pointer"
                                title="Set transition for all items"
                            >
                                {TRANSITIONS.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
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

            {/* Bulk Actions Bar */}
            {selectedItems.size > 0 && (
                <div className="bg-blue-50 border-b border-blue-200 px-6 py-2">
                    <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-700">
                            {selectedItems.size} item{selectedItems.size > 1 ? 's' : ''} selected
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setSelectedItems(new Set())}
                                className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
                            >
                                Deselect All
                            </button>
                            <button
                                onClick={handleBulkRemove}
                                className="px-3 py-1 text-xs text-red-600 hover:text-white bg-red-50 hover:bg-red-600 border border-red-200 rounded-md transition-colors flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-[14px]">delete</span>
                                Remove Selected
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline Bar — per zone */}
            {playlistContent.length > 0 && (
                <div className="bg-white border-b border-gray-200 px-6 py-3">
                    <div className="max-w-[1600px] mx-auto space-y-1">
                        {zones.map(zone => {
                            const zoneItems = contentByZone[zone.id] || [];
                            if (zoneItems.length === 0) return null;
                            const zoneDuration = zoneItems.reduce((s, i) => s + (i.duration || 10), 0);
                            return (
                                <div key={zone.id} className="flex items-center gap-3">
                                    {zones.length > 1 && (
                                        <span className="text-[10px] text-gray-400 font-medium w-6 shrink-0">Z{zone.label}</span>
                                    )}
                                    <span className="text-xs text-gray-400 font-mono shrink-0">00:00</span>
                                    <div className="flex-1">
                                        <TimelineBar items={zoneItems} totalDuration={zoneDuration} />
                                    </div>
                                    <span className="text-xs text-gray-400 font-mono shrink-0">{formatDuration(zoneDuration)}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Main Content */}
            <main className="flex-1 flex overflow-hidden bg-gray-50">
                {/* Left: Per-Zone Content Panels */}
                <section className="flex-1 flex flex-col min-w-0">
                    <div className="flex-1 overflow-y-auto p-6">
                        {playlistContent.length === 0 ? (
                            <div className="max-w-3xl mx-auto h-96 border-2 border-dashed border-gray-300 hover:border-blue-400 bg-white rounded-xl transition-all flex flex-col items-center justify-center gap-4 group">
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
                            <div className={`${zones.length > 1 ? 'flex gap-4' : 'max-w-3xl mx-auto'}`}>
                                {zones.map(zone => {
                                    const zoneItems = contentByZone[zone.id] || [];
                                    const zoneDuration = zoneItems.reduce((s, i) => s + (i.duration || 10), 0);
                                    return (
                                        <div
                                            key={zone.id}
                                            className={`${zones.length > 1 ? 'flex-1 min-w-0' : 'w-full'}`}
                                        >
                                            {/* Zone Header (only show for multi-zone) */}
                                            {zones.length > 1 && (
                                                <div
                                                    className={`flex items-center justify-between mb-3 pb-2 border-b-2 cursor-pointer transition-colors ${activeZoneId === zone.id
                                                        ? 'border-blue-400'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                    onClick={() => setActiveZoneId(zone.id)}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold ${activeZoneId === zone.id
                                                            ? 'bg-blue-500 text-white'
                                                            : 'bg-gray-200 text-gray-600'
                                                            }`}>
                                                            {zone.label}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-700">
                                                            Zone {zone.label}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {zoneItems.length} item{zoneItems.length !== 1 ? 's' : ''}
                                                        </span>
                                                    </div>
                                                    <span className="text-xs text-gray-400 font-mono">
                                                        {formatDuration(zoneDuration)}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Zone Content List */}
                                            <div className="space-y-2">
                                                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd(zone.id)}>
                                                    <SortableContext items={zoneItems.map(c => c.id)} strategy={verticalListSortingStrategy}>
                                                        {zoneItems.map((content, index) => (
                                                            <SortablePlaylistItem
                                                                key={content.id}
                                                                content={content}
                                                                index={index}
                                                                isSelected={selectedItems.has(content.id)}
                                                                onToggleSelect={() => toggleItemSelect(content.id)}
                                                                onRemove={() => handleRemoveContent(content)}
                                                                onDurationChange={d => handleDurationChange(content.id, d)}
                                                                onTransitionChange={t => handleTransitionChange(content.id, t)}
                                                                onPreview={() => setPreviewContent(content)}
                                                                onDuplicate={() => handleDuplicateItem(content)}
                                                            />
                                                        ))}
                                                    </SortableContext>
                                                </DndContext>

                                                {zoneItems.length === 0 && zones.length > 1 && (
                                                    <div className="h-24 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                                                        <p className="text-xs text-gray-400">Drop assets here or click + in the sidebar</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
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
                            <div className="p-4 border-b border-gray-200 shrink-0 space-y-3">
                                {/* Asset Search */}
                                <div className="relative">
                                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-gray-400">search</span>
                                    <input
                                        type="text"
                                        placeholder="Search assets..."
                                        value={assetSearch}
                                        onChange={e => setAssetSearch(e.target.value)}
                                        className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
                                    />
                                    {assetSearch && (
                                        <button
                                            onClick={() => setAssetSearch('')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                        </button>
                                    )}
                                </div>
                                {/* Filter Tabs */}
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
                                                        {asset.type === 'url' ? (
                                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-100">
                                                                <span className="material-symbols-outlined text-xl text-emerald-500">language</span>
                                                            </div>
                                                        ) : asset.url?.startsWith('http') ? (
                                                            <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <span className="material-symbols-outlined text-3xl text-gray-300">image</span>
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
                                                        <h3 className="text-xs font-medium text-gray-900 truncate">{asset.name || asset.url?.split('/').pop()?.split('?')[0] || 'Untitled'}</h3>
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

            {/* Layout Picker Modal */}
            {showLayoutPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLayoutPicker(false)} />
                    <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
                        <div className="flex items-center justify-between p-5 border-b border-gray-200">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Screen Layout</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Choose how content is arranged on screen</p>
                            </div>
                            <button
                                onClick={() => setShowLayoutPicker(false)}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <div className="p-5">
                            <ScreenLayoutPicker
                                layouts={screenLayouts}
                                selectedId={currentLayout?.id || playlist?.layout_id || 'single'}
                                onSelect={handleLayoutChange}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

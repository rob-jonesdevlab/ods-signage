'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/lib/api';
import { authenticatedFetch } from '@/lib/auth';
import { useToast } from '@/hooks/useToast';

interface OrgSettings {
    id: string;
    name: string;
    default_playlist_id: string | null;
    default_group_id: string | null;
    offline_threshold_minutes: number;
    offline_border_template: number;
    offline_border_width: string;
    offline_border_enabled: boolean;
    offline_border_custom_colors?: string[];
    offline_border_custom_animation?: string;
}

interface SelectOption {
    id: string;
    name: string;
}

// ─── Offline Border Template Definitions ────────────────────────
const BORDER_TEMPLATES = [
    { id: 0, name: 'Standard Logic', colors: ['#FFFF00', '#FFA500', '#FF0000', '#FF0000'], animation: 'Marching Ants' },
    { id: 1, name: 'Minimal & Neutral', colors: ['#F2D2BD', '#CC7722', '#361010', '#000000'], animation: 'Synchronous Blink' },
    { id: 2, name: 'Tokyo Night', colors: ['#24283b', '#e0af68', '#f7768e', '#f7768e'], animation: 'Breathing Glow' },
    { id: 3, name: 'Catppuccin', colors: ['#f5e0dc', '#fab387', '#eba0ac', '#eba0ac'], animation: 'Conic Rotation' },
    { id: 4, name: 'Monokai Pro', colors: ['#a9dc76', '#fc9867', '#ff6188', '#ff6188'], animation: 'Marching Ants' },
    { id: 5, name: 'Natural & Calm', colors: ['#87a980', '#d2b48c', '#e2725b', '#e2725b'], animation: 'Heartbeat' },
];

const ANIMATION_STYLES = [
    'Marching Ants',
    'Synchronous Blink',
    'Breathing Glow',
    'Conic Rotation',
    'Heartbeat',
    'Solid (No Animation)',
];

const BORDER_SIZE_PRESETS = [
    { key: 'micro', label: 'Micro', px: 1 },
    { key: 'mini', label: 'Mini', px: 2 },
    { key: 'medium', label: 'Medium', px: 3 },
    { key: 'major', label: 'Major', px: 4 },
    { key: 'mega', label: 'Mega', px: 5 },
    { key: 'mammoth', label: 'Mammoth', px: 6 },
];

const STAGE_LABELS = ['0-30m', '30-60m', '60-120m', '120m+'];

export default function OrganizationSettingsPage() {
    const { showToast } = useToast();
    const [settings, setSettings] = useState<OrgSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [playlists, setPlaylists] = useState<SelectOption[]>([]);
    const [groups, setGroups] = useState<SelectOption[]>([]);

    // Editable fields
    const [orgName, setOrgName] = useState('');
    const [defaultGroupId, setDefaultGroupId] = useState<string>('');
    const [offlineThreshold, setOfflineThreshold] = useState(5);

    // Offline border fields (mock-ready)
    const [borderTemplate, setBorderTemplate] = useState(0);
    const [borderSize, setBorderSize] = useState('micro');
    const [borderEnabled, setBorderEnabled] = useState(true);
    const [customColors, setCustomColors] = useState(['#3B82F6', '#F59E0B', '#EF4444', '#DC2626']);
    const [customAnimation, setCustomAnimation] = useState('Marching Ants');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [settingsRes, playlistsRes, groupsRes] = await Promise.all([
                authenticatedFetch(`${API_URL}/api/organizations/settings`),
                authenticatedFetch(`${API_URL}/api/playlists`),
                authenticatedFetch(`${API_URL}/api/player-groups`)
            ]);

            const settingsData = await settingsRes.json();
            const playlistsData = await playlistsRes.json();
            const groupsData = await groupsRes.json();

            setSettings(settingsData);
            setOrgName(settingsData.name || '');
            setDefaultGroupId(settingsData.default_group_id || '');
            setOfflineThreshold(settingsData.offline_threshold_minutes || 5);

            // Load border settings if available from API
            if (settingsData.offline_border_template !== undefined) {
                setBorderTemplate(settingsData.offline_border_template);
            }
            if (settingsData.offline_border_width) {
                setBorderSize(settingsData.offline_border_width);
            }
            if (settingsData.offline_border_enabled !== undefined) {
                setBorderEnabled(settingsData.offline_border_enabled);
            }
            if (settingsData.offline_border_custom_colors) {
                setCustomColors(settingsData.offline_border_custom_colors);
            }
            if (settingsData.offline_border_custom_animation) {
                setCustomAnimation(settingsData.offline_border_custom_animation);
            }

            setPlaylists(Array.isArray(playlistsData) ? playlistsData : []);
            setGroups(Array.isArray(groupsData) ? groupsData : []);
        } catch (error) {
            console.error('Error fetching settings:', error);
            showToast({ type: 'error', title: 'Error', message: 'Failed to load organization settings' });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/organizations/settings`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: orgName,
                    default_group_id: defaultGroupId || null,
                    offline_threshold_minutes: offlineThreshold,
                    offline_border_template: borderTemplate,
                    offline_border_width: borderSize,
                    offline_border_enabled: borderEnabled,
                    offline_border_custom_colors: borderTemplate === 6 ? customColors : undefined,
                    offline_border_custom_animation: borderTemplate === 6 ? customAnimation : undefined,
                })
            });

            if (res.ok) {
                const updated = await res.json();
                setSettings(updated);
                showToast({ type: 'success', title: 'Saved', message: 'Organization settings updated' });
            } else {
                const err = await res.json();
                showToast({ type: 'error', title: 'Error', message: err.error || 'Failed to save' });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            showToast({ type: 'error', title: 'Error', message: 'Failed to save settings' });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    const defaultPlaylist = playlists.find(p => p.id === settings?.default_playlist_id);
    const isCustomTemplate = borderTemplate === 6;
    const selectedTemplate = isCustomTemplate
        ? { id: 6, name: 'Custom', colors: customColors, animation: customAnimation }
        : BORDER_TEMPLATES[borderTemplate];

    const handleCustomColorChange = (index: number, color: string) => {
        const next = [...customColors];
        next[index] = color;
        setCustomColors(next);
    };

    return (
        <div className="space-y-8">
            {/* Page Title */}
            <div>
                <h2 className="text-xl font-semibold text-gray-900">Organization</h2>
                <p className="text-sm text-gray-500 mt-1">Manage organization-level settings and defaults.</p>
            </div>

            {/* Organization Name */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Organization Name</h3>
                <p className="text-sm text-gray-500 mb-4">The display name for your organization across the dashboard.</p>
                <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="My Organization"
                />
            </div>

            {/* Default Player Group */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Default Player Group</h3>
                <p className="text-sm text-gray-500 mb-4">Newly paired devices will be automatically added to this group.</p>
                <select
                    value={defaultGroupId}
                    onChange={(e) => setDefaultGroupId(e.target.value)}
                    className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="">No default group</option>
                    {groups.map(group => (
                        <option key={group.id} value={group.id}>{group.name}</option>
                    ))}
                </select>
            </div>

            {/* Player Offline Threshold */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Player Offline Threshold</h3>
                <p className="text-sm text-gray-500 mb-4">Minutes of inactivity before a player is marked as offline.</p>
                <div className="flex items-center gap-3 max-w-md">
                    <input
                        type="number"
                        value={offlineThreshold}
                        onChange={(e) => setOfflineThreshold(parseInt(e.target.value) || 1)}
                        min={1}
                        max={60}
                        className="w-24 px-4 py-2.5 border border-gray-200 rounded-lg text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <span className="text-sm text-gray-500">minutes</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Recommended: 5 minutes. Increase for locations with intermittent connectivity.</p>
            </div>

            {/* Default Playlist (read-only, managed from Playlists page) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-1">Default Playlist for New Devices</h3>
                <p className="text-sm text-gray-500 mb-4">Set from the Playlists page by clicking the star icon on any playlist.</p>
                <div className="flex items-center gap-3 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg max-w-md">
                    <span className="material-symbols-outlined text-amber-500 text-[20px]">
                        {defaultPlaylist ? 'star' : 'star_border'}
                    </span>
                    <span className="text-sm text-gray-700">
                        {defaultPlaylist ? defaultPlaylist.name : 'No default playlist set'}
                    </span>
                </div>
            </div>

            {/* ─── Offline Border Settings ─── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-semibold text-gray-900">Offline Border</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm text-gray-500">{borderEnabled ? 'Enabled' : 'Disabled'}</span>
                        <button
                            type="button"
                            role="switch"
                            aria-checked={borderEnabled}
                            onClick={() => setBorderEnabled(!borderEnabled)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${borderEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${borderEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </label>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                    A colored border appears around the player screen when it loses connection. The border color escalates over time to indicate how long the player has been offline.
                </p>

                {borderEnabled && (
                    <div className="space-y-6">
                        {/* Template Picker */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Color Template</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {BORDER_TEMPLATES.map((tmpl) => (
                                    <button
                                        key={tmpl.id}
                                        type="button"
                                        onClick={() => setBorderTemplate(tmpl.id)}
                                        className={`relative p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${borderTemplate === tmpl.id
                                            ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20'
                                            : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                            }`}
                                    >
                                        {borderTemplate === tmpl.id && (
                                            <span className="absolute top-2 right-2 material-symbols-outlined text-blue-600 text-[18px]">check_circle</span>
                                        )}
                                        <div className="text-sm font-medium text-gray-900 mb-2">{tmpl.name}</div>
                                        {/* Stage color swatches */}
                                        <div className="flex items-center gap-1.5 mb-2">
                                            {tmpl.colors.map((color, i) => (
                                                <div key={i} className="flex flex-col items-center gap-0.5">
                                                    <div
                                                        className="w-7 h-7 rounded-md border border-gray-200/80 shadow-sm"
                                                        style={{ backgroundColor: color }}
                                                        title={`Stage ${i + 1}: ${STAGE_LABELS[i]}`}
                                                    />
                                                    <span className="text-[9px] text-gray-400 leading-none">{STAGE_LABELS[i]}</span>
                                                </div>
                                            ))}
                                        </div>
                                        {/* Animation label */}
                                        <div className="flex items-center gap-1.5">
                                            <span className="material-symbols-outlined text-gray-400 text-[14px]">animation</span>
                                            <span className="text-xs text-gray-500">{tmpl.animation}</span>
                                        </div>
                                    </button>
                                ))}

                                {/* Custom Template Card */}
                                <button
                                    type="button"
                                    onClick={() => setBorderTemplate(6)}
                                    className={`relative p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${isCustomTemplate
                                        ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500/20'
                                        : 'border-gray-200 bg-gray-50 hover:border-gray-300 border-dashed'
                                        }`}
                                >
                                    {isCustomTemplate && (
                                        <span className="absolute top-2 right-2 material-symbols-outlined text-blue-600 text-[18px]">check_circle</span>
                                    )}
                                    <div className="text-sm font-medium text-gray-900 mb-2">Custom</div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        {customColors.map((color, i) => (
                                            <div key={i} className="flex flex-col items-center gap-0.5">
                                                <div
                                                    className="w-7 h-7 rounded-md border border-gray-200/80 shadow-sm"
                                                    style={{ backgroundColor: color }}
                                                    title={`Stage ${i + 1}: ${STAGE_LABELS[i]}`}
                                                />
                                                <span className="text-[9px] text-gray-400 leading-none">{STAGE_LABELS[i]}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="material-symbols-outlined text-gray-400 text-[14px]">palette</span>
                                        <span className="text-xs text-gray-500">Your colors</span>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Custom Color Editor (shown when Custom is selected) */}
                        {isCustomTemplate && (
                            <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 space-y-5">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Custom Stage Colors</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {customColors.map((color, i) => (
                                            <div key={i} className="space-y-1.5">
                                                <label className="text-xs font-medium text-gray-500">{STAGE_LABELS[i]}</label>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="color"
                                                        value={color}
                                                        onChange={(e) => handleCustomColorChange(i, e.target.value)}
                                                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={color.toUpperCase()}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) handleCustomColorChange(i, v);
                                                        }}
                                                        maxLength={7}
                                                        className="w-[5.5rem] px-2.5 py-2 border border-gray-200 rounded-lg text-sm font-mono text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                                                        placeholder="#000000"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">Animation Style</h4>
                                    <p className="text-xs text-gray-400 mb-2">Applied to the final stage (120m+) border.</p>
                                    <select
                                        value={customAnimation}
                                        onChange={(e) => setCustomAnimation(e.target.value)}
                                        className="w-full max-w-xs px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {ANIMATION_STYLES.map((anim) => (
                                            <option key={anim} value={anim}>{anim}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Border Size Presets */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Border Width</h4>
                            <div className="flex flex-wrap gap-2">
                                {BORDER_SIZE_PRESETS.map((preset) => (
                                    <button
                                        key={preset.key}
                                        type="button"
                                        onClick={() => setBorderSize(preset.key)}
                                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${borderSize === preset.key
                                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500/20'
                                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-gray-100'
                                            }`}
                                    >
                                        {preset.label}
                                        <span className="text-xs text-gray-400 ml-1.5">({preset.px}px)</span>
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                This setting applies to all players in your organization.
                            </p>
                        </div>

                        {/* Preview */}
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-3">Preview</h4>
                            <div className="relative w-full max-w-md aspect-video bg-slate-900 rounded-lg overflow-hidden">
                                {/* Simulated screen content */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-slate-600 text-[48px]">tv</span>
                                        <p className="text-slate-500 text-sm mt-2">Player Content</p>
                                    </div>
                                </div>
                                {/* Border preview */}
                                <div
                                    className="absolute inset-0 pointer-events-none rounded-lg"
                                    style={{
                                        border: `${BORDER_SIZE_PRESETS.find(p => p.key === borderSize)?.px || 1}px solid ${selectedTemplate.colors[0]}`,
                                    }}
                                />
                                {/* Stage indicator */}
                                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 rounded text-[10px] text-slate-300 backdrop-blur-sm">
                                    Stage 1 · {selectedTemplate.name} · {BORDER_SIZE_PRESETS.find(p => p.key === borderSize)?.label}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Wallpaper (stub) ─── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 opacity-60">
                <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-base font-semibold text-gray-900">Player Wallpaper</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">Coming Soon</span>
                </div>
                <p className="text-sm text-gray-500 mb-4">Upload a custom wallpaper for the player status screen glass card background.</p>
                <div className="flex items-center gap-4 max-w-md">
                    <div className="w-20 h-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400 text-[28px]">wallpaper</span>
                    </div>
                    <button
                        disabled
                        className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-400 bg-gray-50 cursor-not-allowed"
                    >
                        Upload Wallpaper
                    </button>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                    {saving ? (
                        <>
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                            Saving...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}


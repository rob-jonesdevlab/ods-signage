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
}

interface SelectOption {
    id: string;
    name: string;
}

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
                    offline_threshold_minutes: offlineThreshold
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

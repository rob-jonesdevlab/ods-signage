'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api';
import { authenticatedFetch } from '@/lib/auth';

interface Organization {
    id: string;
    name: string;
    created_at: string;
}

export default function ViewAsSwitcher() {
    const { profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [switching, setSwitching] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Only render for ODS staff
    const isODSStaff = profile?.role === 'odsadmin' || profile?.role === 'odstech';

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch available orgs when dropdown opens
    useEffect(() => {
        if (isOpen && organizations.length === 0) {
            fetchOrganizations();
        }
    }, [isOpen]);

    // Early return AFTER all hooks (Rules of Hooks compliance)
    if (!isODSStaff) return null;

    const fetchOrganizations = async () => {
        setLoading(true);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/view-as/available`);
            const data = await res.json();
            setOrganizations(data.organizations || []);
        } catch (error) {
            console.error('Failed to fetch organizations:', error);
        }
        setLoading(false);
    };

    const handleSwitch = async (orgId: string, mode: 'tech' | 'customer') => {
        setSwitching(true);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/view-as/switch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode, organization_id: orgId })
            });

            if (res.ok) {
                // Force page reload to refresh JWT with new view_as claim
                window.location.reload();
            } else {
                const err = await res.json();
                console.error('View As switch failed:', err);
            }
        } catch (error) {
            console.error('View As switch error:', error);
        }
        setSwitching(false);
        setIsOpen(false);
    };

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                title="Switch organization view"
            >
                <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                <span className="hidden sm:inline">View As</span>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-xl bg-white border border-gray-200 shadow-xl overflow-hidden z-[60]">
                    {/* Header */}
                    <div className="px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600">
                        <h3 className="text-sm font-semibold text-white">Switch Organization View</h3>
                        <p className="text-xs text-indigo-200 mt-0.5">
                            {profile?.role === 'odsadmin' ? 'All organizations' : 'Assigned organizations'}
                        </p>
                    </div>

                    {/* Search */}
                    <div className="p-3 border-b border-gray-100">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search organizations..."
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>

                    {/* Organization List */}
                    <div className="max-h-64 overflow-y-auto">
                        {loading ? (
                            <div className="p-6 text-center">
                                <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                                <p className="text-xs text-gray-400 mt-2">Loading organizations...</p>
                            </div>
                        ) : filteredOrgs.length === 0 ? (
                            <div className="p-6 text-center text-sm text-gray-400">
                                {search ? 'No matching organizations' : 'No organizations available'}
                            </div>
                        ) : (
                            filteredOrgs.map(org => (
                                <div key={org.id} className="border-b border-gray-50 last:border-0">
                                    <div className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{org.name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{org.id.substring(0, 8)}...</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 ml-3">
                                                <button
                                                    onClick={() => handleSwitch(org.id, 'tech')}
                                                    disabled={switching}
                                                    className="px-2.5 py-1 text-[11px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors disabled:opacity-50"
                                                    title="View as Tech — support & troubleshooting access"
                                                >
                                                    Tech
                                                </button>
                                                <button
                                                    onClick={() => handleSwitch(org.id, 'customer')}
                                                    disabled={switching}
                                                    className="px-2.5 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors disabled:opacity-50"
                                                    title="View as Customer — see what the customer sees"
                                                >
                                                    Customer
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                        <p className="text-[10px] text-gray-400 text-center">
                            {organizations.length} organization{organizations.length !== 1 ? 's' : ''} available
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

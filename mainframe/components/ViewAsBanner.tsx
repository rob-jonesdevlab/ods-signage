'use client';

import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/lib/api';
import { authenticatedFetch } from '@/lib/auth';
import { useState, useEffect } from 'react';

interface ViewAsState {
    active: boolean;
    mode: 'tech' | 'customer';
    organizationName: string;
    organizationId: string;
}

export default function ViewAsBanner() {
    const { profile } = useAuth();
    const [viewAs, setViewAs] = useState<ViewAsState | null>(null);
    const [exiting, setExiting] = useState(false);

    // Only check for ODS staff
    const isODSStaff = profile?.role === 'odsadmin' || profile?.role === 'odstech';

    useEffect(() => {
        if (!isODSStaff) return;
        checkViewAsStatus();
    }, [isODSStaff]);

    const checkViewAsStatus = async () => {
        try {
            const res = await authenticatedFetch(`${API_URL}/api/view-as/current`);
            const data = await res.json();

            if (data.active) {
                setViewAs({
                    active: true,
                    mode: data.view_as.mode,
                    organizationName: data.organization?.name || 'Unknown',
                    organizationId: data.view_as.organization_id
                });
            } else {
                setViewAs(null);
            }
        } catch (error) {
            console.error('Failed to check View As status:', error);
        }
    };

    const handleExit = async () => {
        setExiting(true);
        try {
            const res = await authenticatedFetch(`${API_URL}/api/view-as/exit`, {
                method: 'POST'
            });

            if (res.ok) {
                // Force reload to refresh JWT
                window.location.reload();
            }
        } catch (error) {
            console.error('Failed to exit View As:', error);
        }
        setExiting(false);
    };

    if (!viewAs) return null;

    const isTech = viewAs.mode === 'tech';

    return (
        <div className={`
            sticky top-16 z-40 px-4 py-2 flex items-center justify-between
            ${isTech
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
            }
        `}>
            <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px] animate-pulse">
                    {isTech ? 'engineering' : 'visibility'}
                </span>
                <div>
                    <span className="text-sm font-semibold">
                        Viewing as {isTech ? 'Tech' : 'Customer'}
                    </span>
                    <span className="mx-2 opacity-50">·</span>
                    <span className="text-sm font-medium opacity-90">{viewAs.organizationName}</span>
                </div>
                <span className={`
                    px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full
                    ${isTech ? 'bg-amber-600/50' : 'bg-blue-600/50'}
                `}>
                    {isTech ? 'Support Mode' : 'Customer View'}
                </span>
            </div>

            <button
                onClick={handleExit}
                disabled={exiting}
                className={`
                    flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                    ${isTech
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-white/20 hover:bg-white/30 text-white'
                    }
                    disabled:opacity-50
                `}
            >
                <span className="material-symbols-outlined text-[16px]">close</span>
                {exiting ? 'Exiting...' : 'Exit View As'}
            </button>
        </div>
    );
}

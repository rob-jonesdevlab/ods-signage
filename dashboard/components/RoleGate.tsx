'use client';

import { useAuth } from '@/contexts/AuthContext';
import { ReactNode, useEffect } from 'react';

type UserRole = 'system' | 'owner' | 'manager' | 'viewer' | 'integrations' | 'odsadmin' | 'odstech';

interface RoleGateProps {
    allowedRoles: UserRole[];
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * RoleGate component - Shows/hides content based on user role
 * System role bypasses all gates — sees everything.
 *
 * @example
 * <RoleGate allowedRoles={['owner', 'manager']}>
 *     <button>Delete Player</button>
 * </RoleGate>
 */
export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
    const { profile, loading } = useAuth();

    if (loading) {
        return <>{fallback}</>;
    }

    if (!profile) {
        return <>{fallback}</>;
    }

    // System role sees everything — no gates apply
    if (profile.role === 'system') {
        return <>{children}</>;
    }

    if (!allowedRoles.includes(profile.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

/**
 * RequireAuth component - Redirects to login if not authenticated
 */
export function RequireAuth({ children }: { children: ReactNode }) {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (!loading && !user) {
            window.location.href = '/login';
        }
    }, [user, loading]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}

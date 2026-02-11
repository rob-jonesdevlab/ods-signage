'use client';

import { useAuth } from './AuthProvider';
import { UserRole } from '@/lib/auth';
import { ReactNode, useEffect } from 'react';

interface RoleGateProps {
    allowedRoles: UserRole[];
    children: ReactNode;
    fallback?: ReactNode;
}

/**
 * RoleGate component - Shows/hides content based on user role
 * 
 * @example
 * <RoleGate allowedRoles={['Owner', 'Manager']}>
 *     <button>Delete Player</button>
 * </RoleGate>
 */
export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return <>{fallback}</>;
    }

    if (!user) {
        return <>{fallback}</>;
    }

    // Check original role if viewing as another org
    const effectiveRole = user.view_as?.original_role || user.role;

    if (!allowedRoles.includes(effectiveRole)) {
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
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-white">Loading...</div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return <>{children}</>;
}

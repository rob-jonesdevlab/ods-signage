import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface User {
    id: string;
    email: string;
    organization_id: string;
    role: UserRole;
    view_as?: ViewAsContext;
    effective_organization_id: string;
}

export type UserRole = 'Owner' | 'Manager' | 'Viewer' | 'Integrations' | 'ODSAdmin' | 'ODSTech';

export interface ViewAsContext {
    mode: 'tech' | 'customer';
    organization_id: string;
    original_role: UserRole;
}

export interface Organization {
    id: string;
    name: string;
    created_at: string;
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) throw error;
    return data;
}

/**
 * Sign out current user
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Get current authenticated user with custom claims
 */
export async function getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const metadata = user.user_metadata || {};
    const viewAs = metadata.view_as || null;

    return {
        id: user.id,
        email: user.email!,
        organization_id: metadata.organization_id || '',
        role: metadata.role || 'Viewer',
        view_as: viewAs,
        effective_organization_id: viewAs?.organization_id || metadata.organization_id || ''
    };
}

/**
 * Get current session access token (JWT)
 */
export async function getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

/**
 * Refresh the current session
 */
export async function refreshSession() {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    return data;
}

/**
 * Make authenticated API request
 * Automatically includes JWT token in Authorization header
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
    const token = await getAccessToken();

    if (!token) {
        throw new Error('Not authenticated - please log in');
    }

    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    // Handle auth errors
    if (response.status === 401) {
        // Token expired or invalid - try to refresh
        try {
            await refreshSession();
            const newToken = await getAccessToken();

            if (newToken) {
                // Retry request with new token
                return fetch(url, {
                    ...options,
                    headers: {
                        ...options.headers,
                        'Authorization': `Bearer ${newToken}`,
                        'Content-Type': 'application/json'
                    }
                });
            }
        } catch (refreshError) {
            // Refresh failed - redirect to login
            window.location.href = '/login';
            throw new Error('Session expired - please log in again');
        }
    }

    return response;
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | null, ...roles: UserRole[]): boolean {
    if (!user) return false;
    const effectiveRole = user.view_as?.original_role || user.role;
    return roles.includes(effectiveRole);
}

/**
 * Check if user is ODS staff (ODSAdmin or ODSTech)
 */
export function isODSStaff(user: User | null): boolean {
    return hasRole(user, 'ODSAdmin', 'ODSTech');
}

/**
 * Check if user is customer (Owner, Manager, Viewer, Integrations)
 */
export function isCustomer(user: User | null): boolean {
    return hasRole(user, 'Owner', 'Manager', 'Viewer', 'Integrations');
}

/**
 * Check if user has write access (Owner, Manager, ODSAdmin)
 */
export function hasWriteAccess(user: User | null): boolean {
    return hasRole(user, 'Owner', 'Manager', 'ODSAdmin');
}

/**
 * Check if user is Owner or ODSAdmin
 */
export function isOwner(user: User | null): boolean {
    return hasRole(user, 'Owner', 'ODSAdmin');
}

/**
 * Switch to "View As" mode (ODS staff only)
 */
export async function switchViewAs(mode: 'tech' | 'customer', organizationId: string) {
    const response = await authenticatedFetch('http://localhost:3001/api/view-as/switch', {
        method: 'POST',
        body: JSON.stringify({ mode, organization_id: organizationId })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to switch view mode');
    }

    const data = await response.json();

    // Refresh session to get updated JWT claims
    await refreshSession();

    return data;
}

/**
 * Exit "View As" mode (ODS staff only)
 */
export async function exitViewAs() {
    const response = await authenticatedFetch('http://localhost:3001/api/view-as/exit', {
        method: 'POST'
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to exit view mode');
    }

    const data = await response.json();

    // Refresh session to get updated JWT claims
    await refreshSession();

    return data;
}

/**
 * Get available organizations for View As (ODS staff only)
 */
export async function getAvailableOrganizations(): Promise<Organization[]> {
    const response = await authenticatedFetch('http://localhost:3001/api/view-as/available');

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get organizations');
    }

    const data = await response.json();
    return data.organizations || [];
}

/**
 * Get current view mode (ODS staff only)
 */
export async function getCurrentViewMode() {
    const response = await authenticatedFetch('http://localhost:3001/api/view-as/current');

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to get current view mode');
    }

    return response.json();
}

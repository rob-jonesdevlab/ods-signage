import { supabase } from '@/lib/supabase';

/**
 * Change user password
 */
export async function changePassword(currentPassword: string, newPassword: string) {
    // Ensure we have an active session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error('No active session');
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error('No user found');

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
    });

    if (verifyError) {
        throw new Error('Current password is incorrect');
    }

    // Update password
    const { error } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (error) throw error;

    // Log security event
    await logSecurityEvent(user.id, 'password_changed');
}

/**
 * Enable two-factor authentication
 */
export async function enable2FA(userId: string, verificationCode: string) {
    // TODO: Implement TOTP verification
    // This requires a TOTP library like 'otplib'
    throw new Error('2FA not yet implemented');
}

/**
 * Disable two-factor authentication
 */
export async function disable2FA(userId: string, verificationCode: string) {
    // TODO: Implement TOTP verification
    throw new Error('2FA not yet implemented');
}

/**
 * Get active sessions for user
 */
export async function getActiveSessions(userId: string) {
    // TODO: Supabase doesn't expose sessions via client API
    // May need to track sessions manually or use Admin API
    return [];
}

/**
 * Revoke a specific session
 */
export async function revokeSession(sessionId: string) {
    // TODO: Implement session revocation
    throw new Error('Session revocation not yet implemented');
}

/**
 * Revoke all sessions except current
 */
export async function revokeAllOtherSessions(userId: string) {
    await supabase.auth.signOut({ scope: 'others' });
}

/**
 * Get security activity log
 */
export async function getSecurityActivity(userId: string, limit: number = 20) {
    // Ensure we have an active session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        throw new Error('No active session');
    }

    const { data, error } = await supabase
        .from('security_activity')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data;
}

/**
 * Log a security event
 */
async function logSecurityEvent(userId: string, eventType: string) {
    const { error } = await supabase
        .from('security_activity')
        .insert({
            user_id: userId,
            event_type: eventType,
            ip_address: null, // TODO: Get client IP
            user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            status: 'success',
        });

    if (error) console.error('Failed to log security event:', error);
}

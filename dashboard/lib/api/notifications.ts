import { supabase } from '../supabase';
import { NotificationPreferences } from '../validations/notifications';

/**
 * Get notification preferences for a user
 */
export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences | null> {

    const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        // If no preferences exist yet, return null
        if (error.code === 'PGRST116') {
            return null;
        }
        throw error;
    }

    // Map database columns to camelCase
    return {
        emailNotifications: data.email_notifications,
        pushNotifications: data.push_notifications,
        playerOffline: data.player_offline,
        playerConnectionIssues: data.player_connection_issues,
        contentExpiring: data.content_expiring,
        contentUploadComplete: data.content_upload_complete,
        systemUpdates: data.system_updates,
        systemMaintenance: data.system_maintenance,
        marketingEmails: data.marketing_emails,
        productUpdates: data.product_updates,
        quietHoursEnabled: data.quiet_hours_enabled,
        quietHoursStart: data.quiet_hours_start || undefined,
        quietHoursEnd: data.quiet_hours_end || undefined,
    };
}

/**
 * Update notification preferences for a user
 */
export async function updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
): Promise<void> {

    // Map camelCase to database columns
    const dbData = {
        user_id: userId,
        email_notifications: preferences.emailNotifications,
        push_notifications: preferences.pushNotifications,
        player_offline: preferences.playerOffline,
        player_connection_issues: preferences.playerConnectionIssues,
        content_expiring: preferences.contentExpiring,
        content_upload_complete: preferences.contentUploadComplete,
        system_updates: preferences.systemUpdates,
        system_maintenance: preferences.systemMaintenance,
        marketing_emails: preferences.marketingEmails,
        product_updates: preferences.productUpdates,
        quiet_hours_enabled: preferences.quietHoursEnabled,
        quiet_hours_start: preferences.quietHoursStart || null,
        quiet_hours_end: preferences.quietHoursEnd || null,
    };

    // Use upsert to create or update
    const { error } = await supabase
        .from('notification_preferences')
        .upsert(dbData, { onConflict: 'user_id' });

    if (error) throw error;
}

/**
 * Request browser push notification permission
 */
export async function requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
        throw new Error('This browser does not support push notifications');
    }

    if (Notification.permission === 'granted') {
        return true;
    }

    if (Notification.permission === 'denied') {
        throw new Error('Push notifications are blocked. Please enable them in your browser settings.');
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

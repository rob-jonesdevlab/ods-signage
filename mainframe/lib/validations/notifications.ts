import { z } from 'zod';

/**
 * Validation schema for notification preferences
 */
export const notificationPreferencesSchema = z.object({
    // Master toggles
    emailNotifications: z.boolean(),
    pushNotifications: z.boolean(),

    // Notification categories
    playerOffline: z.boolean(),
    playerConnectionIssues: z.boolean(),
    contentExpiring: z.boolean(),
    contentUploadComplete: z.boolean(),
    systemUpdates: z.boolean(),
    systemMaintenance: z.boolean(),
    marketingEmails: z.boolean(),
    productUpdates: z.boolean(),

    // Quiet hours
    quietHoursEnabled: z.boolean(),
    quietHoursStart: z.string().optional(),
    quietHoursEnd: z.string().optional(),
}).refine(
    (data) => {
        // If quiet hours enabled, both start and end times must be provided
        if (data.quietHoursEnabled) {
            return !!data.quietHoursStart && !!data.quietHoursEnd;
        }
        return true;
    },
    {
        message: 'Both start and end times are required when quiet hours are enabled',
        path: ['quietHoursStart'],
    }
);

export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;

'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bell, Mail, Moon, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
    notificationPreferencesSchema,
    NotificationPreferences,
} from '@/lib/validations/notifications';
import {
    getNotificationPreferences,
    updateNotificationPreferences,
    requestPushPermission,
} from '@/lib/api/notifications';
import SettingsCard from '@/components/settings/SettingsCard';

export default function NotificationsSettings() {
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        reset,
        formState: { errors, isDirty },
    } = useForm<NotificationPreferences>({
        resolver: zodResolver(notificationPreferencesSchema),
        defaultValues: {
            emailNotifications: true,
            pushNotifications: true,
            playerOffline: true,
            playerConnectionIssues: true,
            contentExpiring: true,
            contentUploadComplete: true,
            systemUpdates: false,
            systemMaintenance: true,
            marketingEmails: false,
            productUpdates: true,
            quietHoursEnabled: false,
            quietHoursStart: '22:00',
            quietHoursEnd: '08:00',
        },
    });

    // Watch values for conditional rendering
    const emailNotifications = watch('emailNotifications');
    const pushNotifications = watch('pushNotifications');
    const quietHoursEnabled = watch('quietHoursEnabled');

    // Load notification preferences
    useEffect(() => {
        async function loadPreferences() {
            if (!user) return;

            try {
                const prefs = await getNotificationPreferences(user.id);
                if (prefs) {
                    reset(prefs);
                }
            } catch (error) {
                console.error('Failed to load notification preferences:', error);
                showToast({
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to load notification preferences',
                    duration: 3000,
                });
            } finally {
                setLoading(false);
            }
        }

        loadPreferences();
    }, [user, reset, showToast]);

    // Check push notification permission
    useEffect(() => {
        if ('Notification' in window) {
            setPushPermission(Notification.permission);
        }
    }, []);

    // Handle push notification toggle
    const handlePushToggle = async (enabled: boolean) => {
        if (enabled && pushPermission !== 'granted') {
            try {
                const granted = await requestPushPermission();
                if (granted) {
                    setPushPermission('granted');
                    setValue('pushNotifications', true, { shouldDirty: true });
                    showToast({
                        type: 'success',
                        title: 'Push Notifications Enabled',
                        message: 'You will now receive push notifications',
                        duration: 3000,
                    });
                } else {
                    setValue('pushNotifications', false);
                }
            } catch (error) {
                setValue('pushNotifications', false);
                showToast({
                    type: 'error',
                    title: 'Permission Denied',
                    message: error instanceof Error ? error.message : 'Failed to enable push notifications',
                    duration: 5000,
                });
            }
        } else {
            setValue('pushNotifications', enabled, { shouldDirty: true });
        }
    };

    // Handle form submission
    const onSubmit = async (data: NotificationPreferences) => {
        if (!user) return;

        setSaving(true);
        try {
            await updateNotificationPreferences(user.id, data);

            showToast({
                type: 'success',
                title: 'Preferences Saved',
                message: 'Your notification preferences have been updated',
                duration: 3000,
            });

            // Reset form dirty state
            reset(data);
        } catch (error) {
            console.error('Failed to save notification preferences:', error);
            showToast({
                type: 'error',
                title: 'Save Failed',
                message: 'Failed to save notification preferences. Please try again.',
                duration: 3000,
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-white mb-2">Notifications</h1>
                <p className="text-gray-400">
                    Manage how you receive notifications and alerts.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Email Notifications */}
                <SettingsCard
                    icon={Mail}
                    title="Email Notifications"
                    description="Receive notifications via email"
                >
                    <div className="space-y-4">
                        {/* Master toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-white">
                                    Enable Email Notifications
                                </label>
                                <p className="text-xs text-gray-400 mt-1">
                                    Receive all notifications via email
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('emailNotifications')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* Email categories */}
                        {emailNotifications && (
                            <div className="pl-4 border-l-2 border-gray-700 space-y-3">
                                <ToggleItem
                                    label="Player Offline Alerts"
                                    description="When a player goes offline"
                                    {...register('playerOffline')}
                                />
                                <ToggleItem
                                    label="Connection Issues"
                                    description="When a player has connectivity problems"
                                    {...register('playerConnectionIssues')}
                                />
                                <ToggleItem
                                    label="Content Expiring"
                                    description="When content is about to expire"
                                    {...register('contentExpiring')}
                                />
                                <ToggleItem
                                    label="Upload Complete"
                                    description="When content upload finishes"
                                    {...register('contentUploadComplete')}
                                />
                                <ToggleItem
                                    label="System Updates"
                                    description="New features and improvements"
                                    {...register('systemUpdates')}
                                />
                                <ToggleItem
                                    label="System Maintenance"
                                    description="Scheduled maintenance notifications"
                                    {...register('systemMaintenance')}
                                />
                                <ToggleItem
                                    label="Marketing Emails"
                                    description="Tips, best practices, and promotions"
                                    {...register('marketingEmails')}
                                />
                                <ToggleItem
                                    label="Product Updates"
                                    description="New features and product announcements"
                                    {...register('productUpdates')}
                                />
                            </div>
                        )}
                    </div>
                </SettingsCard>

                {/* Push Notifications */}
                <SettingsCard
                    icon={Smartphone}
                    title="Push Notifications"
                    description="Receive notifications in your browser"
                >
                    <div className="space-y-4">
                        {/* Master toggle */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-white">
                                    Enable Push Notifications
                                </label>
                                <p className="text-xs text-gray-400 mt-1">
                                    Get instant notifications in your browser
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={pushNotifications}
                                    onChange={(e) => handlePushToggle(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {pushPermission === 'denied' && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                <p className="text-sm text-red-400">
                                    Push notifications are blocked. Please enable them in your browser settings.
                                </p>
                            </div>
                        )}

                        {/* Push categories - same as email */}
                        {pushNotifications && pushPermission === 'granted' && (
                            <div className="pl-4 border-l-2 border-gray-700">
                                <p className="text-xs text-gray-400 mb-3">
                                    Push notifications follow the same preferences as email notifications
                                </p>
                            </div>
                        )}
                    </div>
                </SettingsCard>

                {/* Quiet Hours */}
                <SettingsCard
                    icon={Moon}
                    title="Quiet Hours"
                    description="Pause notifications during specific hours"
                >
                    <div className="space-y-4">
                        {/* Enable quiet hours */}
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-white">
                                    Enable Quiet Hours
                                </label>
                                <p className="text-xs text-gray-400 mt-1">
                                    Pause notifications during specified times
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    {...register('quietHoursEnabled')}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* Time pickers */}
                        {quietHoursEnabled && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        Start Time
                                    </label>
                                    <input
                                        type="time"
                                        {...register('quietHoursStart')}
                                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.quietHoursStart && (
                                        <p className="mt-1 text-xs text-red-400">
                                            {errors.quietHoursStart.message}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-white mb-2">
                                        End Time
                                    </label>
                                    <input
                                        type="time"
                                        {...register('quietHoursEnd')}
                                        className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        )}

                        {quietHoursEnabled && profile?.timezone && (
                            <p className="text-xs text-gray-400">
                                Times are in your timezone: {profile.timezone}
                            </p>
                        )}
                    </div>
                </SettingsCard>

                {/* Action buttons */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => reset()}
                        disabled={!isDirty || saving}
                        className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={!isDirty || saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Saving...
                            </>
                        ) : (
                            'Save Changes'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}

// Toggle item component
function ToggleItem({
    label,
    description,
    ...props
}: {
    label: string;
    description: string;
} & ReturnType<typeof useForm<NotificationPreferences>['register']>) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <label className="text-sm font-medium text-white">{label}</label>
                <p className="text-xs text-gray-400">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...props} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
        </div>
    );
}

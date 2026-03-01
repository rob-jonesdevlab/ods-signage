
'use client'

// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { changePasswordSchema, ChangePasswordData } from '@/lib/validations/security';
import { changePassword, getSecurityActivity, revokeAllOtherSessions } from '@/lib/api/security';
import SettingsCard from '@/components/SettingsCard';

export default function SecuritySettings() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [activityLog, setActivityLog] = useState<any[]>([]);
    const [loadingActivity, setLoadingActivity] = useState(true);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<ChangePasswordData>({
        resolver: zodResolver(changePasswordSchema),
    });

    // Load security activity on mount
    useEffect(() => {
        async function loadActivity() {
            if (!user) return;

            try {
                const activity = await getSecurityActivity(user.id);
                setActivityLog(activity);
            } catch (error) {
                console.error('Failed to load security activity:', error);
            } finally {
                setLoadingActivity(false);
            }
        }

        loadActivity();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const onSubmit = async (data: ChangePasswordData) => {
        if (!user) return;

        setLoading(true);
        try {
            await changePassword(data.currentPassword, data.newPassword);

            showToast({
                type: 'success',
                title: 'Password Changed',
                message: 'Your password has been updated successfully',
                duration: 3000,
            });

            reset();

            // Reload activity log to show the password change event
            const activity = await getSecurityActivity(user.id);
            setActivityLog(activity);
        } catch (error) {
            console.error('Failed to change password:', error);
            showToast({
                type: 'error',
                title: 'Password Change Failed',
                message: error instanceof Error ? error.message : 'Failed to change password',
                duration: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSignOutOtherDevices = async () => {
        if (!user) return;

        try {
            await revokeAllOtherSessions(user.id);
            showToast({
                type: 'success',
                title: 'Sessions Revoked',
                message: 'All other devices have been signed out',
                duration: 3000,
            });
        } catch (error) {
            console.error('Failed to revoke sessions:', error);
            showToast({
                type: 'error',
                title: 'Failed',
                message: 'Failed to sign out other devices',
                duration: 5000,
            });
        }
    };

    const formatEventType = (eventType: string) => {
        return eventType
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
                <p className="text-sm text-gray-500">Manage your account security and authentication</p>
            </div>

            {/* Change Password */}
            <SettingsCard
                title="Change Password"
                description="Update your password to keep your account secure"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Current Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Current Password
                        </label>
                        <input
                            type="password"
                            {...register('currentPassword')}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                            placeholder="Enter your current password"
                        />
                        {errors.currentPassword && (
                            <p className="mt-1 text-sm text-red-400">{errors.currentPassword.message}</p>
                        )}
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            {...register('newPassword')}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                            placeholder="Enter your new password"
                        />
                        {errors.newPassword && (
                            <p className="mt-1 text-sm text-red-400">{errors.newPassword.message}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                            Must be at least 8 characters with uppercase, lowercase, and number
                        </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            {...register('confirmPassword')}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                            placeholder="Confirm your new password"
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-white text-sm"
                    >
                        {loading ? 'Changing Password...' : 'Change Password'}
                    </button>
                </form>
            </SettingsCard>

            {/* Active Sessions */}
            <SettingsCard
                title="Active Sessions"
                description="Manage devices that are currently signed in to your account"
            >
                <div className="space-y-4">
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                            <strong>Note:</strong> Session management is currently limited. You can sign out all other devices, but individual session management is not yet available.
                        </p>
                    </div>
                    <button
                        onClick={handleSignOutOtherDevices}
                        className="px-6 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center gap-2 text-white text-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">logout</span>
                        Sign Out All Other Devices
                    </button>
                </div>
            </SettingsCard>

            {/* Security Activity Log */}
            <SettingsCard
                title="Security Activity"
                description="Recent security events on your account"
            >
                <div className="space-y-2">
                    {loadingActivity ? (
                        <p className="text-sm text-gray-500">Loading activity...</p>
                    ) : activityLog.length === 0 ? (
                        <p className="text-sm text-gray-500">No recent activity</p>
                    ) : (
                        <div className="space-y-2">
                            {activityLog.map((event: any) => (
                                <div
                                    key={event.id}
                                    className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatEventType(event.event_type)}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(event.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-xs px-2 py-1 rounded-full ${event.status === 'success'
                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                            : 'bg-red-50 text-red-600 border border-red-200'
                                            }`}
                                    >
                                        {event.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SettingsCard>
        </div>
    );
}


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
import { Shield, Key, Activity, LogOut } from 'lucide-react';

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
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600/20 rounded-lg">
                    <Shield className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Security Settings</h1>
                    <p className="text-gray-400">Manage your account security and authentication</p>
                </div>
            </div>

            {/* Change Password */}
            <SettingsCard
                title="Change Password"
                description="Update your password to keep your account secure"
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Current Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Current Password
                        </label>
                        <input
                            type="password"
                            {...register('currentPassword')}
                            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                            placeholder="Enter your current password"
                        />
                        {errors.currentPassword && (
                            <p className="mt-1 text-sm text-red-400">{errors.currentPassword.message}</p>
                        )}
                    </div>

                    {/* New Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            New Password
                        </label>
                        <input
                            type="password"
                            {...register('newPassword')}
                            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
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
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            {...register('confirmPassword')}
                            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-gray-500"
                            placeholder="Confirm your new password"
                        />
                        {errors.confirmPassword && (
                            <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-white"
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
                    <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-lg">
                        <p className="text-sm text-blue-300">
                            <strong>Note:</strong> Session management is currently limited. You can sign out all other devices, but individual session management is not yet available.
                        </p>
                    </div>
                    <button
                        onClick={handleSignOutOtherDevices}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors flex items-center gap-2 text-white"
                    >
                        <LogOut className="w-4 h-4" />
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
                        <p className="text-sm text-gray-400">Loading activity...</p>
                    ) : activityLog.length === 0 ? (
                        <p className="text-sm text-gray-400">No recent activity</p>
                    ) : (
                        <div className="space-y-2">
                            {activityLog.map((event: any) => (
                                <div
                                    key={event.id}
                                    className="flex justify-between items-center py-3 px-4 bg-gray-800/30 rounded-lg border border-gray-700/50"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-white">
                                            {formatEventType(event.event_type)}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(event.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <span
                                        className={`text-xs px-2 py-1 rounded ${event.status === 'success'
                                            ? 'bg-green-900/30 text-green-400'
                                            : 'bg-red-900/30 text-red-400'
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

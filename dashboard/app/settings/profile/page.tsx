'use client';


// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import SettingsCard from '@/components/SettingsCard';
import { profileSchema, ProfileFormData } from '@/lib/validations/profile';
import { updateProfile, uploadAvatar } from '@/lib/api/profile';
import { useToast } from '@/hooks/useToast';

export default function ProfilePage() {
    const { profile, user } = useAuth();
    const { showToast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        reset,
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            firstName: profile?.full_name?.split(' ')[0] || '',
            lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
            organization: profile?.organization || '',
            jobTitle: profile?.job_title || '',
            bio: profile?.bio || '',
            phone: profile?.phone || '',
            timezone: profile?.timezone || 'America/Los_Angeles',
            language: profile?.language || 'en',
        },
    });

    // Update form when profile loads
    useEffect(() => {
        if (profile) {
            reset({
                firstName: profile.full_name?.split(' ')[0] || '',
                lastName: profile.full_name?.split(' ').slice(1).join(' ') || '',
                organization: profile.organization || '',
                jobTitle: profile.job_title || '',
                bio: profile.bio || '',
                phone: profile.phone || '',
                timezone: profile.timezone || 'America/Los_Angeles',
                language: profile.language || 'en',
            });
        }
    }, [profile, reset]);

    const onSubmit = async (data: ProfileFormData) => {
        if (!user) return;

        try {
            await updateProfile(user.id, data);

            showToast({
                type: 'success',
                title: 'Profile Updated',
                message: 'Your profile has been updated successfully.',
                duration: 3000,
            });

            // Refresh the page to update the auth context
            window.location.reload();
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast({
                type: 'error',
                title: 'Update Failed',
                message: error instanceof Error ? error.message : 'Failed to update profile',
                duration: 5000,
            });
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploading(true);

        try {
            // Show preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            // Upload to Supabase
            const avatarUrl = await uploadAvatar(user.id, file);

            showToast({
                type: 'success',
                title: 'Avatar Updated',
                message: 'Your avatar has been uploaded successfully.',
                duration: 3000,
            });

            // Refresh to update avatar
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Error uploading avatar:', error);
            showToast({
                type: 'error',
                title: 'Upload Failed',
                message: error instanceof Error ? error.message : 'Failed to upload avatar',
                duration: 5000,
            });
            setAvatarPreview(null);
        } finally {
            setIsUploading(false);
        }
    };

    const formValues = watch();
    const bioCharCount = formValues.bio?.length || 0;
    const bioMaxChars = 240;

    const getInitials = () => {
        const first = formValues.firstName?.[0] || '';
        const last = formValues.lastName?.[0] || '';
        return `${first}${last}`.toUpperCase();
    };

    return (
        <div className="space-y-6">
            {/* Profile Card */}
            <SettingsCard noPadding>
                {/* Header Background */}
                <div className="relative h-32 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/10"></div>
                </div>

                {/* Profile Content */}
                <div className="px-6 md:px-10 pb-10 -mt-12">
                    <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-end gap-6">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-2xl shadow-blue-500/30">
                                    <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center relative overflow-hidden">
                                        {avatarPreview || profile?.avatar_url ? (
                                            <img
                                                src={avatarPreview || profile?.avatar_url || ''}
                                                alt="Avatar"
                                                className="w-full h-full object-cover rounded-[14px]"
                                            />
                                        ) : (
                                            <>
                                                <span className="text-3xl font-bold text-blue-600 z-10">
                                                    {getInitials()}
                                                </span>
                                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-600/20"></div>
                                            </>
                                        )}
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleAvatarClick}
                                    disabled={isUploading}
                                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border border-gray-200 text-gray-500 hover:bg-blue-600 hover:text-white transition-all disabled:opacity-50"
                                >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleAvatarChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Name & Title */}
                            <div className="mb-2">
                                <h2 className="text-2xl font-bold text-gray-900">
                                    {formValues.firstName} {formValues.lastName}
                                </h2>
                                <p className="text-gray-500 text-sm">
                                    {formValues.jobTitle || 'No job title'} @ {formValues.organization || 'No organization'}
                                </p>
                            </div>
                        </div>

                        {/* Change Avatar Button */}
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                type="button"
                                onClick={handleAvatarClick}
                                disabled={isUploading}
                                className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                            >
                                {isUploading ? 'Uploading...' : 'Change Avatar'}
                            </button>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="firstName">
                                    First Name
                                </label>
                                <input
                                    {...register('firstName')}
                                    className={`block w-full px-4 py-2.5 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm ${errors.firstName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    id="firstName"
                                    type="text"
                                    placeholder="John"
                                />
                                {errors.firstName && (
                                    <p className="text-xs text-red-400 mt-1">{errors.firstName.message}</p>
                                )}
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="lastName">
                                    Last Name
                                </label>
                                <input
                                    {...register('lastName')}
                                    className={`block w-full px-4 py-2.5 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm ${errors.lastName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    id="lastName"
                                    type="text"
                                    placeholder="Doe"
                                />
                                {errors.lastName && (
                                    <p className="text-xs text-red-400 mt-1">{errors.lastName.message}</p>
                                )}
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="email">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <span className="material-symbols-outlined text-[20px]">mail</span>
                                    </span>
                                    <input
                                        className="block w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-500 placeholder-gray-400 focus:outline-none sm:text-sm cursor-not-allowed"
                                        id="email"
                                        type="email"
                                        value={user?.email || ''}
                                        disabled
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>

                            {/* Organization */}
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-gray-700" htmlFor="organization">
                                    Organization
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <span className="material-symbols-outlined text-[20px]">business</span>
                                    </span>
                                    <input
                                        {...register('organization')}
                                        className={`block w-full pl-10 pr-3 py-2.5 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm ${errors.organization ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                        id="organization"
                                        type="text"
                                        placeholder="Your company name"
                                    />
                                </div>
                                {errors.organization && (
                                    <p className="text-xs text-red-400 mt-1">{errors.organization.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Job Title */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="jobTitle">
                                Job Title
                            </label>
                            <input
                                {...register('jobTitle')}
                                className={`block w-full px-4 py-2.5 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm ${errors.jobTitle ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                id="jobTitle"
                                type="text"
                                placeholder="e.g., Product Manager"
                            />
                            {errors.jobTitle && (
                                <p className="text-xs text-red-400 mt-1">{errors.jobTitle.message}</p>
                            )}
                        </div>

                        {/* Bio */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="bio">
                                Personal Bio
                            </label>
                            <textarea
                                {...register('bio')}
                                className={`block w-full px-4 py-3 bg-white border rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm resize-none h-24 ${errors.bio ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                id="bio"
                                placeholder="Tell us a little about yourself..."
                                maxLength={bioMaxChars}
                            />
                            <div className="flex justify-between items-center">
                                {errors.bio && (
                                    <p className="text-xs text-red-400">{errors.bio.message}</p>
                                )}
                                <p className={`text-xs text-gray-500 ml-auto ${bioCharCount > bioMaxChars ? 'text-red-400' : ''}`}>
                                    {bioMaxChars - bioCharCount} characters left
                                </p>
                            </div>
                        </div>

                        {/* Role & Permissions */}
                        <div className="border-t border-gray-200 pt-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Role & Permissions</h3>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/20 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">verified_user</span>
                                            {profile?.role === 'odsadmin' ? 'System Admin' : profile?.role || 'User'}
                                        </div>
                                        <span className="text-xs text-gray-500">Full access to all resources</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => reset()}
                                        className="px-5 py-2.5 text-sm font-medium text-gray-500 bg-transparent hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </SettingsCard>

            {/* Account Status Card */}
            <SettingsCard className="border border-gray-200">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-gray-900">Account Status</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            Your account is fully active. Next billing date: {new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.
                        </p>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-500/20 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        Active
                    </div>
                </div>
            </SettingsCard>
        </div>
    );
}

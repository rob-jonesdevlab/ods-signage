'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SettingsCard from '@/components/SettingsCard';

export default function ProfilePage() {
    const { profile, user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: profile?.full_name?.split(' ')[0] || '',
        lastName: profile?.full_name?.split(' ').slice(1).join(' ') || '',
        email: user?.email || '',
        organization: profile?.organization || '',
        jobTitle: profile?.job_title || '',
        bio: profile?.bio || '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // TODO: Implement profile update API call
            console.log('Updating profile:', formData);

            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            alert('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile');
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const bioCharCount = formData.bio.length;
    const bioMaxChars = 240;

    return (
        <div className="space-y-6">
            {/* Profile Card */}
            <SettingsCard noPadding>
                {/* Header Background */}
                <div className="relative h-32 bg-gradient-to-r from-slate-800 via-slate-900 to-black">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/50"></div>
                </div>

                {/* Profile Content */}
                <div className="px-6 md:px-10 pb-10 -mt-12">
                    <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-6 mb-8">
                        <div className="flex items-end gap-6">
                            {/* Avatar */}
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-2xl shadow-blue-500/30">
                                    <div className="w-full h-full rounded-[14px] bg-slate-900 flex items-center justify-center relative overflow-hidden">
                                        <span className="text-3xl font-bold text-white z-10">
                                            {formData.firstName[0]}{formData.lastName[0]}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-600/20"></div>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center shadow-lg border border-slate-600 text-slate-200 hover:bg-blue-600 hover:text-white transition-all"
                                >
                                    <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                            </div>

                            {/* Name & Title */}
                            <div className="mb-2">
                                <h2 className="text-2xl font-bold text-white">
                                    {formData.firstName} {formData.lastName}
                                </h2>
                                <p className="text-slate-400 text-sm">
                                    {formData.jobTitle || 'No job title'} @ {formData.organization || 'No organization'}
                                </p>
                            </div>
                        </div>

                        {/* Change Avatar Button */}
                        <div className="flex gap-3 w-full md:w-auto">
                            <button
                                type="button"
                                className="flex-1 md:flex-none px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
                            >
                                Change Avatar
                            </button>
                        </div>
                    </div>

                    {/* Profile Form */}
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Name Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-300" htmlFor="firstName">
                                    First Name
                                </label>
                                <input
                                    className="block w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                    id="firstName"
                                    name="firstName"
                                    type="text"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-300" htmlFor="lastName">
                                    Last Name
                                </label>
                                <input
                                    className="block w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                    id="lastName"
                                    name="lastName"
                                    type="text"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-300" htmlFor="email">
                                    Email Address
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <span className="material-symbols-outlined text-[20px]">mail</span>
                                    </span>
                                    <input
                                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        disabled
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
                            </div>

                            {/* Organization */}
                            <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-300" htmlFor="organization">
                                    Organization
                                </label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                        <span className="material-symbols-outlined text-[20px]">business</span>
                                    </span>
                                    <input
                                        className="block w-full pl-10 pr-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                        id="organization"
                                        name="organization"
                                        type="text"
                                        value={formData.organization}
                                        onChange={handleChange}
                                        placeholder="Your company name"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Job Title */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-300" htmlFor="jobTitle">
                                Job Title
                            </label>
                            <input
                                className="block w-full px-4 py-2.5 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                                id="jobTitle"
                                name="jobTitle"
                                type="text"
                                value={formData.jobTitle}
                                onChange={handleChange}
                                placeholder="e.g., Product Manager"
                            />
                        </div>

                        {/* Bio */}
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-300" htmlFor="bio">
                                Personal Bio
                            </label>
                            <textarea
                                className="block w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm resize-none h-24"
                                id="bio"
                                name="bio"
                                placeholder="Tell us a little about yourself..."
                                value={formData.bio}
                                onChange={handleChange}
                                maxLength={bioMaxChars}
                            />
                            <p className="text-xs text-slate-500 text-right">
                                {bioMaxChars - bioCharCount} characters left
                            </p>
                        </div>

                        {/* Role & Permissions */}
                        <div className="border-t border-slate-800 pt-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-white">Role & Permissions</h3>
                                    <div className="mt-2 flex items-center gap-2">
                                        <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-semibold border border-blue-500/20 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[14px]">verified_user</span>
                                            {profile?.role === 'odsadmin' ? 'System Admin' : profile?.role || 'User'}
                                        </div>
                                        <span className="text-xs text-slate-500">Full access to all resources</span>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        className="px-5 py-2.5 text-sm font-medium text-slate-300 bg-transparent hover:bg-slate-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </SettingsCard>

            {/* Account Status Card */}
            <SettingsCard className="border border-slate-800/50">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-base font-semibold text-white">Account Status</h3>
                        <p className="text-sm text-slate-400 mt-1">
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


'use client'

// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { inviteTeamMemberSchema, InviteTeamMemberData } from '@/lib/validations/team';
import {
    getTeamMembers,
    inviteTeamMember,
    getPendingInvitations,
    cancelInvitation,
    updateMemberRole,
    removeMember,
} from '@/lib/api/team';
import SettingsCard from '@/components/SettingsCard';

interface TeamMember {
    id: string;
    email: string;
    full_name: string | null;
    role: string;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
}

interface Invitation {
    id: string;
    email: string;
    role: string;
    message: string | null;
    status: string;
    created_at: string;
    expires_at: string;
}

export default function TeamSettings() {
    const { user, profile } = useAuth();
    const { showToast } = useToast();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviting, setInviting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<InviteTeamMemberData>({
        resolver: zodResolver(inviteTeamMemberSchema),
    });

    // Owners and ODS staff can manage team members (ODS staff will use "View As" feature in future)
    const isAdmin = profile?.role === 'owner' || profile?.role === 'odsadmin' || profile?.role === 'odstech';

    // Load team members and invitations
    useEffect(() => {
        async function loadTeamData() {
            if (!profile?.organization_id) return;

            try {
                const [membersData, invitationsData] = await Promise.all([
                    getTeamMembers(profile.organization_id),
                    getPendingInvitations(profile.organization_id),
                ]);
                setMembers(membersData);
                setInvitations(invitationsData);
            } catch (error) {
                console.error('Failed to load team data:', error);
                showToast({
                    type: 'error',
                    title: 'Failed to Load Team',
                    message: 'Could not load team members',
                    duration: 5000,
                });
            } finally {
                setLoading(false);
            }
        }

        loadTeamData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.organization_id]);

    const onSubmit = async (data: InviteTeamMemberData) => {
        if (!user || !profile?.organization_id) return;

        setInviting(true);
        try {
            await inviteTeamMember(profile.organization_id, data, user.id);

            showToast({
                type: 'success',
                title: 'Invitation Sent',
                message: `Invitation sent to ${data.email}`,
                duration: 3000,
            });

            // Reload invitations
            const invitationsData = await getPendingInvitations(profile.organization_id);
            setInvitations(invitationsData);

            reset();
            setShowInviteModal(false);
        } catch (error) {
            console.error('Failed to invite member:', error);
            showToast({
                type: 'error',
                title: 'Invitation Failed',
                message: error instanceof Error ? error.message : 'Failed to send invitation',
                duration: 5000,
            });
        } finally {
            setInviting(false);
        }
    };

    const handleCancelInvitation = async (invitationId: string, email: string) => {
        if (!profile?.organization_id) return;

        try {
            await cancelInvitation(invitationId);

            showToast({
                type: 'success',
                title: 'Invitation Cancelled',
                message: `Cancelled invitation for ${email}`,
                duration: 3000,
            });

            // Reload invitations
            const invitationsData = await getPendingInvitations(profile.organization_id);
            setInvitations(invitationsData);
        } catch (error) {
            console.error('Failed to cancel invitation:', error);
            showToast({
                type: 'error',
                title: 'Failed',
                message: 'Could not cancel invitation',
                duration: 5000,
            });
        }
    };

    const handleRoleChange = async (userId: string, newRole: string, memberName: string) => {
        if (!profile?.organization_id) return;

        try {
            await updateMemberRole(userId, newRole);

            showToast({
                type: 'success',
                title: 'Role Updated',
                message: `Updated role for ${memberName}`,
                duration: 3000,
            });

            // Reload members
            const membersData = await getTeamMembers(profile.organization_id);
            setMembers(membersData);
        } catch (error) {
            console.error('Failed to update role:', error);
            showToast({
                type: 'error',
                title: 'Failed',
                message: 'Could not update role',
                duration: 5000,
            });
        }
    };

    const handleRemoveMember = async (userId: string, memberName: string) => {
        if (!profile?.organization_id) return;
        if (!confirm(`Are you sure you want to remove ${memberName} from the team?`)) return;

        try {
            await removeMember(userId);

            showToast({
                type: 'success',
                title: 'Member Removed',
                message: `${memberName} has been removed from the team`,
                duration: 3000,
            });

            // Reload members
            const membersData = await getTeamMembers(profile.organization_id);
            setMembers(membersData);
        } catch (error) {
            console.error('Failed to remove member:', error);
            showToast({
                type: 'error',
                title: 'Failed',
                message: 'Could not remove member',
                duration: 5000,
            });
        }
    };

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'system':
                return 'bg-purple-50 text-purple-600 border-purple-200';
            case 'odsadmin':
                return 'bg-red-50 text-red-600 border-red-200';
            case 'odsmanager':
                return 'bg-blue-50 text-blue-600 border-blue-200';
            case 'supervisor':
                return 'bg-emerald-50 text-emerald-600 border-emerald-200';
            default:
                return 'bg-gray-50 text-gray-600 border-gray-200';
        }
    };

    const formatRole = (role: string) => {
        const roleMap: Record<string, string> = {
            system: 'System',
            odsadmin: 'ODS Admin',
            odsmanager: 'ODS Manager',
            supervisor: 'Supervisor',
            standard: 'Standard',
        };
        return roleMap[role] || role;
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Team Members</h2>
                    <p className="text-sm text-gray-500">Manage your team and invitations</p>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setShowInviteModal(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors flex items-center gap-2 text-white text-sm"
                    >
                        <span className="material-symbols-outlined text-[18px]">person_add</span>
                        Invite Member
                    </button>
                )}
            </div>

            {/* Team Members List */}
            <SettingsCard title="Team Members" description={`${members.length} member${members.length !== 1 ? 's' : ''}`}>
                {loading ? (
                    <p className="text-sm text-gray-500">Loading team members...</p>
                ) : members.length === 0 ? (
                    <p className="text-sm text-gray-500">No team members found</p>
                ) : (
                    <div className="space-y-3">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                            >
                                <div className="flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-gray-900 font-semibold">
                                        {member.full_name?.charAt(0).toUpperCase() || member.email.charAt(0).toUpperCase()}
                                    </div>
                                    {/* Info */}
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{member.full_name || 'No Name'}</p>
                                        <p className="text-xs text-gray-500">{member.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Role Badge */}
                                    <span className={`text-xs px-3 py-1 rounded-full border ${getRoleBadgeColor(member.role)}`}>
                                        {formatRole(member.role)}
                                    </span>

                                    {/* Actions (only for admins) */}
                                    {isAdmin && member.id !== user?.id && (
                                        <div className="flex items-center gap-2">
                                            {/* Role Selector */}
                                            <select
                                                value={member.role}
                                                onChange={(e) => handleRoleChange(member.id, e.target.value, member.full_name || member.email)}
                                                className="px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="standard">Standard</option>
                                                <option value="supervisor">Supervisor</option>
                                                <option value="odsmanager">ODS Manager</option>
                                                <option value="odsadmin">ODS Admin</option>
                                            </select>

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => handleRemoveMember(member.id, member.full_name || member.email)}
                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Remove member"
                                            >
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Current User Badge */}
                                    {member.id === user?.id && (
                                        <span className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                                            You
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </SettingsCard>

            {/* Pending Invitations */}
            {isAdmin && invitations.length > 0 && (
                <SettingsCard
                    title="Pending Invitations"
                    description={`${invitations.length} pending invitation${invitations.length !== 1 ? 's' : ''}`}
                >
                    <div className="space-y-3">
                        {invitations.map((invitation) => (
                            <div
                                key={invitation.id}
                                className="flex items-center justify-between p-4 bg-amber-50 rounded-lg border border-amber-200"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="material-symbols-outlined text-[20px] text-amber-500">mail</span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
                                        <p className="text-xs text-gray-500">
                                            Invited {new Date(invitation.created_at).toLocaleDateString()} • Expires{' '}
                                            {new Date(invitation.expires_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={`text-xs px-3 py-1 rounded-full border ${getRoleBadgeColor(invitation.role)}`}>
                                        {formatRole(invitation.role)}
                                    </span>
                                    <button
                                        onClick={() => handleCancelInvitation(invitation.id, invitation.email)}
                                        className="px-3 py-1 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SettingsCard>
            )}

            {/* Invite Member Modal */}
            {showInviteModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-100 rounded-xl border border-gray-200 max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Invite Team Member</h2>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                <input
                                    type="email"
                                    {...register('email')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                                    placeholder="colleague@example.com"
                                />
                                {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>}
                            </div>

                            {/* Role */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                                <select
                                    {...register('role')}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                                >
                                    <option value="">Select a role</option>
                                    <option value="standard">Standard - Basic user access</option>
                                    <option value="supervisor">Supervisor - Can view and approve content</option>
                                    <option value="odsmanager">ODS Manager - Can manage content and players</option>
                                </select>
                                {errors.role && <p className="mt-1 text-sm text-red-400">{errors.role.message}</p>}
                            </div>

                            {/* Message (Optional) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message <span className="text-gray-400">(Optional)</span>
                                </label>
                                <textarea
                                    {...register('message')}
                                    rows={3}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
                                    placeholder="Add a personal message to the invitation..."
                                />
                                {errors.message && <p className="mt-1 text-sm text-red-400">{errors.message.message}</p>}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowInviteModal(false);
                                        reset();
                                    }}
                                    className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-lg font-medium transition-colors text-gray-700 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={inviting}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-white text-sm"
                                >
                                    {inviting ? 'Sending...' : 'Send Invitation'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Role Descriptions */}
            <SettingsCard title="Role Permissions" description="Understanding team member roles">
                <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="material-symbols-outlined text-[20px] text-purple-500 mt-0.5">shield</span>
                        <div>
                            <p className="text-sm font-medium text-gray-900">System</p>
                            <p className="text-xs text-gray-500">Full system access (not assignable)</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="material-symbols-outlined text-[20px] text-red-500 mt-0.5">admin_panel_settings</span>
                        <div>
                            <p className="text-sm font-medium text-gray-900">ODS Admin</p>
                            <p className="text-xs text-gray-500">Organization admin, can manage all users and settings</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="material-symbols-outlined text-[20px] text-blue-500 mt-0.5">manage_accounts</span>
                        <div>
                            <p className="text-sm font-medium text-gray-900">ODS Manager</p>
                            <p className="text-xs text-gray-500">Can manage content, players, and playlists</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="material-symbols-outlined text-[20px] text-emerald-500 mt-0.5">supervisor_account</span>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Supervisor</p>
                            <p className="text-xs text-gray-500">Can view and approve content</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="material-symbols-outlined text-[20px] text-gray-500 mt-0.5">person</span>
                        <div>
                            <p className="text-sm font-medium text-gray-900">Standard</p>
                            <p className="text-xs text-gray-500">Basic user access</p>
                        </div>
                    </div>
                </div>
            </SettingsCard>
        </div>
    );
}

import { supabase } from '@/lib/supabase';
import { InviteTeamMemberData } from '../validations/team';

/**
 * Get team members for organization
 */
export async function getTeamMembers(organizationId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url, created_at, updated_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Invite team member
 */
export async function inviteTeamMember(
    organizationId: string,
    inviteData: InviteTeamMemberData,
    invitedBy: string
) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data, error } = await supabase
        .from('team_invitations')
        .insert({
            organization_id: organizationId,
            email: inviteData.email,
            role: inviteData.role,
            message: inviteData.message || null,
            invited_by: invitedBy,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get pending invitations
 */
export async function getPendingInvitations(organizationId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data, error } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

/**
 * Cancel invitation
 */
export async function cancelInvitation(invitationId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { error } = await supabase
        .from('team_invitations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', invitationId);

    if (error) throw error;
}

/**
 * Update member role
 */
export async function updateMemberRole(userId: string, role: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId);

    if (error) throw error;
}

/**
 * Remove member from organization
 */
export async function removeMember(userId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    // Set organization_id to null to remove from organization
    const { error } = await supabase
        .from('profiles')
        .update({ organization_id: null, updated_at: new Date().toISOString() })
        .eq('id', userId);

    if (error) throw error;
}

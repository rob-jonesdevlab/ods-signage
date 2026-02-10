import { z } from 'zod';

export const inviteTeamMemberSchema = z.object({
    email: z.string().email('Invalid email address'),
    role: z.enum(['standard', 'supervisor', 'odsmanager']),
    message: z.string().max(500, 'Message must be 500 characters or less').optional(),
});

export const updateRoleSchema = z.object({
    userId: z.string().uuid('Invalid user ID'),
    role: z.enum(['standard', 'supervisor', 'odsmanager', 'odsadmin']),
});

export type InviteTeamMemberData = z.infer<typeof inviteTeamMemberSchema>;
export type UpdateRoleData = z.infer<typeof updateRoleSchema>;

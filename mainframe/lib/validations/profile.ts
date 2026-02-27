import { z } from 'zod';

export const profileSchema = z.object({
    firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
    lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
    organization: z.string().max(100, 'Organization must be less than 100 characters').optional().or(z.literal('')),
    jobTitle: z.string().max(100, 'Job title must be less than 100 characters').optional().or(z.literal('')),
    bio: z.string().max(240, 'Bio must be less than 240 characters').optional().or(z.literal('')),
    phone: z.string()
        .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
        .optional()
        .or(z.literal('')),
    timezone: z.string().optional(),
    language: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

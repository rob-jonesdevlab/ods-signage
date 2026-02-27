import { z } from 'zod';

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Must contain at least one number'),
    confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
});

export const enable2FASchema = z.object({
    verificationCode: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

export const disable2FASchema = z.object({
    verificationCode: z.string().length(6, 'Code must be 6 digits').regex(/^\d+$/, 'Code must be numeric'),
});

export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type Enable2FAData = z.infer<typeof enable2FASchema>;
export type Disable2FAData = z.infer<typeof disable2FASchema>;

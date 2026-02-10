import { z } from 'zod';

export const updatePlanSchema = z.object({
    planId: z.enum(['free', 'pro', 'enterprise']),
});

export type UpdatePlanData = z.infer<typeof updatePlanSchema>;

import { z } from 'zod';

export const createApiKeySchema = z.object({
    name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
    environment: z.enum(['production', 'staging', 'development']),
});

export type CreateApiKeyData = z.infer<typeof createApiKeySchema>;

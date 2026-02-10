import { supabase } from '@/lib/supabase';
import { CreateApiKeyData } from '../validations/api';

/**
 * Generate a secure API key
 */
function generateApiKey(): string {
    const prefix = 'sk_live_';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let key = '';
    for (let i = 0; i < 32; i++) {
        key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + key;
}

/**
 * Get API keys for user
 */
export async function getApiKeys(userId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { data, error } = await supabase
        .from('api_keys')
        .select('id, name, key_prefix, environment, status, created_at, last_used_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Create new API key
 */
export async function createApiKey(userId: string, keyData: CreateApiKeyData) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const fullKey = generateApiKey();
    const keyPrefix = fullKey.substring(0, 15) + '...';

    const { data, error } = await supabase
        .from('api_keys')
        .insert({
            user_id: userId,
            name: keyData.name,
            key_hash: fullKey, // In production, this should be hashed
            key_prefix: keyPrefix,
            environment: keyData.environment,
            status: 'active',
        })
        .select()
        .single();

    if (error) throw error;

    // Return the full key (only shown once)
    return {
        ...data,
        full_key: fullKey,
    };
}

/**
 * Revoke API key
 */
export async function revokeApiKey(keyId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    const { error } = await supabase
        .from('api_keys')
        .update({ status: 'revoked' })
        .eq('id', keyId);

    if (error) throw error;
}

/**
 * Get API usage statistics
 */
export async function getApiUsageStats(userId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    // Get user's API keys
    const { data: keys } = await supabase
        .from('api_keys')
        .select('id')
        .eq('user_id', userId);

    if (!keys || keys.length === 0) {
        return {
            total_requests: 0,
            requests_by_day: [],
            top_endpoints: [],
        };
    }

    const keyIds = keys.map(k => k.id);

    // Get total requests count
    const { count: totalRequests } = await supabase
        .from('api_usage')
        .select('*', { count: 'exact', head: true })
        .in('api_key_id', keyIds);

    // Mock data for now - in production, aggregate real usage data
    return {
        total_requests: totalRequests || 0,
        requests_by_day: [], // Would contain daily request counts
        top_endpoints: [], // Would contain most used endpoints
    };
}

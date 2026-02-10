import { supabase } from '@/lib/supabase';

// Mock plan definitions
export const PLANS = {
    free: {
        name: 'Free',
        price: 0,
        interval: 'month',
        features: [
            '1 Player',
            '1 GB Storage',
            '1 User',
            'Basic Support',
        ],
        limits: {
            players: 1,
            storage: 1,
            users: 1,
        },
    },
    pro: {
        name: 'Pro',
        price: 29,
        interval: 'month',
        features: [
            '10 Players',
            '50 GB Storage',
            '5 Users',
            'Priority Support',
            'Advanced Analytics',
        ],
        limits: {
            players: 10,
            storage: 50,
            users: 5,
        },
    },
    enterprise: {
        name: 'Enterprise',
        price: 99,
        interval: 'month',
        features: [
            'Unlimited Players',
            '500 GB Storage',
            'Unlimited Users',
            '24/7 Support',
            'Advanced Analytics',
            'Custom Integrations',
            'SLA Guarantee',
        ],
        limits: {
            players: -1, // -1 means unlimited
            storage: 500,
            users: -1,
        },
    },
};

/**
 * Get current subscription for organization
 */
export async function getCurrentSubscription(organizationId: string) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            // No session, return default free plan
            return {
                id: null,
                organization_id: organizationId,
                plan_id: 'free',
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            };
        }

        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('organization_id', organizationId)
            .single();

        if (error) {
            // If no subscription exists or any error, return default free plan
            console.log('Subscription query error (returning default):', error);
            return {
                id: null,
                organization_id: organizationId,
                plan_id: 'free',
                status: 'active',
                current_period_start: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            };
        }

        return data;
    } catch (error) {
        // Catch any unexpected errors and return default
        console.error('Unexpected error in getCurrentSubscription:', error);
        return {
            id: null,
            organization_id: organizationId,
            plan_id: 'free',
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        };
    }
}

/**
 * Get billing history (invoices)
 */
export async function getBillingHistory(organizationId: string, limit: number = 10) {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return [];

        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('organization_id', organizationId)
            .order('invoice_date', { ascending: false })
            .limit(limit);

        if (error) {
            console.log('Invoice query error (returning empty):', error);
            return [];
        }
        return data || [];
    } catch (error) {
        console.error('Unexpected error in getBillingHistory:', error);
        return [];
    }
}

/**
 * Update subscription plan
 */
export async function updatePlan(organizationId: string, planId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    // Check if subscription exists
    const { data: existing } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('organization_id', organizationId)
        .single();

    if (existing) {
        // Update existing subscription
        const { error } = await supabase
            .from('subscriptions')
            .update({
                plan_id: planId,
                updated_at: new Date().toISOString(),
            })
            .eq('organization_id', organizationId);

        if (error) throw error;
    } else {
        // Create new subscription
        const { error } = await supabase
            .from('subscriptions')
            .insert({
                organization_id: organizationId,
                plan_id: planId,
            });

        if (error) throw error;
    }
}

/**
 * Get usage stats for organization (mock data)
 */
export async function getUsageStats(organizationId: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No active session');

    // Mock usage data - in production, this would query actual usage
    return {
        players: {
            used: 0,
            limit: 1,
        },
        storage: {
            used: 0.5,
            limit: 1,
        },
        users: {
            used: 1,
            limit: 1,
        },
    };
}

/**
 * Get mock payment method
 */
export async function getPaymentMethod() {
    // Mock payment method data
    return {
        brand: 'Visa',
        last4: '4242',
        exp_month: 12,
        exp_year: 2025,
    };
}

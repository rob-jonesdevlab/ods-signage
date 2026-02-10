'use client'

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import {
    getCurrentSubscription,
    getBillingHistory,
    updatePlan,
    getUsageStats,
    getPaymentMethod,
    PLANS,
} from '@/lib/api/billing';
import SettingsCard from '@/components/SettingsCard';
import { CreditCard, Download, Check } from 'lucide-react';

interface Subscription {
    id: string | null;
    organization_id: string;
    plan_id: string;
    status: string;
    current_period_start: string;
    current_period_end: string;
}

interface Invoice {
    id: string;
    amount: number;
    status: string;
    invoice_date: string;
    description: string;
}

export default function BillingSettings() {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [usageStats, setUsageStats] = useState<any>(null);
    const [paymentMethod, setPaymentMethod] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        async function loadBillingData() {
            if (!profile?.organization_id) return;

            try {
                const [subData, invoicesData, usageData, paymentData] = await Promise.all([
                    getCurrentSubscription(profile.organization_id),
                    getBillingHistory(profile.organization_id),
                    getUsageStats(profile.organization_id),
                    getPaymentMethod(),
                ]);

                setSubscription(subData);
                setInvoices(invoicesData);
                setUsageStats(usageData);
                setPaymentMethod(paymentData);
            } catch (error) {
                console.error('Failed to load billing data:', error);
                showToast({
                    type: 'error',
                    title: 'Failed to Load Billing',
                    message: 'Could not load billing information',
                    duration: 5000,
                });
            } finally {
                setLoading(false);
            }
        }

        loadBillingData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [profile?.organization_id]);

    const handlePlanChange = async (planId: string) => {
        if (!profile?.organization_id) return;
        if (!confirm(`Are you sure you want to switch to the ${PLANS[planId as keyof typeof PLANS].name} plan?`)) return;

        setUpdating(true);
        try {
            await updatePlan(profile.organization_id, planId);

            showToast({
                type: 'success',
                title: 'Plan Updated',
                message: `Successfully switched to ${PLANS[planId as keyof typeof PLANS].name} plan`,
                duration: 3000,
            });

            // Reload subscription
            const subData = await getCurrentSubscription(profile.organization_id);
            setSubscription(subData);
        } catch (error) {
            console.error('Failed to update plan:', error);
            showToast({
                type: 'error',
                title: 'Update Failed',
                message: 'Could not update plan',
                duration: 5000,
            });
        } finally {
            setUpdating(false);
        }
    };

    const currentPlan = subscription ? PLANS[subscription.plan_id as keyof typeof PLANS] : null;

    const getUsagePercentage = (used: number, limit: number) => {
        if (limit === -1) return 0; // Unlimited
        return Math.min((used / limit) * 100, 100);
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                    <CreditCard className="w-6 h-6 text-green-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
                    <p className="text-gray-400">Manage your subscription and billing</p>
                </div>
            </div>

            {loading ? (
                <p className="text-sm text-gray-400">Loading billing information...</p>
            ) : (
                <>
                    {/* Current Plan */}
                    <SettingsCard title="Current Plan" description={currentPlan ? `${currentPlan.name} - $${currentPlan.price}/month` : 'Loading...'}>
                        {currentPlan && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-lg border border-blue-800/30">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{currentPlan.name} Plan</h3>
                                        <p className="text-2xl font-bold text-blue-400 mt-1">
                                            ${currentPlan.price}
                                            <span className="text-sm text-gray-400">/{currentPlan.interval}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400">Renews on</p>
                                        <p className="text-sm text-white">
                                            {subscription ? new Date(subscription.current_period_end).toLocaleDateString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Features */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Included Features</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {currentPlan.features.map((feature, index) => (
                                            <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                                                <Check className="w-4 h-4 text-green-400" />
                                                {feature}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Usage Stats */}
                                {usageStats && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-300 mb-3">Usage</h4>
                                        <div className="space-y-3">
                                            {/* Players */}
                                            <div>
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-gray-400">Players</span>
                                                    <span className="text-white">
                                                        {usageStats.players.used} / {usageStats.players.limit === -1 ? '∞' : usageStats.players.limit}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-800 rounded-full h-2">
                                                    <div
                                                        className="bg-blue-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${getUsagePercentage(usageStats.players.used, usageStats.players.limit)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Storage */}
                                            <div>
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-gray-400">Storage</span>
                                                    <span className="text-white">
                                                        {usageStats.storage.used} GB / {usageStats.storage.limit === -1 ? '∞' : `${usageStats.storage.limit} GB`}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-800 rounded-full h-2">
                                                    <div
                                                        className="bg-purple-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${getUsagePercentage(usageStats.storage.used, usageStats.storage.limit)}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Users */}
                                            <div>
                                                <div className="flex items-center justify-between text-sm mb-1">
                                                    <span className="text-gray-400">Users</span>
                                                    <span className="text-white">
                                                        {usageStats.users.used} / {usageStats.users.limit === -1 ? '∞' : usageStats.users.limit}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-800 rounded-full h-2">
                                                    <div
                                                        className="bg-green-500 h-2 rounded-full transition-all"
                                                        style={{ width: `${getUsagePercentage(usageStats.users.used, usageStats.users.limit)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </SettingsCard>

                    {/* Payment Method */}
                    <SettingsCard title="Payment Method" description="Manage your payment information">
                        {paymentMethod ? (
                            <div className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded flex items-center justify-center text-white text-xs font-bold">
                                        {paymentMethod.brand}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">•••• •••• •••• {paymentMethod.last4}</p>
                                        <p className="text-xs text-gray-400">
                                            Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}
                                        </p>
                                    </div>
                                </div>
                                <button className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors text-white">
                                    Update
                                </button>
                            </div>
                        ) : (
                            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-white">
                                Add Payment Method
                            </button>
                        )}
                    </SettingsCard>

                    {/* Available Plans */}
                    <SettingsCard title="Available Plans" description="Choose the plan that fits your needs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(PLANS).map(([planId, plan]) => {
                                const isCurrentPlan = subscription?.plan_id === planId;
                                return (
                                    <div
                                        key={planId}
                                        className={`p-6 rounded-lg border ${isCurrentPlan
                                                ? 'bg-blue-900/20 border-blue-600'
                                                : 'bg-gray-800/30 border-gray-700/50'
                                            }`}
                                    >
                                        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                                        <p className="text-3xl font-bold text-white mt-2">
                                            ${plan.price}
                                            <span className="text-sm text-gray-400">/{plan.interval}</span>
                                        </p>
                                        <ul className="mt-4 space-y-2">
                                            {plan.features.map((feature, index) => (
                                                <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                                                    <Check className="w-4 h-4 text-green-400" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => handlePlanChange(planId)}
                                            disabled={isCurrentPlan || updating}
                                            className={`w-full mt-6 px-4 py-2 rounded-lg font-medium transition-colors ${isCurrentPlan
                                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                        >
                                            {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </SettingsCard>

                    {/* Billing History */}
                    <SettingsCard title="Billing History" description="View your past invoices">
                        {invoices.length === 0 ? (
                            <p className="text-sm text-gray-400">No invoices yet</p>
                        ) : (
                            <div className="space-y-2">
                                {invoices.map((invoice) => (
                                    <div
                                        key={invoice.id}
                                        className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-white">{invoice.description || 'Subscription Payment'}</p>
                                            <p className="text-xs text-gray-400">{new Date(invoice.invoice_date).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-semibold text-white">${invoice.amount.toFixed(2)}</span>
                                            <span
                                                className={`text-xs px-2 py-1 rounded-full ${invoice.status === 'paid'
                                                        ? 'bg-green-900/30 text-green-400'
                                                        : invoice.status === 'pending'
                                                            ? 'bg-yellow-900/30 text-yellow-400'
                                                            : 'bg-red-900/30 text-red-400'
                                                    }`}
                                            >
                                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                            </span>
                                            <button className="p-2 text-gray-400 hover:text-white transition-colors">
                                                <Download className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </SettingsCard>
                </>
            )}
        </div>
    );
}


'use client'

// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

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
            if (!profile?.organization_id) {
                setLoading(false);
                return;
            }

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

    const getDaysRemaining = () => {
        if (!subscription) return 0;
        const end = new Date(subscription.current_period_end);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    const getBillingProgress = () => {
        if (!subscription) return 0;
        const start = new Date(subscription.current_period_start);
        const end = new Date(subscription.current_period_end);
        const now = new Date();
        const total = end.getTime() - start.getTime();
        const elapsed = now.getTime() - start.getTime();
        return Math.min(100, Math.max(0, (elapsed / total) * 100));
    };

    const getUsagePercentage = (used: number, limit: number) => {
        if (limit === -1) return 0; // Unlimited
        return Math.min((used / limit) * 100, 100);
    };

    const generateInvoiceId = (index: number) => {
        const year = new Date().getFullYear();
        const num = String(index + 1).padStart(3, '0');
        return `#INV-${year}-${num}`;
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">Billing & Subscription</h2>
                <p className="text-sm text-gray-500">Manage your subscription plan, payment methods, and billing history.</p>
            </div>

            {loading ? (
                <p className="text-sm text-gray-500">Loading billing information...</p>
            ) : (
                <>
                    {/* Current Plan - Glass Panel */}
                    <div className="relative overflow-hidden rounded-xl shadow-sm bg-white border border-gray-200">
                        {/* Watermark Icon */}
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <span className="material-symbols-outlined text-[128px] text-gray-900">workspace_premium</span>
                        </div>

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Current Plan</h3>
                                <p className="text-sm text-gray-500">
                                    You are currently on the <strong className="text-gray-900">{currentPlan?.name}</strong> plan.
                                </p>
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                                ACTIVE
                            </span>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-8 relative z-10">
                            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                                {/* Pricing */}
                                <div className="space-y-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-gray-900">${currentPlan?.price}</span>
                                        <span className="text-gray-500">/ month</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-500">
                                        {currentPlan?.features.slice(0, 3).map((feature, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[16px] text-blue-500">check</span>
                                                <span>{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col gap-3 min-w-[160px]">
                                    <button className="w-full px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-lg shadow-blue-500/25 transition-all">
                                        Manage Plan
                                    </button>
                                    <button className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors">
                                        Contact Support
                                    </button>
                                </div>
                            </div>

                            {/* Billing Countdown */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="text-gray-500">
                                        Next billing date: <span className="text-gray-700">{subscription ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                                    </span>
                                    <div className="w-1/3 bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${getBillingProgress()}%` }} />
                                    </div>
                                </div>
                                <p className="text-xs text-right text-gray-500">{getDaysRemaining()} days remaining</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method & Resource Usage */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Payment Method */}
                        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-base font-semibold text-gray-900">Payment Method</h3>
                                    <button className="text-sm text-blue-500 hover:text-blue-700 font-medium">Update</button>
                                </div>
                                {paymentMethod ? (
                                    <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <div className="bg-white p-2 rounded border border-gray-200">
                                            <span className="font-bold text-blue-800 italic text-xl px-1">{paymentMethod.brand.toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{paymentMethod.brand} ending in {paymentMethod.last4}</p>
                                            <p className="text-xs text-gray-500">Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-[20px] ml-auto text-emerald-500">check_circle</span>
                                    </div>
                                ) : (
                                    <button className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-white text-sm">
                                        Add Payment Method
                                    </button>
                                )}
                            </div>
                            {paymentMethod && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <p className="text-xs text-gray-500">Billing address: 1234 Silicon Ave, San Francisco, CA 94107</p>
                                </div>
                            )}
                        </div>

                        {/* Resource Usage */}
                        <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-xl shadow-sm p-6 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 h-full w-2/3 bg-gradient-to-l from-blue-50 to-transparent pointer-events-none" />
                            <h3 className="text-base font-semibold text-gray-900 mb-4 relative z-10">Resource Usage</h3>
                            {usageStats && (
                                <div className="space-y-4 relative z-10">
                                    {/* Storage */}
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Storage ({usageStats.storage.limit === -1 ? '∞' : `${usageStats.storage.limit}GB`})</span>
                                            <span className="text-gray-900">{usageStats.storage.used}GB</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className="bg-blue-400 h-1.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all"
                                                style={{ width: `${getUsagePercentage(usageStats.storage.used, usageStats.storage.limit)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Players (Bandwidth) */}
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Players</span>
                                            <span className="text-gray-900">{usageStats.players.used} / {usageStats.players.limit === -1 ? '∞' : usageStats.players.limit}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className="bg-emerald-400 h-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all"
                                                style={{ width: `${getUsagePercentage(usageStats.players.used, usageStats.players.limit)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Users (API Calls) */}
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                            <span>Users</span>
                                            <span className="text-gray-900">{usageStats.users.used} / {usageStats.users.limit === -1 ? '∞' : usageStats.users.limit}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div
                                                className="bg-amber-400 h-1.5 rounded-full shadow-[0_0_10px_rgba(251,191,36,0.5)] transition-all"
                                                style={{ width: `${getUsagePercentage(usageStats.users.used, usageStats.users.limit)}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Billing History */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
                                <p className="text-sm text-gray-500">View and download your past invoices.</p>
                            </div>
                            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                                <span className="material-symbols-outlined text-[20px]">trending_up</span>
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            {invoices.length === 0 ? (
                                <div className="px-6 py-8 text-center text-sm text-gray-500">No invoices yet</div>
                            ) : (
                                <table className="w-full text-left text-sm text-gray-500">
                                    <thead className="bg-gray-50 text-xs uppercase font-semibold text-gray-500">
                                        <tr>
                                            <th className="px-6 py-3">Invoice ID</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Amount</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {invoices.map((invoice, index) => (
                                            <tr key={invoice.id} className="hover:bg-gray-100/30 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs text-gray-700">{generateInvoiceId(index)}</td>
                                                <td className="px-6 py-4">{new Date(invoice.invoice_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">${invoice.amount.toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${invoice.status === 'paid'
                                                            ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                                                            : invoice.status === 'pending'
                                                                ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                                            }`}
                                                    >
                                                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-blue-500 hover:text-blue-700 font-medium text-xs flex items-center justify-end gap-1 ml-auto">
                                                        <span className="material-symbols-outlined text-[16px]">download</span>
                                                        PDF
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                        {invoices.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex justify-center">
                                <button className="text-sm text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors">
                                    Load More Invoices
                                    <span className="material-symbols-outlined text-[16px] rotate-90">trending_up</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Available Plans */}
                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Available Plans</h3>
                            <p className="text-sm text-gray-500">Choose the plan that fits your needs</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(PLANS).map(([planId, plan]) => {
                                const isCurrentPlan = subscription?.plan_id === planId;
                                return (
                                    <div
                                        key={planId}
                                        className={`p-6 rounded-lg border ${isCurrentPlan
                                            ? 'bg-blue-50 border-blue-300'
                                            : 'bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                                        <p className="text-3xl font-bold text-gray-900 mt-2">
                                            ${plan.price}
                                            <span className="text-sm text-gray-500">/{plan.interval}</span>
                                        </p>
                                        <ul className="mt-4 space-y-2">
                                            {plan.features.map((feature, index) => (
                                                <li key={index} className="flex items-center gap-2 text-sm text-gray-700">
                                                    <span className="material-symbols-outlined text-[16px] text-emerald-500">check</span>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => handlePlanChange(planId)}
                                            disabled={isCurrentPlan || updating}
                                            className={`w-full mt-6 px-4 py-2.5 rounded-lg font-medium transition-colors text-sm ${isCurrentPlan
                                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                                }`}
                                        >
                                            {isCurrentPlan ? 'Current Plan' : 'Select Plan'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

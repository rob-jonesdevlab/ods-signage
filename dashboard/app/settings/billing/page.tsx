
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
import { CreditCard, Download, Check, Award, TrendingUp } from 'lucide-react';

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
            <div className="flex items-center gap-3">
                <div className="p-2 bg-green-600/20 rounded-lg">
                    <CreditCard className="w-6 h-6 text-green-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-white">Billing & Subscription</h1>
                    <p className="text-gray-400">Manage your subscription plan, payment methods, and billing history.</p>
                </div>
            </div>

            {loading ? (
                <p className="text-sm text-gray-400">Loading billing information...</p>
            ) : (
                <>
                    {/* Current Plan - Glass Panel */}
                    <div className="relative overflow-hidden rounded-xl shadow-lg bg-slate-800/70 backdrop-blur-md border border-white/8">
                        {/* Watermark Icon */}
                        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                            <Award className="w-32 h-32 text-white" />
                        </div>

                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Current Plan</h3>
                                <p className="text-sm text-slate-400">
                                    You are currently on the <strong className="text-white">{currentPlan?.name}</strong> plan.
                                </p>
                            </div>
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-600/20 text-blue-400 border border-blue-600/30">
                                ACTIVE
                            </span>
                        </div>

                        {/* Content */}
                        <div className="p-6 md:p-8 relative z-10">
                            <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                                {/* Pricing */}
                                <div className="space-y-4">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-white">${currentPlan?.price}</span>
                                        <span className="text-slate-400">/ month</span>
                                    </div>
                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
                                        {currentPlan?.features.slice(0, 3).map((feature, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-blue-400" />
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
                                    <button className="w-full px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 border border-slate-600 rounded-lg transition-colors">
                                        Contact Support
                                    </button>
                                </div>
                            </div>

                            {/* Billing Countdown */}
                            <div className="mt-8 pt-6 border-t border-slate-700/50">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="text-slate-400">
                                        Next billing date: <span className="text-slate-300">{subscription ? new Date(subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                                    </span>
                                    <div className="w-1/3 bg-slate-700 rounded-full h-2 overflow-hidden">
                                        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${getBillingProgress()}%` }} />
                                    </div>
                                </div>
                                <p className="text-xs text-right text-slate-500">{getDaysRemaining()} days remaining</p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Method & Resource Usage */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Payment Method */}
                        <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-sm p-6 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-base font-semibold text-white">Payment Method</h3>
                                    <button className="text-sm text-blue-400 hover:text-blue-300 font-medium">Update</button>
                                </div>
                                {paymentMethod ? (
                                    <div className="flex items-center gap-4 bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                                        <div className="bg-white p-2 rounded border border-slate-700">
                                            <span className="font-bold text-blue-800 italic text-xl px-1">{paymentMethod.brand.toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{paymentMethod.brand} ending in {paymentMethod.last4}</p>
                                            <p className="text-xs text-slate-400">Expires {paymentMethod.exp_month}/{paymentMethod.exp_year}</p>
                                        </div>
                                        <Check className="w-5 h-5 ml-auto text-emerald-500" />
                                    </div>
                                ) : (
                                    <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors text-white">
                                        Add Payment Method
                                    </button>
                                )}
                            </div>
                            {paymentMethod && (
                                <div className="mt-4 pt-4 border-t border-slate-700">
                                    <p className="text-xs text-slate-400">Billing address: 1234 Silicon Ave, San Francisco, CA 94107</p>
                                </div>
                            )}
                        </div>

                        {/* Resource Usage */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/50 rounded-xl shadow-lg p-6 relative overflow-hidden group">
                            <div className="absolute right-0 top-0 h-full w-2/3 bg-gradient-to-l from-blue-600/10 to-transparent pointer-events-none" />
                            <h3 className="text-base font-semibold text-white mb-4 relative z-10">Resource Usage</h3>
                            {usageStats && (
                                <div className="space-y-4 relative z-10">
                                    {/* Storage */}
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>Storage ({usageStats.storage.limit === -1 ? '∞' : `${usageStats.storage.limit}GB`})</span>
                                            <span className="text-white">{usageStats.storage.used}GB</span>
                                        </div>
                                        <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                                            <div
                                                className="bg-blue-400 h-1.5 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)] transition-all"
                                                style={{ width: `${getUsagePercentage(usageStats.storage.used, usageStats.storage.limit)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Players (Bandwidth) */}
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>Players</span>
                                            <span className="text-white">{usageStats.players.used} / {usageStats.players.limit === -1 ? '∞' : usageStats.players.limit}</span>
                                        </div>
                                        <div className="w-full bg-slate-700/50 rounded-full h-1.5">
                                            <div
                                                className="bg-emerald-400 h-1.5 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-all"
                                                style={{ width: `${getUsagePercentage(usageStats.players.used, usageStats.players.limit)}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Users (API Calls) */}
                                    <div>
                                        <div className="flex justify-between text-xs text-slate-400 mb-1">
                                            <span>Users</span>
                                            <span className="text-white">{usageStats.users.used} / {usageStats.users.limit === -1 ? '∞' : usageStats.users.limit}</span>
                                        </div>
                                        <div className="w-full bg-slate-700/50 rounded-full h-1.5">
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
                    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-sm overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-semibold text-white">Billing History</h3>
                                <p className="text-sm text-slate-400">View and download your past invoices.</p>
                            </div>
                            <button className="p-2 text-slate-400 hover:text-slate-300 transition-colors">
                                <TrendingUp className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            {invoices.length === 0 ? (
                                <div className="px-6 py-8 text-center text-sm text-slate-400">No invoices yet</div>
                            ) : (
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-slate-900/50 text-xs uppercase font-semibold text-slate-400">
                                        <tr>
                                            <th className="px-6 py-3">Invoice ID</th>
                                            <th className="px-6 py-3">Date</th>
                                            <th className="px-6 py-3">Amount</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {invoices.map((invoice, index) => (
                                            <tr key={invoice.id} className="hover:bg-slate-900/30 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs text-slate-300">{generateInvoiceId(index)}</td>
                                                <td className="px-6 py-4">{new Date(invoice.invoice_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                                <td className="px-6 py-4 font-medium text-white">${invoice.amount.toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${invoice.status === 'paid'
                                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                            : invoice.status === 'pending'
                                                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                                                                : 'bg-slate-700 text-slate-300 border-slate-600'
                                                            }`}
                                                    >
                                                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-blue-400 hover:text-blue-300 font-medium text-xs flex items-center justify-end gap-1 ml-auto">
                                                        <Download className="w-4 h-4" />
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
                            <div className="px-6 py-4 border-t border-slate-700 flex justify-center">
                                <button className="text-sm text-slate-400 hover:text-slate-200 font-medium flex items-center gap-1 transition-colors">
                                    Load More Invoices
                                    <TrendingUp className="w-4 h-4 rotate-90" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Available Plans */}
                    <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-sm p-6">
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-white">Available Plans</h3>
                            <p className="text-sm text-slate-400">Choose the plan that fits your needs</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {Object.entries(PLANS).map(([planId, plan]) => {
                                const isCurrentPlan = subscription?.plan_id === planId;
                                return (
                                    <div
                                        key={planId}
                                        className={`p-6 rounded-lg border ${isCurrentPlan
                                            ? 'bg-blue-900/20 border-blue-600'
                                            : 'bg-slate-900/30 border-slate-700/50'
                                            }`}
                                    >
                                        <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
                                        <p className="text-3xl font-bold text-white mt-2">
                                            ${plan.price}
                                            <span className="text-sm text-slate-400">/{plan.interval}</span>
                                        </p>
                                        <ul className="mt-4 space-y-2">
                                            {plan.features.map((feature, index) => (
                                                <li key={index} className="flex items-center gap-2 text-sm text-slate-300">
                                                    <Check className="w-4 h-4 text-green-400" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <button
                                            onClick={() => handlePlanChange(planId)}
                                            disabled={isCurrentPlan || updating}
                                            className={`w-full mt-6 px-4 py-2 rounded-lg font-medium transition-colors ${isCurrentPlan
                                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
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

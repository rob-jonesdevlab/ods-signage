
'use client'

// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/useToast';
import { createApiKeySchema, CreateApiKeyData } from '@/lib/validations/api';
import {
    getApiKeys,
    createApiKey,
    revokeApiKey,
    getApiUsageStats,
} from '@/lib/api/api-keys';
import SettingsCard from '@/components/SettingsCard';
import { Key, Copy, Trash2, ExternalLink, TrendingUp } from 'lucide-react';

interface ApiKey {
    id: string;
    name: string;
    key_prefix: string;
    environment: string;
    status: string;
    created_at: string;
    last_used_at: string | null;
}

export default function ApiSettings() {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [usageStats, setUsageStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newKeyData, setNewKeyData] = useState<{ full_key: string } | null>(null);
    const [creating, setCreating] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<CreateApiKeyData>({
        resolver: zodResolver(createApiKeySchema),
    });

    useEffect(() => {
        async function loadApiData() {
            if (!user) return;

            try {
                const [keysData, statsData] = await Promise.all([
                    getApiKeys(user.id),
                    getApiUsageStats(user.id),
                ]);

                setApiKeys(keysData);
                setUsageStats(statsData);
            } catch (error) {
                console.error('Failed to load API data:', error);
                showToast({
                    type: 'error',
                    title: 'Failed to Load API Data',
                    message: 'Could not load API keys',
                    duration: 5000,
                });
            } finally {
                setLoading(false);
            }
        }

        loadApiData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const onSubmit = async (data: CreateApiKeyData) => {
        if (!user) return;

        setCreating(true);
        try {
            const result = await createApiKey(user.id, data);

            showToast({
                type: 'success',
                title: 'API Key Created',
                message: 'Your new API key has been generated',
                duration: 3000,
            });

            // Show the full key
            setNewKeyData(result);

            // Reload keys
            const keysData = await getApiKeys(user.id);
            setApiKeys(keysData);

            reset();
        } catch (error) {
            console.error('Failed to create API key:', error);
            showToast({
                type: 'error',
                title: 'Creation Failed',
                message: 'Could not create API key',
                duration: 5000,
            });
        } finally {
            setCreating(false);
        }
    };

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        showToast({
            type: 'success',
            title: 'Copied',
            message: 'API key copied to clipboard',
            duration: 2000,
        });
    };

    const handleRevokeKey = async (keyId: string, keyName: string) => {
        if (!user) return;
        if (!confirm(`Are you sure you want to revoke the API key "${keyName}"? This action cannot be undone.`)) return;

        try {
            await revokeApiKey(keyId);

            showToast({
                type: 'success',
                title: 'Key Revoked',
                message: `API key "${keyName}" has been revoked`,
                duration: 3000,
            });

            // Reload keys
            const keysData = await getApiKeys(user.id);
            setApiKeys(keysData);
        } catch (error) {
            console.error('Failed to revoke key:', error);
            showToast({
                type: 'error',
                title: 'Revocation Failed',
                message: 'Could not revoke API key',
                duration: 5000,
            });
        }
    };

    const getEnvironmentBadgeColor = (env: string) => {
        switch (env) {
            case 'production':
                return 'bg-red-900/30 text-red-400 border-red-800/30';
            case 'staging':
                return 'bg-yellow-900/30 text-yellow-400 border-yellow-800/30';
            case 'development':
                return 'bg-blue-900/30 text-blue-400 border-blue-800/30';
            default:
                return 'bg-gray-900/30 text-gray-400 border-gray-800/30';
        }
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-600/20 rounded-lg">
                        <Key className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">API Access</h1>
                        <p className="text-gray-400">Manage your API keys and usage</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors text-gray-900"
                >
                    Create API Key
                </button>
            </div>

            {loading ? (
                <p className="text-sm text-gray-400">Loading API data...</p>
            ) : (
                <>
                    {/* Usage Statistics */}
                    {usageStats && (
                        <SettingsCard title="API Usage" description="Your API usage this month">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="p-4 bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg border border-purple-800/30">
                                    <div className="flex items-center gap-2 mb-2">
                                        <TrendingUp className="w-5 h-5 text-purple-400" />
                                        <p className="text-sm text-gray-400">Total Requests</p>
                                    </div>
                                    <p className="text-3xl font-bold text-gray-900">{usageStats.total_requests.toLocaleString()}</p>
                                </div>
                                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                    <p className="text-sm text-gray-400 mb-2">Rate Limit</p>
                                    <p className="text-3xl font-bold text-gray-900">1,000</p>
                                    <p className="text-xs text-gray-500 mt-1">requests/hour</p>
                                </div>
                                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                                    <p className="text-sm text-gray-400 mb-2">Success Rate</p>
                                    <p className="text-3xl font-bold text-green-400">99.9%</p>
                                </div>
                            </div>
                        </SettingsCard>
                    )}

                    {/* API Keys List */}
                    <SettingsCard title="API Keys" description={`${apiKeys.length} key${apiKeys.length !== 1 ? 's' : ''}`}>
                        {apiKeys.length === 0 ? (
                            <div className="text-center py-8">
                                <Key className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-400">No API keys yet</p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors text-gray-900"
                                >
                                    Create Your First API Key
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {apiKeys.map((key) => (
                                    <div
                                        key={key.id}
                                        className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <p className="text-sm font-medium text-gray-900">{key.name}</p>
                                                <span className={`text-xs px-2 py-1 rounded-full border ${getEnvironmentBadgeColor(key.environment)}`}>
                                                    {key.environment}
                                                </span>
                                                {key.status === 'revoked' && (
                                                    <span className="text-xs px-2 py-1 rounded-full bg-red-900/30 text-red-400 border border-red-800/30">
                                                        Revoked
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-400">
                                                <span className="font-mono">{key.key_prefix}</span>
                                                <span>Created {new Date(key.created_at).toLocaleDateString()}</span>
                                                {key.last_used_at && (
                                                    <span>Last used {new Date(key.last_used_at).toLocaleDateString()}</span>
                                                )}
                                            </div>
                                        </div>

                                        {key.status === 'active' && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleCopyKey(key.key_prefix)}
                                                    className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-700 rounded-lg transition-colors"
                                                    title="Copy key prefix"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleRevokeKey(key.id, key.name)}
                                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                                                    title="Revoke key"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </SettingsCard>

                    {/* API Documentation */}
                    <SettingsCard title="API Documentation" description="Learn how to integrate with our API">
                        <div className="space-y-3">
                            <a
                                href="/docs/api"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-purple-600/50 transition-colors group"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900 group-hover:text-purple-400 transition-colors">
                                        API Reference
                                    </p>
                                    <p className="text-xs text-gray-400">Complete API documentation and endpoints</p>
                                </div>
                                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                            </a>
                            <a
                                href="/docs/quickstart"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg border border-gray-700/50 hover:border-purple-600/50 transition-colors group"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900 group-hover:text-purple-400 transition-colors">
                                        Quick Start Guide
                                    </p>
                                    <p className="text-xs text-gray-400">Get started with the API in minutes</p>
                                </div>
                                <ExternalLink className="w-5 h-5 text-gray-400 group-hover:text-purple-400 transition-colors" />
                            </a>
                        </div>
                    </SettingsCard>
                </>
            )}

            {/* Create API Key Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-100 rounded-xl border border-gray-200 max-w-md w-full p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Create API Key</h2>

                        {newKeyData ? (
                            // Show the generated key
                            <div className="space-y-4">
                                <div className="p-4 bg-yellow-900/20 border border-yellow-800/30 rounded-lg">
                                    <p className="text-sm text-yellow-400 mb-2">⚠️ Save this key now!</p>
                                    <p className="text-xs text-gray-400">This key will only be shown once. Make sure to copy it to a safe place.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Your API Key</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newKeyData.full_key}
                                            readOnly
                                            className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-900 font-mono text-sm"
                                        />
                                        <button
                                            onClick={() => handleCopyKey(newKeyData.full_key)}
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-gray-900"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setNewKeyData(null);
                                        setShowCreateModal(false);
                                    }}
                                    className="w-full px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors text-gray-900"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            // Show the creation form
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Key Name</label>
                                    <input
                                        type="text"
                                        {...register('name')}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                                        placeholder="Production API Key"
                                    />
                                    {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>}
                                </div>

                                {/* Environment */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Environment</label>
                                    <select
                                        {...register('environment')}
                                        className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
                                    >
                                        <option value="">Select environment</option>
                                        <option value="production">Production</option>
                                        <option value="staging">Staging</option>
                                        <option value="development">Development</option>
                                    </select>
                                    {errors.environment && <p className="mt-1 text-sm text-red-400">{errors.environment.message}</p>}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            reset();
                                        }}
                                        className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors text-gray-900"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={creating}
                                        className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors text-gray-900"
                                    >
                                        {creating ? 'Creating...' : 'Create Key'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

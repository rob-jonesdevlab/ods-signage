'use client';

import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { PencilSquareIcon, PlusCircleIcon, TrashIcon, UserIcon } from '@heroicons/react/24/solid';

interface AuditTrailModalProps {
    isOpen: boolean;
    onClose: () => void;
    auditLog: AuditLogDetail | null;
}

export interface AuditLogDetail {
    id: string;
    user_email: string;
    action: string;
    resource_type: string;
    resource_id: string;
    details: string;
    created_at: string;
    // Extended fields (if available from API)
    user_name?: string;
    user_role?: 'admin' | 'client';
    changes?: {
        field: string;
        oldValue: any;
        newValue: any;
    }[];
    metadata?: {
        ipAddress?: string;
        userAgent?: string;
        sessionId?: string;
    };
}

export default function AuditTrailModal({ isOpen, onClose, auditLog }: AuditTrailModalProps) {
    if (!isOpen || !auditLog) return null;

    const getActionIcon = (action: string) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('create') || actionLower.includes('add')) {
            return <PlusCircleIcon className="w-6 h-6 text-green-600" />;
        } else if (actionLower.includes('update') || actionLower.includes('edit') || actionLower.includes('modify')) {
            return <PencilSquareIcon className="w-6 h-6 text-blue-600" />;
        } else if (actionLower.includes('delete') || actionLower.includes('remove')) {
            return <TrashIcon className="w-6 h-6 text-red-600" />;
        }
        return <UserIcon className="w-6 h-6 text-gray-600" />;
    };

    const getActionColor = (action: string) => {
        const actionLower = action.toLowerCase();
        if (actionLower.includes('create') || actionLower.includes('add')) {
            return 'bg-green-100 text-green-700';
        } else if (actionLower.includes('update') || actionLower.includes('edit') || actionLower.includes('modify')) {
            return 'bg-blue-100 text-blue-700';
        } else if (actionLower.includes('delete') || actionLower.includes('remove')) {
            return 'bg-red-100 text-red-700';
        }
        return 'bg-gray-100 text-gray-700';
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        let relative = '';
        if (diffDays > 0) {
            relative = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        } else if (diffHours > 0) {
            relative = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        } else {
            relative = 'Just now';
        }

        const absolute = date.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });

        return { relative, absolute };
    };

    const handleExport = () => {
        const dataStr = JSON.stringify(auditLog, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-log-${auditLog.id}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const getUserInitials = (name?: string, email?: string) => {
        if (name) {
            const parts = name.split(' ');
            return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
        }
        if (email) {
            return email.substring(0, 2).toUpperCase();
        }
        return 'U';
    };

    const timestamp = formatTimestamp(auditLog.created_at);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-gray-900">Audit Log Detail</h2>
                        <span className="text-xs font-mono px-2 py-1 bg-gray-100 text-gray-600 rounded">
                            #{auditLog.id.substring(0, 8)}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="px-8 py-6 space-y-6">
                    {/* Event Header */}
                    <div className="flex items-start gap-4">
                        <div className="mt-1 p-3 bg-blue-50 rounded-full">{getActionIcon(auditLog.action)}</div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                {auditLog.action} on {auditLog.resource_type}
                            </h3>
                            <div className="space-y-0.5">
                                <p className="text-sm text-gray-600 font-medium">{timestamp.relative}</p>
                                <p className="text-xs text-gray-500">{timestamp.absolute}</p>
                            </div>
                        </div>
                    </div>

                    {/* User Information */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Performed By</label>
                        <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                                {getUserInitials(auditLog.user_name, auditLog.user_email)}
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900">{auditLog.user_name || auditLog.user_email}</p>
                                <p className="text-sm text-gray-600">{auditLog.user_email}</p>
                            </div>
                            {auditLog.user_role && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium capitalize">
                                    {auditLog.user_role}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Action */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Action</label>
                        <div className="flex items-center gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase ${getActionColor(auditLog.action)}`}>
                                {auditLog.action}
                            </span>
                            <p className="text-sm text-gray-700">{auditLog.details}</p>
                        </div>
                    </div>

                    {/* Resource Details */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Resource</label>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs font-medium capitalize">
                                            {auditLog.resource_type}
                                        </span>
                                        <span className="text-xs font-mono text-gray-500">#{auditLog.resource_id}</span>
                                    </div>
                                    <p className="font-medium text-gray-900">Resource ID: {auditLog.resource_id}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Changes (if available) */}
                    {auditLog.changes && auditLog.changes.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Changes Made</label>
                            <div className="space-y-3">
                                {auditLog.changes.map((change, idx) => (
                                    <div key={idx} className="grid grid-cols-2 gap-3">
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                            <p className="text-xs font-medium text-gray-600 mb-1">{change.field}</p>
                                            <p className="text-sm text-gray-900 line-through">
                                                {JSON.stringify(change.oldValue)}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <p className="text-xs font-medium text-gray-600 mb-1">{change.field}</p>
                                            <p className="text-sm text-gray-900">{JSON.stringify(change.newValue)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Metadata */}
                    {auditLog.metadata && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Metadata</label>
                            <div className="bg-gray-50 rounded-lg p-4 space-y-2 font-mono text-xs">
                                {auditLog.metadata.ipAddress && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">IP Address:</span>
                                        <span className="text-gray-900">{auditLog.metadata.ipAddress}</span>
                                    </div>
                                )}
                                {auditLog.metadata.userAgent && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">User Agent:</span>
                                        <span className="text-gray-900 truncate ml-4">{auditLog.metadata.userAgent}</span>
                                    </div>
                                )}
                                {auditLog.metadata.sessionId && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Session ID:</span>
                                        <span className="text-gray-900">{auditLog.metadata.sessionId}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white px-8 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm"
                    >
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        Export Log
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium text-sm"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

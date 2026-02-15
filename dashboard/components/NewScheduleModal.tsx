'use client';

import { useState } from 'react';
import { XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface NewScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (scheduleData: ScheduleFormData) => void;
}

export interface ScheduleFormData {
    title: string;
    type: 'playlist' | 'firmware' | 'maintenance' | 'content';
    targets: string[];
    scheduleDate: string;
    scheduleTime: string;
    recurrence: {
        enabled: boolean;
        frequency?: 'daily' | 'weekly' | 'monthly';
        endDate?: string;
    };
    notifications: {
        emailOnCompletion: boolean;
        alertOnFailure: boolean;
    };
}

const UPDATE_TYPES = [
    { value: 'playlist', label: 'Playlist Deployment', icon: '🎵', color: 'purple' },
    { value: 'firmware', label: 'Firmware Update', icon: '⚙️', color: 'blue' },
    { value: 'maintenance', label: 'Maintenance Task', icon: '🔧', color: 'amber' },
    { value: 'content', label: 'Content Refresh', icon: '🎨', color: 'green' },
];

export default function NewScheduleModal({ isOpen, onClose, onSubmit }: NewScheduleModalProps) {
    const [formData, setFormData] = useState<ScheduleFormData>({
        title: '',
        type: 'playlist',
        targets: [],
        scheduleDate: '',
        scheduleTime: '',
        recurrence: {
            enabled: false,
        },
        notifications: {
            emailOnCompletion: false,
            alertOnFailure: true,
        },
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!formData.title.trim()) {
            newErrors.title = 'Title is required';
        } else if (formData.title.length > 100) {
            newErrors.title = 'Title must be less than 100 characters';
        }

        if (formData.targets.length === 0) {
            newErrors.targets = 'At least one target must be selected';
        }

        if (!formData.scheduleDate) {
            newErrors.scheduleDate = 'Schedule date is required';
        }

        if (!formData.scheduleTime) {
            newErrors.scheduleTime = 'Schedule time is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            onClose();
            // Reset form
            setFormData({
                title: '',
                type: 'playlist',
                targets: [],
                scheduleDate: '',
                scheduleTime: '',
                recurrence: { enabled: false },
                notifications: { emailOnCompletion: false, alertOnFailure: true },
            });
        } catch (error) {
            console.error('Error submitting schedule:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTargetToggle = (target: string) => {
        setFormData(prev => ({
            ...prev,
            targets: prev.targets.includes(target)
                ? prev.targets.filter(t => t !== target)
                : [...prev.targets, target],
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white px-8 py-6 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Schedule Update</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6">
                    {/* Update Title */}
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                            Update Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="title"
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            placeholder="e.g., Q3 Marketing Campaign"
                            className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                    </div>

                    {/* Update Type */}
                    <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                            Update Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="type"
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            {UPDATE_TYPES.map(type => (
                                <option key={type.value} value={type.value}>
                                    {type.icon} {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Target Devices */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Target Devices <span className="text-red-500">*</span>
                        </label>
                        <div className="space-y-2">
                            {['All Players', 'Retail Locations', 'Lobby Screens', 'Break Room TVs'].map(target => (
                                <label key={target} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.targets.includes(target)}
                                        onChange={() => handleTargetToggle(target)}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="text-sm text-gray-700">{target}</span>
                                </label>
                            ))}
                        </div>
                        {formData.targets.length > 0 && (
                            <p className="mt-2 text-sm text-gray-500">{formData.targets.length} target(s) selected</p>
                        )}
                        {errors.targets && <p className="mt-1 text-sm text-red-500">{errors.targets}</p>}
                    </div>

                    {/* Schedule Time */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                                Schedule Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="date"
                                type="date"
                                value={formData.scheduleDate}
                                onChange={e => setFormData({ ...formData, scheduleDate: e.target.value })}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.scheduleDate ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.scheduleDate && <p className="mt-1 text-sm text-red-500">{errors.scheduleDate}</p>}
                        </div>
                        <div>
                            <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-2">
                                Schedule Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="time"
                                type="time"
                                value={formData.scheduleTime}
                                onChange={e => setFormData({ ...formData, scheduleTime: e.target.value })}
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.scheduleTime ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.scheduleTime && <p className="mt-1 text-sm text-red-500">{errors.scheduleTime}</p>}
                        </div>
                    </div>

                    {/* Recurrence */}
                    <div>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={formData.recurrence.enabled}
                                onChange={e =>
                                    setFormData({
                                        ...formData,
                                        recurrence: { ...formData.recurrence, enabled: e.target.checked },
                                    })
                                }
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Repeat this update</span>
                        </label>
                    </div>

                    {/* Notifications */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">Notifications</label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.notifications.emailOnCompletion}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            notifications: {
                                                ...formData.notifications,
                                                emailOnCompletion: e.target.checked,
                                            },
                                        })
                                    }
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Send email notification on completion</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.notifications.alertOnFailure}
                                    onChange={e =>
                                        setFormData({
                                            ...formData,
                                            notifications: {
                                                ...formData.notifications,
                                                alertOnFailure: e.target.checked,
                                            },
                                        })
                                    }
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Alert on failure</span>
                            </label>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white px-8 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium text-sm shadow-md shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Scheduling...
                            </>
                        ) : (
                            <>
                                <CalendarIcon className="w-4 h-4" />
                                Schedule Update
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

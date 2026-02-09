'use client';

import { useState, useRef, useEffect } from 'react';

interface DateRange {
    start: Date | null;
    end: Date | null;
}

interface DateRangePickerProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
    className?: string;
}

export default function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempRange, setTempRange] = useState<DateRange>(value);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getDisplayText = () => {
        if (!value.start && !value.end) return 'Select date range';
        if (value.start && value.end) return `${formatDate(value.start)} - ${formatDate(value.end)}`;
        if (value.start) return `From ${formatDate(value.start)}`;
        return `Until ${formatDate(value.end)}`;
    };

    const handleApply = () => {
        onChange(tempRange);
        setIsOpen(false);
    };

    const handleClear = () => {
        const cleared = { start: null, end: null };
        setTempRange(cleared);
        onChange(cleared);
        setIsOpen(false);
    };

    const handleQuickSelect = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        const range = { start, end };
        setTempRange(range);
        onChange(range);
        setIsOpen(false);
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-4 py-2.5 
                    bg-slate-800 hover:bg-slate-700 
                    border rounded-lg text-sm transition-all 
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    ${value.start || value.end ? 'border-blue-500 text-blue-400' : 'border-slate-700 text-slate-300'}
                `}
            >
                <span className="material-symbols-outlined text-[20px]">calendar_month</span>
                <span className="hidden sm:inline">{getDisplayText()}</span>
                <span className={`material-symbols-outlined text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''
                    }`}>
                    expand_more
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl shadow-black/50 z-50 overflow-hidden">
                    <div className="p-4">
                        {/* Quick Select Options */}
                        <div className="mb-4">
                            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 block">
                                Quick Select
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                                <button
                                    onClick={() => handleQuickSelect(7)}
                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors"
                                >
                                    Last 7 days
                                </button>
                                <button
                                    onClick={() => handleQuickSelect(30)}
                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors"
                                >
                                    Last 30 days
                                </button>
                                <button
                                    onClick={() => handleQuickSelect(90)}
                                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors"
                                >
                                    Last 90 days
                                </button>
                            </div>
                        </div>

                        {/* Custom Date Inputs */}
                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="text-xs font-medium text-slate-400 mb-1 block">Start Date</label>
                                <input
                                    type="date"
                                    value={tempRange.start ? tempRange.start.toISOString().split('T')[0] : ''}
                                    onChange={(e) => setTempRange({ ...tempRange, start: e.target.value ? new Date(e.target.value) : null })}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-slate-400 mb-1 block">End Date</label>
                                <input
                                    type="date"
                                    value={tempRange.end ? tempRange.end.toISOString().split('T')[0] : ''}
                                    onChange={(e) => setTempRange({ ...tempRange, end: e.target.value ? new Date(e.target.value) : null })}
                                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button
                                onClick={handleClear}
                                className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm transition-colors"
                            >
                                Clear
                            </button>
                            <button
                                onClick={handleApply}
                                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm transition-colors"
                            >
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

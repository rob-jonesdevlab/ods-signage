'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterConfig {
    id: string;
    label: string;
    options: FilterOption[];
    type?: 'multi' | 'single';  // Default: multi
}

interface FilterBarProps {
    filters: FilterConfig[];
    activeFilters: Record<string, string[]>;
    onFilterChange: (filterId: string, values: string[]) => void;
    onClearAll: () => void;
}

export default function FilterBar({ filters, activeFilters, onFilterChange, onClearAll }: FilterBarProps) {
    const [openDropdown, setOpenDropdown] = useState<string | null>(null);
    const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (openDropdown && dropdownRefs.current[openDropdown] &&
                !dropdownRefs.current[openDropdown]?.contains(event.target as Node)) {
                setOpenDropdown(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdown]);

    const getActiveFilterCount = () => {
        return Object.values(activeFilters).filter(values => values.length > 0).length;
    };

    const getActiveFilterLabel = (filterId: string) => {
        const values = activeFilters[filterId];
        if (!values || values.length === 0) return null;

        const filter = filters.find(f => f.id === filterId);
        if (!filter) return null;

        const labels = values.map(value => {
            const option = filter.options.find(opt => opt.value === value);
            return option?.label || value;
        });

        return `${filter.label}: ${labels.join(', ')}`;
    };

    const removeFilter = (filterId: string, valueToRemove?: string) => {
        if (valueToRemove) {
            const newValues = activeFilters[filterId].filter(v => v !== valueToRemove);
            onFilterChange(filterId, newValues);
        } else {
            onFilterChange(filterId, []);
        }
    };

    const toggleFilterValue = (filterId: string, value: string, isSingle: boolean) => {
        const currentValues = activeFilters[filterId] || [];

        if (isSingle) {
            // Single select - replace
            onFilterChange(filterId, currentValues.includes(value) ? [] : [value]);
        } else {
            // Multi select - toggle
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            onFilterChange(filterId, newValues);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
                {/* Filter Dropdowns */}
                {filters.map(filter => {
                    const isActive = activeFilters[filter.id]?.length > 0;
                    const isSingle = filter.type === 'single';

                    return (
                        <div key={filter.id} className="relative" ref={el => { dropdownRefs.current[filter.id] = el; }}>
                            <button
                                onClick={() => setOpenDropdown(openDropdown === filter.id ? null : filter.id)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all text-sm font-semibold ${isActive
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                                        : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                                    }`}
                            >
                                {filter.label}
                                {isActive && (
                                    <span className="ml-1 px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full">
                                        {activeFilters[filter.id].length}
                                    </span>
                                )}
                                <ChevronDownIcon className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {openDropdown === filter.id && (
                                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-80 overflow-y-auto">
                                    <div className="p-2">
                                        {filter.options.map(option => {
                                            const isChecked = activeFilters[filter.id]?.includes(option.value);

                                            return (
                                                <label
                                                    key={option.value}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 cursor-pointer text-sm transition-colors"
                                                >
                                                    <input
                                                        type={isSingle ? 'radio' : 'checkbox'}
                                                        checked={isChecked}
                                                        onChange={() => toggleFilterValue(filter.id, option.value, isSingle)}
                                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                                    />
                                                    <span className="text-gray-700 font-medium">{option.label}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                    <div className="border-t border-gray-200 p-2 flex justify-end bg-gray-50">
                                        <button
                                            onClick={() => setOpenDropdown(null)}
                                            className="px-4 py-2 text-sm font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                        >
                                            Done
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Active Filter Pills */}
                {Object.entries(activeFilters).map(([filterId, values]) => {
                    if (values.length === 0) return null;
                    const label = getActiveFilterLabel(filterId);
                    if (!label) return null;

                    return (
                        <div
                            key={filterId}
                            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl text-sm font-semibold shadow-sm"
                        >
                            <span>{label}</span>
                            <button
                                onClick={() => removeFilter(filterId)}
                                className="hover:bg-blue-700 rounded-full p-1 transition-colors"
                            >
                                <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    );
                })}

                {/* Active Filter Count & Clear All */}
                {getActiveFilterCount() > 0 && (
                    <>
                        <span className="text-sm text-gray-600 font-medium">
                            {getActiveFilterCount()} filter{getActiveFilterCount() > 1 ? 's' : ''} active
                        </span>
                        <button
                            onClick={onClearAll}
                            className="text-sm text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline"
                        >
                            Clear All
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

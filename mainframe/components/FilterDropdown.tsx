'use client';

import { useState, useRef, useEffect } from 'react';

interface FilterOption {
    label: string;
    value: string;
    icon?: string;
    color?: string;
}

interface FilterDropdownProps {
    label: string;
    options: FilterOption[];
    value: string[];
    onChange: (values: string[]) => void;
    icon?: string;
    className?: string;
}

export default function FilterDropdown({ label, options, value, onChange, icon = 'filter_list', className = '' }: FilterDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
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

    const toggleOption = (optionValue: string) => {
        if (value.includes(optionValue)) {
            onChange(value.filter(v => v !== optionValue));
        } else {
            onChange([...value, optionValue]);
        }
    };

    const handleClearAll = () => {
        onChange([]);
        setIsOpen(false);
    };

    const getDisplayText = () => {
        if (value.length === 0) return label;
        if (value.length === 1) {
            const option = options.find(opt => opt.value === value[0]);
            return option?.label || label;
        }
        return `${value.length} selected`;
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    flex items-center gap-2 px-4 py-2.5 
                    bg-white hover:bg-gray-50 
                    border rounded-lg text-sm transition-all shadow-sm
                    focus:outline-none focus:ring-2 focus:ring-blue-500/20
                    ${value.length > 0 ? 'border-blue-500 text-blue-600' : 'border-gray-200 text-gray-700'}
                `}
            >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                <span className="hidden sm:inline">{getDisplayText()}</span>
                {value.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded text-xs font-medium">
                        {value.length}
                    </span>
                )}
                <span className={`material-symbols-outlined text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''
                    }`}>
                    expand_more
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
                    <div className="p-2">
                        {/* Options */}
                        <div className="max-h-64 overflow-y-auto">
                            {options.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => toggleOption(option.value)}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-2.5 rounded text-sm transition-colors
                                        ${value.includes(option.value)
                                            ? 'bg-blue-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-50'
                                        }
                                    `}
                                >
                                    <span className="flex items-center gap-2">
                                        {option.icon && (
                                            <span className={`material-symbols-outlined text-[20px] ${option.color || ''}`}>
                                                {option.icon}
                                            </span>
                                        )}
                                        <span>{option.label}</span>
                                    </span>
                                    {value.includes(option.value) && (
                                        <span className="material-symbols-outlined text-[18px] fill-1">check</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Clear Button */}
                        {value.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-gray-200">
                                <button
                                    onClick={handleClearAll}
                                    className="w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors"
                                >
                                    Clear All
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

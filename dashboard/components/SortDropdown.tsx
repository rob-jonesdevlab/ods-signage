'use client';

import { useState, useRef, useEffect } from 'react';

export interface SortOption {
    label: string;
    value: string;
    direction: 'asc' | 'desc';
}

interface SortDropdownProps {
    options: SortOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export default function SortDropdown({ options, value, onChange, className = '' }: SortDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentOption = options.find(opt => opt.value === value) || options[0];

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

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
                <span className="material-symbols-outlined text-[20px]">
                    {currentOption.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                </span>
                <span className="hidden sm:inline">{currentOption.label}</span>
                <span className="sm:hidden">Sort</span>
                <span className={`material-symbols-outlined text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''
                    }`}>
                    expand_more
                </span>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl shadow-black/50 z-50 overflow-hidden">
                    <div className="py-1">
                        {options.map((option) => (
                            <button
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`
                                    w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors
                                    ${value === option.value
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-700'
                                    }
                                `}
                            >
                                <span className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-[20px]">
                                        {option.direction === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                                    </span>
                                    <span>{option.label}</span>
                                </span>
                                {value === option.value && (
                                    <span className="material-symbols-outlined text-[18px] fill-1">check</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

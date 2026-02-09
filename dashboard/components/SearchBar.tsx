'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }: SearchBarProps) {
    const [localValue, setLocalValue] = useState(value);
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce the onChange callback
    useEffect(() => {
        const timer = setTimeout(() => {
            onChange(localValue);
        }, 300);

        return () => clearTimeout(timer);
    }, [localValue, onChange]);

    // Sync with external value changes
    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    // Keyboard shortcut: Cmd+K or Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, []);

    const handleClear = () => {
        setLocalValue('');
        onChange('');
        inputRef.current?.focus();
    };

    return (
        <div className={`relative ${className}`}>
            {/* Search Icon */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className={`material-symbols-outlined text-[20px] transition-colors ${isFocused ? 'text-blue-400' : 'text-slate-500'
                    }`}>
                    search
                </span>
            </div>

            {/* Input */}
            <input
                ref={inputRef}
                type="text"
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={placeholder}
                className={`
                    block w-full pl-10 pr-10 py-2.5
                    bg-slate-800 border border-slate-700
                    rounded-lg text-sm text-white placeholder-slate-500
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    transition-all duration-200
                    ${isFocused ? 'bg-slate-750' : ''}
                `}
            />

            {/* Clear Button or Keyboard Hint */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {localValue ? (
                    <button
                        onClick={handleClear}
                        className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-700"
                    >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                ) : (
                    <div className="hidden sm:flex items-center gap-1 text-xs text-slate-500 font-medium">
                        <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px]">
                            {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                        </kbd>
                        <kbd className="px-1.5 py-0.5 bg-slate-700 border border-slate-600 rounded text-[10px]">K</kbd>
                    </div>
                )}
            </div>
        </div>
    );
}

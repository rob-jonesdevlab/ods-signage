'use client';

import { useState, useRef, useEffect } from 'react';
import { useExport } from '@/hooks/useExport';
import { useToast } from '@/hooks/useToast';

interface ExportButtonProps {
    data: any[];
    filename: string;
    title: string;
    className?: string;
}

export default function ExportButton({ data, filename, title, className = '' }: ExportButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { exportToCSV, exportToPDF, exportToJSON } = useExport();
    const { showToast } = useToast();

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

    const handleExport = async (format: 'csv' | 'pdf' | 'json') => {
        if (data.length === 0) {
            showToast({
                type: 'warning',
                title: 'No Data',
                message: 'There is no data to export',
                duration: 3000
            });
            return;
        }

        setIsExporting(true);
        setIsOpen(false);

        try {
            switch (format) {
                case 'csv':
                    exportToCSV(data, filename);
                    break;
                case 'pdf':
                    exportToPDF(data, filename, title);
                    break;
                case 'json':
                    exportToJSON(data, filename);
                    break;
            }

            showToast({
                type: 'success',
                title: 'Export Complete',
                message: `Data exported as ${format.toUpperCase()}`,
                duration: 4000
            });
        } catch (error) {
            console.error('Export error:', error);
            showToast({
                type: 'error',
                title: 'Export Failed',
                message: 'An error occurred while exporting',
                duration: 5000
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                disabled={isExporting}
                className={`
                    flex items-center gap-2 px-4 py-2.5 
                    bg-slate-800 hover:bg-slate-700 
                    border border-slate-700 rounded-lg 
                    text-sm text-slate-300 transition-all 
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
            >
                <span className="material-symbols-outlined text-[20px]">
                    {isExporting ? 'progress_activity' : 'download'}
                </span>
                <span className="hidden sm:inline">
                    {isExporting ? 'Exporting...' : 'Export'}
                </span>
                {!isExporting && (
                    <span className={`material-symbols-outlined text-[18px] transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}>
                        expand_more
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl shadow-black/50 z-50 overflow-hidden">
                    <div className="py-1">
                        {/* CSV Option */}
                        <button
                            onClick={() => handleExport('csv')}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px] text-green-400">
                                description
                            </span>
                            <div className="flex flex-col items-start">
                                <span className="font-medium">Export as CSV</span>
                                <span className="text-xs text-slate-500">Spreadsheet format</span>
                            </div>
                        </button>

                        {/* PDF Option */}
                        <button
                            onClick={() => handleExport('pdf')}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px] text-red-400">
                                picture_as_pdf
                            </span>
                            <div className="flex flex-col items-start">
                                <span className="font-medium">Export as PDF</span>
                                <span className="text-xs text-slate-500">Document format</span>
                            </div>
                        </button>

                        {/* JSON Option */}
                        <button
                            onClick={() => handleExport('json')}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[20px] text-blue-400">
                                data_object
                            </span>
                            <div className="flex flex-col items-start">
                                <span className="font-medium">Export as JSON</span>
                                <span className="text-xs text-slate-500">Developer format</span>
                            </div>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState } from 'react';

// ── Types ───────────────────────────────────────────────────
export interface ScheduleBlock {
    days: number[];        // 1=Mon … 7=Sun
    start: string;         // "08:00"
    end: string;           // "17:00"
    priority: number;
}

export interface PlaylistSchedule {
    blocks: ScheduleBlock[];
}

const DAY_LABELS = [
    { key: 1, short: 'M', label: 'Mon' },
    { key: 2, short: 'T', label: 'Tue' },
    { key: 3, short: 'W', label: 'Wed' },
    { key: 4, short: 'T', label: 'Thu' },
    { key: 5, short: 'F', label: 'Fri' },
    { key: 6, short: 'S', label: 'Sat' },
    { key: 7, short: 'S', label: 'Sun' },
];

const BLOCK_COLORS = [
    { bg: 'bg-blue-50', border: 'border-blue-200', accent: 'bg-blue-500', text: 'text-blue-700', pill: 'bg-blue-100' },
    { bg: 'bg-purple-50', border: 'border-purple-200', accent: 'bg-purple-500', text: 'text-purple-700', pill: 'bg-purple-100' },
    { bg: 'bg-emerald-50', border: 'border-emerald-200', accent: 'bg-emerald-500', text: 'text-emerald-700', pill: 'bg-emerald-100' },
    { bg: 'bg-amber-50', border: 'border-amber-200', accent: 'bg-amber-500', text: 'text-amber-700', pill: 'bg-amber-100' },
    { bg: 'bg-rose-50', border: 'border-rose-200', accent: 'bg-rose-500', text: 'text-rose-700', pill: 'bg-rose-100' },
];

// ── Helpers ─────────────────────────────────────────────────
function timeToMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
}

function formatTimeLabel(t: string): string {
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}

// ── Schedule Block Editor ───────────────────────────────────
function ScheduleBlockEditor({
    block,
    index,
    color,
    onChange,
    onRemove,
}: {
    block: ScheduleBlock;
    index: number;
    color: typeof BLOCK_COLORS[0];
    onChange: (block: ScheduleBlock) => void;
    onRemove: () => void;
}) {
    const toggleDay = (day: number) => {
        const days = block.days.includes(day)
            ? block.days.filter(d => d !== day)
            : [...block.days, day].sort();
        onChange({ ...block, days });
    };

    const selectPreset = (preset: 'weekdays' | 'weekend' | 'everyday') => {
        const days = preset === 'weekdays' ? [1, 2, 3, 4, 5]
            : preset === 'weekend' ? [6, 7]
                : [1, 2, 3, 4, 5, 6, 7];
        onChange({ ...block, days });
    };

    return (
        <div className={`rounded-xl border ${color.border} ${color.bg} p-4`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${color.accent}`} />
                    <span className={`text-sm font-semibold ${color.text}`}>Block {index + 1}</span>
                </div>
                <button
                    onClick={onRemove}
                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove block"
                >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
            </div>

            {/* Day Selector */}
            <div className="mb-3">
                <div className="flex items-center gap-1 mb-2">
                    {DAY_LABELS.map(d => (
                        <button
                            key={d.key}
                            onClick={() => toggleDay(d.key)}
                            className={`w-9 h-9 rounded-lg text-xs font-semibold transition-all ${block.days.includes(d.key)
                                    ? `${color.accent} text-white shadow-sm`
                                    : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300'
                                }`}
                            title={d.label}
                        >
                            {d.short}
                        </button>
                    ))}
                </div>
                <div className="flex gap-2">
                    {(['weekdays', 'weekend', 'everyday'] as const).map(preset => (
                        <button
                            key={preset}
                            onClick={() => selectPreset(preset)}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium capitalize transition-colors ${color.pill} ${color.text} hover:opacity-80`}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            </div>

            {/* Time Range */}
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">Start</label>
                    <input
                        type="time"
                        value={block.start}
                        onChange={e => onChange({ ...block, start: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <span className="text-gray-400 mt-4">→</span>
                <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wide mb-1 block">End</label>
                    <input
                        type="time"
                        value={block.end}
                        onChange={e => onChange({ ...block, end: e.target.value })}
                        className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>
        </div>
    );
}

// ── Weekly Preview Strip ────────────────────────────────────
function WeeklyPreview({ blocks }: { blocks: ScheduleBlock[] }) {
    const TOTAL_MINUTES = 24 * 60;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Weekly Preview</h4>
            <div className="space-y-1.5">
                {DAY_LABELS.map(day => {
                    const dayBlocks = blocks
                        .map((b, i) => ({ ...b, colorIndex: i }))
                        .filter(b => b.days.includes(day.key));

                    return (
                        <div key={day.key} className="flex items-center gap-2">
                            <span className="text-[10px] font-medium text-gray-500 w-7 shrink-0">{day.label}</span>
                            <div className="flex-1 h-5 bg-gray-50 rounded-full relative overflow-hidden border border-gray-100">
                                {dayBlocks.map((block, i) => {
                                    const startMin = timeToMinutes(block.start);
                                    const endMin = timeToMinutes(block.end);
                                    const left = (startMin / TOTAL_MINUTES) * 100;
                                    const width = Math.max(((endMin - startMin) / TOTAL_MINUTES) * 100, 1);
                                    const color = BLOCK_COLORS[block.colorIndex % BLOCK_COLORS.length];

                                    return (
                                        <div
                                            key={i}
                                            className={`absolute top-0 h-full ${color.accent} rounded-full opacity-80`}
                                            style={{ left: `${left}%`, width: `${width}%` }}
                                            title={`${formatTimeLabel(block.start)} – ${formatTimeLabel(block.end)}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Time labels */}
            <div className="flex justify-between mt-1.5 px-9">
                {['12a', '6a', '12p', '6p', '12a'].map((t, i) => (
                    <span key={i} className="text-[9px] text-gray-400">{t}</span>
                ))}
            </div>
        </div>
    );
}

// ── Main Scheduler Component ────────────────────────────────
export default function PlaylistScheduler({
    schedule,
    onChange,
}: {
    schedule: PlaylistSchedule | null;
    onChange: (schedule: PlaylistSchedule) => void;
}) {
    const blocks = schedule?.blocks || [];

    const addBlock = () => {
        onChange({
            blocks: [
                ...blocks,
                { days: [1, 2, 3, 4, 5], start: '08:00', end: '17:00', priority: blocks.length + 1 },
            ],
        });
    };

    const updateBlock = (index: number, updated: ScheduleBlock) => {
        const newBlocks = [...blocks];
        newBlocks[index] = updated;
        onChange({ blocks: newBlocks });
    };

    const removeBlock = (index: number) => {
        onChange({ blocks: blocks.filter((_, i) => i !== index) });
    };

    const clearSchedule = () => {
        onChange({ blocks: [] });
    };

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-500 text-[18px]">calendar_month</span>
                    <h3 className="text-sm font-semibold text-gray-900">Schedule</h3>
                    {blocks.length > 0 && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                            {blocks.length} block{blocks.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
                {blocks.length > 0 && (
                    <button
                        onClick={clearSchedule}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                        Clear all
                    </button>
                )}
            </div>

            {/* No schedule */}
            {blocks.length === 0 && (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <span className="material-symbols-outlined text-3xl text-gray-300 mb-2">event_busy</span>
                    <p className="text-sm text-gray-400 mb-3">No schedule set — plays anytime</p>
                    <button
                        onClick={addBlock}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-1.5 mx-auto"
                    >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Schedule
                    </button>
                </div>
            )}

            {/* Block editors */}
            {blocks.length > 0 && (
                <>
                    <div className="space-y-3">
                        {blocks.map((block, index) => (
                            <ScheduleBlockEditor
                                key={index}
                                block={block}
                                index={index}
                                color={BLOCK_COLORS[index % BLOCK_COLORS.length]}
                                onChange={updated => updateBlock(index, updated)}
                                onRemove={() => removeBlock(index)}
                            />
                        ))}
                    </div>

                    {/* Add more */}
                    <button
                        onClick={addBlock}
                        className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-1.5"
                    >
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Add Time Block
                    </button>

                    {/* Weekly preview */}
                    <WeeklyPreview blocks={blocks} />
                </>
            )}
        </div>
    );
}

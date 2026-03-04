'use client';

import { useState } from 'react';

// ── Layout Zone Shape ───────────────────────────────────────
export interface LayoutZone {
    id: string;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    screen?: number;
}

export interface ScreenLayout {
    id: string;
    name: string;
    description: string;
    orientation: string;
    screen_count: number;
    zones: LayoutZone[];
    sort_order: number;
}

// ── SVG Layout Thumbnail ────────────────────────────────────
function LayoutThumbnail({
    layout,
    selected,
    onClick,
    size = 120,
}: {
    layout: ScreenLayout;
    selected: boolean;
    onClick: () => void;
    size?: number;
}) {
    const padding = 4;
    const innerW = size - padding * 2;
    const innerH = (size * 0.5625) - padding * 2; // 16:9 aspect
    const totalH = size * 0.5625;

    // For dual-screen layouts, show two monitor outlines side by side
    const isDual = layout.screen_count >= 2;
    const monitorGap = isDual ? 4 : 0;
    const monitorW = isDual ? (innerW - monitorGap) / 2 : innerW;

    return (
        <button
            onClick={onClick}
            className={`relative group rounded-xl border-2 p-2 transition-all duration-200 cursor-pointer
                ${selected
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
            title={layout.name}
        >
            <svg
                width={size}
                height={totalH}
                viewBox={`0 0 ${size} ${totalH}`}
                className="block mx-auto"
            >
                {/* Background */}
                <rect
                    x={0} y={0}
                    width={size} height={totalH}
                    rx={4}
                    fill={selected ? '#EFF6FF' : '#F9FAFB'}
                />

                {isDual && (
                    <>
                        {/* Monitor 1 outline */}
                        <rect
                            x={padding} y={padding}
                            width={monitorW} height={innerH}
                            rx={2}
                            fill="none"
                            stroke={selected ? '#93C5FD' : '#D1D5DB'}
                            strokeWidth={1}
                            strokeDasharray="2,2"
                        />
                        {/* Monitor 2 outline */}
                        <rect
                            x={padding + monitorW + monitorGap} y={padding}
                            width={monitorW} height={innerH}
                            rx={2}
                            fill="none"
                            stroke={selected ? '#93C5FD' : '#D1D5DB'}
                            strokeWidth={1}
                            strokeDasharray="2,2"
                        />
                    </>
                )}

                {/* Zones */}
                {layout.zones.map((zone, i) => {
                    const screenOffset = isDual && zone.screen === 1
                        ? monitorW + monitorGap
                        : 0;
                    const baseW = isDual ? monitorW : innerW;
                    const zx = padding + screenOffset + (zone.x / 100) * baseW;
                    const zy = padding + (zone.y / 100) * innerH;
                    const zw = (zone.w / 100) * baseW;
                    const zh = (zone.h / 100) * innerH;
                    const gap = 1.5;

                    return (
                        <g key={zone.id}>
                            <rect
                                x={zx + gap / 2}
                                y={zy + gap / 2}
                                width={Math.max(zw - gap, 2)}
                                height={Math.max(zh - gap, 2)}
                                rx={2}
                                fill={selected ? '#3B82F6' : '#6B7280'}
                                opacity={selected ? 0.85 : 0.6}
                                className="transition-all duration-200"
                            />
                            <text
                                x={zx + zw / 2}
                                y={zy + zh / 2}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fill="white"
                                fontSize={zw > 20 && zh > 14 ? 11 : 8}
                                fontWeight="bold"
                                fontFamily="Inter, system-ui, sans-serif"
                            >
                                {zone.label}
                            </text>
                        </g>
                    );
                })}
            </svg>

            {/* Layout name */}
            <p className={`text-[10px] mt-1.5 text-center font-medium leading-tight truncate
                ${selected ? 'text-blue-700' : 'text-gray-500 group-hover:text-gray-700'}`}
            >
                {layout.name}
            </p>

            {/* Selected checkmark */}
            {selected && (
                <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-sm">
                    <span className="material-symbols-outlined text-white text-[12px]">check</span>
                </div>
            )}
        </button>
    );
}

// ── Screen Layout Picker ────────────────────────────────────
export default function ScreenLayoutPicker({
    layouts,
    selectedId,
    onSelect,
    orientation = 'landscape',
    onOrientationChange,
    compact = false,
}: {
    layouts: ScreenLayout[];
    selectedId: string;
    onSelect: (layoutId: string) => void;
    orientation?: string;
    onOrientationChange?: (orientation: string) => void;
    compact?: boolean;
}) {
    const [showDual, setShowDual] = useState(false);

    // Separate single vs dual layouts
    const singleLayouts = layouts.filter(l => l.screen_count === 1);
    const dualLayouts = layouts.filter(l => l.screen_count >= 2);

    const thumbnailSize = compact ? 90 : 120;

    return (
        <div className="space-y-4">
            {/* Orientation toggle + Dual screen toggle */}
            {!compact && (
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700">Screen Layout</span>
                    </div>
                    <div className="flex items-center gap-3">
                        {onOrientationChange && (
                            <div className="flex bg-gray-100 p-0.5 rounded-lg">
                                <button
                                    onClick={() => onOrientationChange('landscape')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${orientation === 'landscape'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[14px]">crop_landscape</span>
                                    Landscape
                                </button>
                                <button
                                    onClick={() => onOrientationChange('portrait')}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${orientation === 'portrait'
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-[14px]">crop_portrait</span>
                                    Portrait
                                </button>
                            </div>
                        )}
                        {dualLayouts.length > 0 && (
                            <button
                                onClick={() => setShowDual(!showDual)}
                                className={`px-3 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1 ${showDual
                                        ? 'border-blue-300 bg-blue-50 text-blue-700'
                                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[14px]">desktop_windows</span>
                                Dual Screen
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Single-screen layouts */}
            <div>
                {!compact && <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Single Screen</p>}
                <div className={`grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-4 lg:grid-cols-5'}`}>
                    {singleLayouts.map(layout => (
                        <LayoutThumbnail
                            key={layout.id}
                            layout={layout}
                            selected={selectedId === layout.id}
                            onClick={() => onSelect(layout.id)}
                            size={thumbnailSize}
                        />
                    ))}
                </div>
            </div>

            {/* Dual-screen layouts */}
            {showDual && dualLayouts.length > 0 && (
                <div>
                    <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">desktop_windows</span>
                        Dual Screen
                    </p>
                    <div className={`grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-4 lg:grid-cols-5'}`}>
                        {dualLayouts.map(layout => (
                            <LayoutThumbnail
                                key={layout.id}
                                layout={layout}
                                selected={selectedId === layout.id}
                                onClick={() => onSelect(layout.id)}
                                size={thumbnailSize}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

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

// ── Build a dual layout from two single layouts ─────────────
export function buildDualLayout(screen0Layout: ScreenLayout, screen1Layout: ScreenLayout): ScreenLayout {
    const screen0Zones: LayoutZone[] = screen0Layout.zones.map((z, i) => ({
        ...z,
        id: `s0_${z.id}`,
        label: `${i + 1}`,
        screen: 0,
    }));

    const screen1Zones: LayoutZone[] = screen1Layout.zones.map((z, i) => ({
        ...z,
        id: `s1_${z.id}`,
        label: `${screen0Zones.length + i + 1}`,
        screen: 1,
    }));

    return {
        id: `dual:${screen0Layout.id}+${screen1Layout.id}`,
        name: `Dual: ${screen0Layout.name} + ${screen1Layout.name}`,
        description: `Screen 1: ${screen0Layout.name}, Screen 2: ${screen1Layout.name}`,
        orientation: 'landscape',
        screen_count: 2,
        zones: [...screen0Zones, ...screen1Zones],
        sort_order: 100,
    };
}

// ── Parse a dual layout ID ──────────────────────────────────
export function parseDualLayoutId(layoutId: string): { screen0Id: string; screen1Id: string } | null {
    if (!layoutId.startsWith('dual:')) return null;
    const parts = layoutId.slice(5).split('+');
    if (parts.length !== 2) return null;
    return { screen0Id: parts[0], screen1Id: parts[1] };
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

// ── Small selectable thumbnail for dual picker ──────────────
function SmallLayoutThumbnail({
    layout,
    selected,
    onClick,
}: {
    layout: ScreenLayout;
    selected: boolean;
    onClick: () => void;
}) {
    const size = 80;
    const padding = 3;
    const innerW = size - padding * 2;
    const innerH = (size * 0.5625) - padding * 2;
    const totalH = size * 0.5625;

    return (
        <button
            onClick={onClick}
            className={`relative group rounded-lg border-2 p-1.5 transition-all duration-200 cursor-pointer
                ${selected
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200'
                    : 'border-gray-200 bg-white hover:border-blue-300'
                }`}
            title={layout.name}
        >
            <svg width={size} height={totalH} viewBox={`0 0 ${size} ${totalH}`} className="block mx-auto">
                <rect x={0} y={0} width={size} height={totalH} rx={3} fill={selected ? '#EFF6FF' : '#F9FAFB'} />
                {layout.zones.map((zone) => {
                    const zx = padding + (zone.x / 100) * innerW;
                    const zy = padding + (zone.y / 100) * innerH;
                    const zw = (zone.w / 100) * innerW;
                    const zh = (zone.h / 100) * innerH;
                    const gap = 1.5;
                    return (
                        <rect
                            key={zone.id}
                            x={zx + gap / 2} y={zy + gap / 2}
                            width={Math.max(zw - gap, 2)} height={Math.max(zh - gap, 2)}
                            rx={1.5}
                            fill={selected ? '#3B82F6' : '#6B7280'}
                            opacity={selected ? 0.85 : 0.5}
                        />
                    );
                })}
            </svg>
            <p className={`text-[9px] mt-1 text-center font-medium truncate ${selected ? 'text-blue-700' : 'text-gray-400'}`}>
                {layout.name.replace(' (Fullscreen)', '').replace('Triple ', '').replace('Double ', '')}
            </p>
        </button>
    );
}


// ── Screen Layout Picker ────────────────────────────────────
export default function ScreenLayoutPicker({
    layouts,
    selectedId,
    onSelect,
    onSelectDual,
    orientation = 'landscape',
    onOrientationChange,
    compact = false,
}: {
    layouts: ScreenLayout[];
    selectedId: string;
    onSelect: (layoutId: string) => void;
    onSelectDual?: (layout: ScreenLayout) => void;
    orientation?: string;
    onOrientationChange?: (orientation: string) => void;
    compact?: boolean;
}) {
    const [showDual, setShowDual] = useState(() => selectedId.startsWith('dual:'));
    const [screen0Id, setScreen0Id] = useState<string>(() => {
        const parsed = parseDualLayoutId(selectedId);
        return parsed?.screen0Id || 'single';
    });
    const [screen1Id, setScreen1Id] = useState<string>(() => {
        const parsed = parseDualLayoutId(selectedId);
        return parsed?.screen1Id || 'single';
    });

    // Only single-screen layouts for building combos
    const singleLayouts = layouts.filter(l => l.screen_count === 1);

    const thumbnailSize = compact ? 90 : 120;

    // Handle dual screen selection
    const handleDualSelect = (screen: 0 | 1, layoutId: string) => {
        const newScreen0 = screen === 0 ? layoutId : screen0Id;
        const newScreen1 = screen === 1 ? layoutId : screen1Id;

        if (screen === 0) setScreen0Id(layoutId);
        else setScreen1Id(layoutId);

        const s0Layout = singleLayouts.find(l => l.id === newScreen0);
        const s1Layout = singleLayouts.find(l => l.id === newScreen1);

        if (s0Layout && s1Layout && onSelectDual) {
            const dual = buildDualLayout(s0Layout, s1Layout);
            onSelectDual(dual);
        }
    };

    // Build preview of current dual selection
    const screen0Layout = singleLayouts.find(l => l.id === screen0Id);
    const screen1Layout = singleLayouts.find(l => l.id === screen1Id);
    const dualPreview = screen0Layout && screen1Layout ? buildDualLayout(screen0Layout, screen1Layout) : null;

    return (
        <div className="space-y-4">
            {/* Mode toggle: Single vs Dual */}
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
                        <div className="flex bg-gray-100 p-0.5 rounded-lg">
                            <button
                                onClick={() => setShowDual(false)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${!showDual
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[14px]">monitor</span>
                                Single Screen
                            </button>
                            <button
                                onClick={() => setShowDual(true)}
                                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${showDual
                                    ? 'bg-white text-gray-900 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <span className="material-symbols-outlined text-[14px]">desktop_windows</span>
                                Dual Screen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Single-screen mode */}
            {!showDual && (
                <div>
                    {!compact && <p className="text-xs text-gray-400 mb-2 uppercase tracking-wide font-medium">Choose Layout</p>}
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
            )}

            {/* Dual-screen mode: two per-screen pickers */}
            {showDual && (
                <div className="space-y-5">
                    {/* Preview of combined layout */}
                    {dualPreview && (
                        <div className="flex items-center justify-center py-2">
                            <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
                                <LayoutThumbnail
                                    layout={dualPreview}
                                    selected={true}
                                    onClick={() => { }}
                                    size={200}
                                />
                            </div>
                        </div>
                    )}

                    {/* Screen 1 picker */}
                    <div>
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium flex items-center gap-1.5">
                            <span className="w-5 h-5 bg-blue-500 text-white rounded flex items-center justify-center text-[10px] font-bold">1</span>
                            Screen 1 Layout
                        </p>
                        <div className="grid grid-cols-5 lg:grid-cols-7 gap-1.5">
                            {singleLayouts.map(layout => (
                                <SmallLayoutThumbnail
                                    key={layout.id}
                                    layout={layout}
                                    selected={screen0Id === layout.id}
                                    onClick={() => handleDualSelect(0, layout.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Screen 2 picker */}
                    <div>
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-medium flex items-center gap-1.5">
                            <span className="w-5 h-5 bg-indigo-500 text-white rounded flex items-center justify-center text-[10px] font-bold">2</span>
                            Screen 2 Layout
                        </p>
                        <div className="grid grid-cols-5 lg:grid-cols-7 gap-1.5">
                            {singleLayouts.map(layout => (
                                <SmallLayoutThumbnail
                                    key={layout.id}
                                    layout={layout}
                                    selected={screen1Id === layout.id}
                                    onClick={() => handleDualSelect(1, layout.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

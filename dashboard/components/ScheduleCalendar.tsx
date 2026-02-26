'use client';

import { useState, useMemo } from 'react';

interface ScheduleCalendarProps {
    updates: any[];
    onClose: () => void;
    onEdit: (update: any) => void;
    onDelete: (id: string) => void;
}

const TYPE_STYLES: Record<string, { bg: string; dot: string; label: string }> = {
    playlist: { bg: 'bg-purple-50 border-purple-200', dot: 'bg-purple-500', label: 'Playlist' },
    firmware: { bg: 'bg-blue-50 border-blue-200', dot: 'bg-blue-500', label: 'Firmware' },
    maintenance: { bg: 'bg-amber-50 border-amber-200', dot: 'bg-amber-500', label: 'Maintenance' },
    content: { bg: 'bg-green-50 border-green-200', dot: 'bg-green-500', label: 'Content' },
};

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
    pending: { bg: 'bg-yellow-100 text-yellow-700', text: 'Pending' },
    executing: { bg: 'bg-blue-100 text-blue-700', text: 'Running' },
    completed: { bg: 'bg-green-100 text-green-700', text: 'Done' },
    failed: { bg: 'bg-red-100 text-red-700', text: 'Failed' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function ScheduleCalendar({ updates, onClose, onEdit, onDelete }: ScheduleCalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDay, setSelectedDay] = useState<string | null>(null);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Build calendar grid
    const calendarDays = useMemo(() => {
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();

        const days: { date: string; day: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

        // Previous month padding
        for (let i = firstDay - 1; i >= 0; i--) {
            const d = prevMonthDays - i;
            const prevMonth = month === 0 ? 11 : month - 1;
            const prevYear = month === 0 ? year - 1 : year;
            days.push({
                date: `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                day: d,
                isCurrentMonth: false,
                isToday: false
            });
        }

        // Current month
        const today = new Date();
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            days.push({
                date: dateStr,
                day: d,
                isCurrentMonth: true,
                isToday: today.getFullYear() === year && today.getMonth() === month && today.getDate() === d
            });
        }

        // Next month padding (fill to 42 cells = 6 weeks)
        const remaining = 42 - days.length;
        for (let d = 1; d <= remaining; d++) {
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;
            days.push({
                date: `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                day: d,
                isCurrentMonth: false,
                isToday: false
            });
        }

        return days;
    }, [year, month]);

    // Map updates to dates
    const updatesByDate = useMemo(() => {
        const map: Record<string, any[]> = {};
        updates.forEach(u => {
            const date = u.schedule_date;
            if (!map[date]) map[date] = [];
            map[date].push(u);
        });
        return map;
    }, [updates]);

    // Updates for selected day
    const selectedDayUpdates = selectedDay ? (updatesByDate[selectedDay] || []) : [];

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    const goToToday = () => {
        const today = new Date();
        setCurrentDate(today);
        setSelectedDay(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
    };

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-white">
                        {MONTHS[month]} {year}
                    </h2>
                    <span className="text-xs text-blue-200 bg-blue-500/30 px-2 py-0.5 rounded-full">
                        {updates.filter(u => u.status === 'pending').length} pending
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-xs font-medium text-blue-100 bg-blue-500/30 hover:bg-blue-500/50 rounded-md transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={prevMonth}
                        className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                    <button
                        onClick={onClose}
                        className="ml-2 p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-gray-200">
                {DAYS.map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
                {calendarDays.map((day, i) => {
                    const dayUpdates = updatesByDate[day.date] || [];
                    const isSelected = selectedDay === day.date;

                    return (
                        <button
                            key={i}
                            onClick={() => setSelectedDay(day.date)}
                            className={`
                                relative min-h-[80px] p-1.5 border-b border-r border-gray-100 text-left
                                transition-colors cursor-pointer
                                ${day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-50/50 hover:bg-gray-100/50'}
                                ${isSelected ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/50' : ''}
                            `}
                        >
                            <span className={`
                                inline-flex items-center justify-center w-6 h-6 text-xs font-medium rounded-full
                                ${day.isToday ? 'bg-blue-600 text-white' : ''}
                                ${!day.isToday && day.isCurrentMonth ? 'text-gray-900' : ''}
                                ${!day.isToday && !day.isCurrentMonth ? 'text-gray-400' : ''}
                            `}>
                                {day.day}
                            </span>

                            {/* Update dots */}
                            <div className="mt-0.5 space-y-0.5">
                                {dayUpdates.slice(0, 3).map((u: any, j: number) => {
                                    const style = TYPE_STYLES[u.type] || TYPE_STYLES.content;
                                    return (
                                        <div key={j} className={`flex items-center gap-1 px-1 py-0.5 rounded text-[10px] ${style.bg} border truncate`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot} flex-shrink-0`} />
                                            <span className="truncate font-medium">{u.title}</span>
                                        </div>
                                    );
                                })}
                                {dayUpdates.length > 3 && (
                                    <div className="text-[10px] text-gray-400 px-1">
                                        +{dayUpdates.length - 3} more
                                    </div>
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Selected day detail panel */}
            {selectedDay && (
                <div className="border-t border-gray-200 bg-gray-50 p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', {
                            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                        })}
                        <span className="ml-2 text-gray-400 font-normal">
                            {selectedDayUpdates.length} update{selectedDayUpdates.length !== 1 ? 's' : ''}
                        </span>
                    </h3>

                    {selectedDayUpdates.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">
                            No updates scheduled for this day.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {selectedDayUpdates.map((u: any) => {
                                const style = TYPE_STYLES[u.type] || TYPE_STYLES.content;
                                const status = STATUS_BADGE[u.status] || STATUS_BADGE.pending;

                                return (
                                    <div key={u.id} className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-2.5 h-2.5 rounded-full ${style.dot}`} />
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900">{u.title}</span>
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${status.bg}`}>
                                                        {status.text}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {u.schedule_time && `${u.schedule_time} · `}{style.label} · {Array.isArray(u.targets) ? u.targets.length : 0} target{(u.targets?.length || 0) !== 1 ? 's' : ''}
                                                    {u.recurrence && u.recurrence !== 'once' && (
                                                        <span className="ml-1 text-blue-500">↻ {u.recurrence}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={() => onEdit(u)}
                                                className="px-2.5 py-1 text-xs text-gray-600 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded border border-gray-200 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => onDelete(u.id)}
                                                className="px-2.5 py-1 text-xs text-gray-600 hover:text-red-600 bg-gray-50 hover:bg-red-50 rounded border border-gray-200 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Footer legend */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-white text-[11px] text-gray-400">
                <div className="flex items-center gap-4">
                    {Object.entries(TYPE_STYLES).map(([key, style]) => (
                        <div key={key} className="flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                            {style.label}
                        </div>
                    ))}
                </div>
                <span>{updates.length} total updates</span>
            </div>
        </div>
    );
}

'use client';

import { useState, useCallback } from 'react';

export function useBulkSelection<T extends { id: string }>(items: T[]) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

    const toggleSelection = useCallback((id: string, shiftKey: boolean = false) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);

            // Shift+Click range selection
            if (shiftKey && lastSelectedId && lastSelectedId !== id) {
                const lastIndex = items.findIndex(item => item.id === lastSelectedId);
                const currentIndex = items.findIndex(item => item.id === id);

                if (lastIndex !== -1 && currentIndex !== -1) {
                    const start = Math.min(lastIndex, currentIndex);
                    const end = Math.max(lastIndex, currentIndex);

                    // Select all items in range
                    for (let i = start; i <= end; i++) {
                        newSet.add(items[i].id);
                    }
                }
            } else {
                // Normal toggle
                if (newSet.has(id)) {
                    newSet.delete(id);
                } else {
                    newSet.add(id);
                }
            }

            return newSet;
        });

        setLastSelectedId(id);
    }, [items, lastSelectedId]);

    const selectAll = useCallback(() => {
        setSelectedIds(new Set(items.map(item => item.id)));
    }, [items]);

    const deselectAll = useCallback(() => {
        setSelectedIds(new Set());
        setLastSelectedId(null);
    }, []);

    const isSelected = useCallback((id: string) => {
        return selectedIds.has(id);
    }, [selectedIds]);

    const getSelectedItems = useCallback(() => {
        return items.filter(item => selectedIds.has(item.id));
    }, [items, selectedIds]);

    return {
        selectedIds,
        selectedCount: selectedIds.size,
        toggleSelection,
        selectAll,
        deselectAll,
        isSelected,
        getSelectedItems,
    };
}

/**
 * @file: SelectionManagerContext.tsx
 * @description: Контекст для управления множественным выбором сущностей в админ-панели
 * @dependencies: React
 * @created: 2025-11-10
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface SelectionManagerContextValue {
    selectedIds: Set<string>;
    selectionCount: number;
    isSelected: (id: string) => boolean;
    toggleSelection: (id: string) => void;
    setSelection: (id: string, value: boolean) => void;
    selectAll: (ids: string[]) => void;
    clearSelection: () => void;
}

const SelectionManagerContext = createContext<SelectionManagerContextValue | null>(null);

export const SelectionManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

    const setSelection = useCallback((id: string, value: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (value) {
                next.add(id);
            } else {
                next.delete(id);
            }
            return next;
        });
    }, []);

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const selectAll = useCallback((ids: string[]) => {
        setSelectedIds(new Set(ids));
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const value = useMemo<SelectionManagerContextValue>(() => ({
        selectedIds,
        selectionCount: selectedIds.size,
        isSelected,
        toggleSelection,
        setSelection,
        selectAll,
        clearSelection,
    }), [selectedIds, isSelected, toggleSelection, setSelection, selectAll, clearSelection]);

    return (
        <SelectionManagerContext.Provider value={value}>
            {children}
        </SelectionManagerContext.Provider>
    );
};

export const useSelectionManager = (): SelectionManagerContextValue => {
    const context = useContext(SelectionManagerContext);
    if (!context) {
        throw new Error('useSelectionManager должен использоваться внутри SelectionManagerProvider');
    }
    return context;
};









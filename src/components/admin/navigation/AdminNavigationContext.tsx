/**
 * @file: AdminNavigationContext.tsx
 * @description: Контекст для управления состоянием мобильного drawer'а админ-панели
 * @dependencies: React
 * @created: 2025-11-10
 */

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

interface AdminNavigationContextValue {
    isDrawerOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
    toggleDrawer: () => void;
}

const AdminNavigationContext = createContext<AdminNavigationContextValue | undefined>(undefined);

interface AdminNavigationProviderProps {
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export const AdminNavigationProvider: React.FC<AdminNavigationProviderProps> = ({ children, defaultOpen = false }) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(defaultOpen);

    const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
    const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
    const toggleDrawer = useCallback(() => setIsDrawerOpen(prev => !prev), []);

    const value = useMemo<AdminNavigationContextValue>(() => ({
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer
    }), [isDrawerOpen, openDrawer, closeDrawer, toggleDrawer]);

    return (
        <AdminNavigationContext.Provider value={value}>
            {children}
        </AdminNavigationContext.Provider>
    );
};

export const useAdminNavigation = (): AdminNavigationContextValue => {
    const ctx = useContext(AdminNavigationContext);
    if (!ctx) {
        throw new Error('useAdminNavigation должен использоваться внутри AdminNavigationProvider');
    }
    return ctx;
};









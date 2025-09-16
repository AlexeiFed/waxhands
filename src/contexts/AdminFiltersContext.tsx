/**
 * @file: AdminFiltersContext.tsx
 * @description: Контекст для управления состоянием фильтров всех вкладок администратора
 * @dependencies: React, localStorage
 * @created: 2025-01-09
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Типы для фильтров каждой вкладки
export interface MasterClassesFilters {
    city: string;
    school: string;
    class: string;
    dateFrom: string;
    dateTo: string;
}

export interface InvoicesFilters {
    city: string;
    school_name: string;
    class_group: string;
    status: 'all' | 'pending' | 'paid' | 'cancelled';
    workshop_date: string;
}

export interface WorkshopRequestsFilters {
    city: string;
    school: string;
    classGroup: string;
    status: string;
}

export interface UsersFilters {
    role: string;
    school: string;
}

export interface SchoolsFilters {
    city: string;
    school: string;
    class: string;
}

export interface ServicesFilters {
    search: string;
}

export interface ChatFilters {
    status: string;
}

// Общий интерфейс для всех фильтров
export interface AdminFiltersState {
    masterClasses: MasterClassesFilters;
    invoices: InvoicesFilters;
    workshopRequests: WorkshopRequestsFilters;
    users: UsersFilters;
    schools: SchoolsFilters;
    services: ServicesFilters;
    chat: ChatFilters;
}

// Начальные значения фильтров
const initialFilters: AdminFiltersState = {
    masterClasses: {
        city: 'all',
        school: 'all',
        class: 'all',
        dateFrom: '',
        dateTo: ''
    },
    invoices: {
        city: '',
        school_name: '',
        class_group: '',
        status: 'all',
        workshop_date: ''
    },
    workshopRequests: {
        city: '',
        school: '',
        classGroup: '',
        status: ''
    },
    users: {
        role: 'all',
        school: 'all'
    },
    schools: {
        city: '',
        school: '',
        class: ''
    },
    services: {
        search: ''
    },
    chat: {
        status: 'all'
    }
};

// Контекст
interface AdminFiltersContextType {
    filters: AdminFiltersState;
    updateFilters: <T extends keyof AdminFiltersState>(
        tab: T,
        newFilters: Partial<AdminFiltersState[T]>
    ) => void;
    resetFilters: (tab?: keyof AdminFiltersState) => void;
    resetAllFilters: () => void;
}

const AdminFiltersContext = createContext<AdminFiltersContextType | undefined>(undefined);

// Провайдер
interface AdminFiltersProviderProps {
    children: ReactNode;
}

export const AdminFiltersProvider: React.FC<AdminFiltersProviderProps> = ({ children }) => {
    const [filters, setFilters] = useState<AdminFiltersState>(initialFilters);

    // Загрузка фильтров из localStorage при инициализации
    useEffect(() => {
        try {
            const savedFilters = localStorage.getItem('adminFilters');
            if (savedFilters) {
                const parsedFilters = JSON.parse(savedFilters);
                setFilters(prev => ({
                    ...prev,
                    ...parsedFilters
                }));
            }
        } catch (error) {
            console.error('Ошибка при загрузке фильтров из localStorage:', error);
        }
    }, []);

    // Сохранение фильтров в localStorage при изменении
    useEffect(() => {
        try {
            localStorage.setItem('adminFilters', JSON.stringify(filters));
        } catch (error) {
            console.error('Ошибка при сохранении фильтров в localStorage:', error);
        }
    }, [filters]);

    // Обновление фильтров для конкретной вкладки
    const updateFilters = <T extends keyof AdminFiltersState>(
        tab: T,
        newFilters: Partial<AdminFiltersState[T]>
    ) => {
        setFilters(prev => ({
            ...prev,
            [tab]: {
                ...prev[tab],
                ...newFilters
            }
        }));
    };

    // Сброс фильтров для конкретной вкладки или всех
    const resetFilters = (tab?: keyof AdminFiltersState) => {
        if (tab) {
            setFilters(prev => ({
                ...prev,
                [tab]: initialFilters[tab]
            }));
        } else {
            setFilters(initialFilters);
        }
    };

    // Сброс всех фильтров
    const resetAllFilters = () => {
        setFilters(initialFilters);
        localStorage.removeItem('adminFilters');
    };

    const value: AdminFiltersContextType = {
        filters,
        updateFilters,
        resetFilters,
        resetAllFilters
    };

    return (
        <AdminFiltersContext.Provider value={value}>
            {children}
        </AdminFiltersContext.Provider>
    );
};

// Хук для использования контекста
export const useAdminFilters = (): AdminFiltersContextType => {
    const context = useContext(AdminFiltersContext);
    if (context === undefined) {
        throw new Error('useAdminFilters должен использоваться внутри AdminFiltersProvider');
    }
    return context;
};

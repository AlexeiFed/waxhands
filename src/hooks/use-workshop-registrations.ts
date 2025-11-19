/**
 * @file: use-workshop-registrations.ts
 * @description: Хук для работы с записями на мастер-классы
 * @dependencies: api, types
 * @created: 2024-12-19
 */

import { useState, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { toast } from '../components/ui/use-toast';
import { WorkshopRegistration, CreateRegistrationData, WorkshopStats } from '../types';

interface UseWorkshopRegistrationsReturn {
    getUserRegistrations: (userId: string) => Promise<WorkshopRegistration[]>;
    createRegistration: (registrationData: Omit<WorkshopRegistration, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    deleteRegistration: (id: string) => Promise<void>;
    getRegistrations: (workshopId: string) => Promise<WorkshopRegistration[]>;
    getWorkshopStats: (workshopId: string) => Promise<WorkshopStats>;
    updateRegistrationStatus: (id: string, status: string) => Promise<boolean>;
    clearError: () => void;
}

export const useWorkshopRegistrations = (): UseWorkshopRegistrationsReturn => {
    // Добавляем ref для отслеживания последнего запроса
    const lastRequestRef = useRef<string>('');
    const isFetchingRef = useRef(false);
    const debounceTimeoutRef = useRef<NodeJS.Timeout>();

    const getUserRegistrations = useCallback(async (userId: string): Promise<WorkshopRegistration[]> => {
        // Проверяем, не выполняется ли уже запрос для этого пользователя
        if (isFetchingRef.current && lastRequestRef.current === userId) {

            return [];
        }

        // Очищаем предыдущий таймаут
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        return new Promise((resolve) => {
            debounceTimeoutRef.current = setTimeout(async () => {
                try {
                    isFetchingRef.current = true;
                    lastRequestRef.current = userId;

                    const response = await api.workshopRegistrations.getUserRegistrations(userId);

                    resolve(response || []);
                } catch (error) {
                    console.error('getUserRegistrations: Error:', error);
                    resolve([]);
                } finally {
                    isFetchingRef.current = false;
                }
            }, 300); // 300ms дебаунс
        });
    }, []);

    const [registrations, setRegistrations] = useState<WorkshopRegistration[]>([]);
    const [userRegistrations, setUserRegistrations] = useState<WorkshopRegistration[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const lastCallRef = useRef<number>(0);

    // Создать регистрацию на мастер-класс
    const createRegistration = async (registrationData: Omit<WorkshopRegistration, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const newRegistration = await api.workshopRegistrations.createRegistration(registrationData as CreateRegistrationData);

            // Добавляем новую регистрацию в список
            setRegistrations(prev => [...prev, newRegistration]);

            toast({
                title: "Успешно!",
                description: "Вы успешно записались на мастер-класс!",
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка при создании регистрации';
            setError(errorMessage);

            toast({
                title: "Ошибка",
                description: errorMessage,
                variant: "destructive",
            });

            throw err;
        } finally {
            setLoading(false);
        }
    };

    // Получить регистрации на мастер-класс
    const getRegistrations = async (workshopId: string): Promise<WorkshopRegistration[]> => {
        setLoading(true);
        setError(null);

        try {
            const data = await api.workshopRegistrations.getRegistrations(workshopId);
            setRegistrations(data);
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка при получении регистраций';
            setError(errorMessage);
            return [];
        } finally {
            setLoading(false);
        }
    };

    // Получить статистику по мастер-классу
    const getWorkshopStats = async (workshopId: string) => {
        try {
            return await api.workshopRegistrations.getWorkshopStats(workshopId);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка при получении статистики';
            setError(errorMessage);
            return null;
        }
    };

    // Обновить статус регистрации
    const updateRegistrationStatus = async (id: string, status: string): Promise<boolean> => {
        try {
            await api.workshopRegistrations.updateRegistrationStatus(id, status);

            // Обновляем статус в локальном состоянии
            setRegistrations(prev =>
                prev.map(reg =>
                    reg.id === id ? { ...reg, status: status as WorkshopRegistration['status'], updatedAt: new Date().toISOString() } : reg
                )
            );

            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка при обновлении статуса';
            setError(errorMessage);
            return false;
        }
    };

    // Удалить регистрацию
    const deleteRegistration = async (id: string): Promise<void> => {
        try {
            await api.workshopRegistrations.deleteRegistration(id);

            // Удаляем из локального состояния
            setRegistrations(prev => prev.filter(reg => reg.id !== id));
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Ошибка при удалении регистрации';
            setError(errorMessage);
            throw err;
        }
    };

    // Очистить ошибки
    const clearError = () => setError(null);

    return {
        createRegistration,
        getRegistrations,
        getUserRegistrations,
        getWorkshopStats,
        updateRegistrationStatus,
        deleteRegistration,
        clearError,
    };
};

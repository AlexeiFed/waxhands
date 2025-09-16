import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, masterClassesAPI } from '../lib/api';
import { MasterClassEvent } from '@/types/services';

interface UseMasterClassesReturn {
    masterClasses: MasterClassEvent[];
    loading: boolean;
    error: string | null;
    total: number;
    fetchMasterClasses: (params?: {
        isActive?: boolean;
        schoolId?: string;
        classGroup?: string;
        userId?: string;
        forceRefresh?: boolean;
    }) => Promise<void>;
    createMasterClass: (masterClassData: Omit<MasterClassEvent, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'statistics'>) => Promise<void>;
    createMultipleMasterClasses: (data: {
        date: string;
        time: string;
        schoolId: string;
        classGroups: string[];
        serviceId: string;
        executors: string[];
        notes?: string;
    }) => Promise<void>;
    updateMasterClass: (id: string, masterClassData: Partial<MasterClassEvent>) => Promise<void>;
    deleteMasterClass: (id: string) => Promise<void>;
    getMasterClassById: (id: string) => Promise<MasterClassEvent>;
}

export const useMasterClasses = (): UseMasterClassesReturn => {
    const [masterClasses, setMasterClasses] = useState<MasterClassEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    // Добавляем ref для отслеживания последнего запроса и глобальный флаг загрузки
    const lastRequestRef = useRef<string>('');
    const isFetchingRef = useRef(false);
    const globalFetchingRef = useRef<Set<string>>(new Set()); // Глобальный реестр активных запросов

    const fetchMasterClasses = useCallback(async (params?: {
        isActive?: boolean;
        schoolId?: string;
        classGroup?: string;
        userId?: string;
        forceRefresh?: boolean; // Добавляем флаг принудительного обновления
    }) => {
        // Создаем уникальный ключ для запроса
        const requestKey = JSON.stringify(params || {});

        // Проверяем глобальный реестр активных запросов
        if (globalFetchingRef.current.has(requestKey) && !params?.forceRefresh) {
            console.log('fetchMasterClasses: Аналогичный запрос уже выполняется, пропускаем');
            return;
        }

        // Проверяем, не выполняется ли уже такой же запрос локально
        if (isFetchingRef.current && !params?.forceRefresh) {
            console.log('fetchMasterClasses: Локальный запрос уже выполняется, пропускаем');
            return;
        }

        // Проверяем, не повторяем ли мы последний запрос (только если не принудительное обновление)
        if (lastRequestRef.current === requestKey && !params?.forceRefresh) {
            console.log('fetchMasterClasses: Запрос идентичен последнему, пропускаем');
            return;
        }

        try {
            // Добавляем запрос в глобальный реестр
            globalFetchingRef.current.add(requestKey);
            isFetchingRef.current = true;
            lastRequestRef.current = requestKey;

            setLoading(true);
            setError(null);
            console.log('fetchMasterClasses вызван с параметрами:', params);

            // Загрузка Событий мастер-классов вместо шаблонов
            const response = await api.masterClassEvents.getEvents({
                schoolId: params?.schoolId,
                classGroup: params?.classGroup,
                userId: params?.userId
            });
            console.log('Получены мастер-классы:', response);

            setMasterClasses(response.masterClasses as MasterClassEvent[]);
            setTotal(response.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch master classes');
            console.error('Error fetching master classes:', err);
        } finally {
            // Удаляем запрос из глобального реестра
            globalFetchingRef.current.delete(requestKey);
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, []);

    const createMasterClass = async (masterClassData: Omit<MasterClassEvent, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'statistics'>) => {
        try {
            setLoading(true);
            setError(null);
            await api.masterClassEvents.createEvent(masterClassData as Record<string, unknown>);
            await fetchMasterClasses({ forceRefresh: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create master class');
            console.error('Error creating master class:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const createMultipleMasterClasses = async (data: {
        date: string;
        time: string;
        schoolId: string;
        classGroups: string[];
        serviceId: string;
        executors: string[];
        notes?: string;
    }) => {
        try {
            setLoading(true);
            setError(null);

            // Используем правильный API для массового создания
            const response = await api.masterClasses.createMultiple(data);

            if (response.success && response.data) {
                console.log(`Успешно создано ${response.data.length} мастер-классов`);
                // Обновляем список мастер-классов
                await fetchMasterClasses({ forceRefresh: true });
            } else {
                throw new Error(response.error || 'Failed to create multiple master classes');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create multiple master classes');
            console.error('Error creating multiple master classes:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateMasterClass = async (id: string, masterClassData: Partial<MasterClassEvent>) => {
        try {
            setLoading(true);
            setError(null);
            await api.masterClassEvents.updateEvent(id, masterClassData as Record<string, unknown>);
            await fetchMasterClasses({ forceRefresh: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update master class');
            console.error('Error updating master class:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteMasterClass = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await api.masterClassEvents.deleteEvent(id);
            await fetchMasterClasses({ forceRefresh: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete master class');
            console.error('Error deleting master class:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getMasterClassById = async (id: string): Promise<MasterClassEvent> => {
        try {
            setError(null);
            return await api.masterClassEvents.getEventById(id) as unknown as MasterClassEvent;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get master class';
            setError(errorMessage);
            console.error('Error getting master class:', err);
            throw err;
        }
    };

    // Загружаем мастер-классы при инициализации хука
    useEffect(() => {
        fetchMasterClasses();
    }, [fetchMasterClasses]);

    return {
        masterClasses,
        loading,
        error,
        total,
        fetchMasterClasses,
        createMasterClass,
        createMultipleMasterClasses,
        updateMasterClass,
        deleteMasterClass,
        getMasterClassById,
    };
};

export const useUpdateParticipantPaymentStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ masterClassId, participantId, isPaid }: {
            masterClassId: string;
            participantId: string;
            isPaid: boolean
        }) => api.masterClassEvents.updateParticipantPaymentStatus(masterClassId, participantId, isPaid),
        onSuccess: (_, { masterClassId }) => {
            // Инвалидируем кэш мастер-класса и статистики
            queryClient.invalidateQueries({ queryKey: ['master-classes'] });
            queryClient.invalidateQueries({ queryKey: ['workshop-stats', masterClassId] });
            queryClient.invalidateQueries({ queryKey: ['workshop-registrations'] });
        },
    });
}; 
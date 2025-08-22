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
    }) => Promise<void>;
    createMasterClass: (masterClassData: Omit<MasterClassEvent, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'statistics'>) => Promise<void>;
    updateMasterClass: (id: string, masterClassData: Partial<MasterClassEvent>) => Promise<void>;
    deleteMasterClass: (id: string) => Promise<void>;
    getMasterClassById: (id: string) => Promise<MasterClassEvent>;
}

export const useMasterClasses = (): UseMasterClassesReturn => {
    const [masterClasses, setMasterClasses] = useState<MasterClassEvent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    // Добавляем ref для отслеживания последнего запроса
    const lastRequestRef = useRef<string>('');
    const isFetchingRef = useRef(false);

    const fetchMasterClasses = useCallback(async (params?: {
        isActive?: boolean;
        schoolId?: string;
        classGroup?: string;
        userId?: string;
    }) => {
        // Создаем уникальный ключ для запроса
        const requestKey = JSON.stringify(params || {});

        // Проверяем, не выполняется ли уже такой же запрос
        if (isFetchingRef.current && lastRequestRef.current === requestKey) {
            console.log('fetchMasterClasses: Запрос уже выполняется, пропускаем');
            return;
        }

        // Проверяем, не повторяем ли мы последний запрос
        if (lastRequestRef.current === requestKey) {
            console.log('fetchMasterClasses: Запрос идентичен последнему, пропускаем');
            return;
        }

        try {
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

            setMasterClasses(response.masterClasses as unknown as MasterClassEvent[]);
            setTotal(response.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch master classes');
            console.error('Error fetching master classes:', err);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, []);

    const createMasterClass = async (masterClassData: Omit<MasterClassEvent, 'id' | 'createdAt' | 'updatedAt' | 'participants' | 'statistics'>) => {
        try {
            setLoading(true);
            setError(null);
            await api.masterClassEvents.createEvent(masterClassData as Record<string, unknown>);
            await fetchMasterClasses();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create master class');
            console.error('Error creating master class:', err);
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
            await fetchMasterClasses();
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
            await fetchMasterClasses();
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
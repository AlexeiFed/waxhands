/**
 * @file: src/hooks/use-workshop-requests.ts
 * @description: Хук для работы с заявками на проведение мастер-классов
 * @dependencies: api.ts, types/index.ts
 * @created: 2024-12-19
 */

import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import {
    WorkshopRequest,
    CreateWorkshopRequestData,
    UpdateWorkshopRequestData,
    WorkshopRequestWithParent,
    ApiResponse
} from '@/types';

export const useWorkshopRequests = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Создание новой заявки
    const createRequest = useCallback(async (data: CreateWorkshopRequestData): Promise<ApiResponse<WorkshopRequest> | null> => {
        setLoading(true);
        setError(null);

        try {
            console.log('🔍 useWorkshopRequests.createRequest: Отправляем заявку:', data);
            const response = await api.post('/workshop-requests', data);
            console.log('✅ useWorkshopRequests.createRequest: Получен ответ:', response.data);

            // Проверяем структуру ответа и добавляем недостающие поля
            if (response.data && typeof response.data === 'object') {
                if ('success' in response.data) {
                    setError(null);
                    return response.data as ApiResponse<WorkshopRequest>;
                } else {
                    // Оборачиваем в стандартную структуру
                    const wrappedResponse: ApiResponse<WorkshopRequest> = {
                        success: true,
                        data: response.data as WorkshopRequest,
                        message: 'Заявка создана успешно'
                    };
                    setError(null);
                    return wrappedResponse;
                }
            }

            setError(null);
            return null;
        } catch (err: unknown) {
            console.error('❌ useWorkshopRequests.createRequest: Ошибка:', err);
            const error = err as { response?: { data?: { error?: string } }; message?: string };
            console.log('📋 useWorkshopRequests.createRequest: Детали ошибки:', {
                status: error.response?.data?.error,
                message: error.message
            });
            const errorMessage = error.response?.data?.error || 'Не удалось создать заявку';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Получение всех заявок (для админа)
    const getAllRequests = useCallback(async (): Promise<ApiResponse<WorkshopRequestWithParent[]> | null> => {
        setLoading(true);
        setError(null);

        try {
            console.log('🔍 useWorkshopRequests.getAllRequests: Запрашиваем все заявки...');
            console.log('🔍 useWorkshopRequests.getAllRequests: API URL:', `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/workshop-requests`);
            console.log('🔍 useWorkshopRequests.getAllRequests: Токен авторизации:', !!localStorage.getItem('authToken'));

            const response = await api.get('/workshop-requests');
            console.log('✅ useWorkshopRequests.getAllRequests: Получен ответ:', response.data);
            console.log('✅ useWorkshopRequests.getAllRequests: Тип response.data:', typeof response.data);
            console.log('✅ useWorkshopRequests.getAllRequests: Структура response.data:', Object.keys(response.data || {}));

            // Проверяем структуру ответа
            if (response.data && typeof response.data === 'object') {
                // Если ответ уже в нужном формате
                if ('success' in response.data && 'data' in response.data) {
                    console.log('✅ useWorkshopRequests.getAllRequests: Ответ в правильном формате');
                    setLoading(false);
                    return response.data as ApiResponse<WorkshopRequestWithParent[]>;
                }

                // Если ответ - массив напрямую
                if (Array.isArray(response.data)) {
                    console.log('✅ useWorkshopRequests.getAllRequests: Ответ - массив, оборачиваем в структуру');
                    const wrappedResponse: ApiResponse<WorkshopRequestWithParent[]> = {
                        success: true,
                        data: response.data,
                        message: 'Заявки загружены успешно'
                    };
                    setLoading(false);
                    return wrappedResponse;
                }

                // Если ответ - объект с данными, но без success
                if ('data' in response.data && Array.isArray(response.data.data)) {
                    console.log('✅ useWorkshopRequests.getAllRequests: Ответ содержит data массив, добавляем success');
                    const wrappedResponse: ApiResponse<WorkshopRequestWithParent[]> = {
                        success: true,
                        data: response.data.data,
                        message: 'Заявки загружены успешно'
                    };
                    setLoading(false);
                    return wrappedResponse;
                }
            }

            console.log('⚠️ useWorkshopRequests.getAllRequests: Неожиданная структура ответа, возвращаем null');
            setLoading(false);
            return null;

        } catch (error) {
            console.error('❌ useWorkshopRequests.getAllRequests: Ошибка при загрузке заявок:', error);
            setError(error instanceof Error ? error.message : 'Неизвестная ошибка');
            setLoading(false);
            return null;
        }
    }, []);

    // Получение заявок родителя
    const getMyRequests = useCallback(async (): Promise<ApiResponse<WorkshopRequest[]> | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get('/workshop-requests/my');

            // Проверяем структуру ответа и добавляем недостающие поля
            if (response.data && typeof response.data === 'object') {
                if ('success' in response.data) {
                    setError(null);
                    return response.data as ApiResponse<WorkshopRequest[]>;
                } else if (Array.isArray(response.data)) {
                    const wrappedResponse: ApiResponse<WorkshopRequest[]> = {
                        success: true,
                        data: response.data,
                        message: 'Заявки загружены успешно'
                    };
                    setError(null);
                    return wrappedResponse;
                }
            }

            setError(null);
            return null;
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } }; message?: string };
            const errorMessage = error.response?.data?.error || 'Не удалось получить заявки';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Получение заявки по ID
    const getRequestById = useCallback(async (id: string): Promise<ApiResponse<WorkshopRequest> | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get(`/workshop-requests/${id}`);

            // Проверяем структуру ответа и добавляем недостающие поля
            if (response.data && typeof response.data === 'object') {
                if ('success' in response.data) {
                    setError(null);
                    return response.data as ApiResponse<WorkshopRequest>;
                } else {
                    const wrappedResponse: ApiResponse<WorkshopRequest> = {
                        success: true,
                        data: response.data as WorkshopRequest,
                        message: 'Заявка загружена успешно'
                    };
                    setError(null);
                    return wrappedResponse;
                }
            }

            setError(null);
            return null;
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } }; message?: string };
            const errorMessage = error.response?.data?.error || 'Не удалось получить заявку';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Обновление статуса заявки (для админа)
    const updateRequestStatus = useCallback(async (
        id: string,
        data: UpdateWorkshopRequestData
    ): Promise<ApiResponse<WorkshopRequest> | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.patch(`/workshop-requests/${id}/status`, data);

            // Проверяем структуру ответа и добавляем недостающие поля
            if (response.data && typeof response.data === 'object') {
                if ('success' in response.data) {
                    setError(null);
                    return response.data as ApiResponse<WorkshopRequest>;
                } else {
                    const wrappedResponse: ApiResponse<WorkshopRequest> = {
                        success: true,
                        data: response.data as WorkshopRequest,
                        message: 'Статус заявки обновлен успешно'
                    };
                    setError(null);
                    return wrappedResponse;
                }
            }

            setError(null);
            return null;
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } }; message?: string };
            const errorMessage = error.response?.data?.error || 'Не удалось обновить заявку';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Удаление заявки (для админа)
    const deleteRequest = useCallback(async (id: string): Promise<ApiResponse<boolean> | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.delete(`/workshop-requests/${id}`);

            // Проверяем структуру ответа и добавляем недостающие поля
            if (response.data && typeof response.data === 'object') {
                if ('success' in response.data) {
                    setError(null);
                    return response.data as ApiResponse<boolean>;
                } else {
                    const wrappedResponse: ApiResponse<boolean> = {
                        success: true,
                        data: Boolean(response.data),
                        message: 'Заявка удалена успешно'
                    };
                    setError(null);
                    return wrappedResponse;
                }
            }

            setError(null);
            return null;
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } }; message?: string };
            const errorMessage = error.response?.data?.error || 'Не удалось удалить заявку';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Получение статистики заявок (для админа)
    const getRequestsStats = useCallback(async (): Promise<ApiResponse<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    }> | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get('/workshop-requests/stats/overview');

            // Проверяем структуру ответа и добавляем недостающие поля
            if (response.data && typeof response.data === 'object') {
                if ('success' in response.data) {
                    setError(null);
                    return response.data as ApiResponse<{
                        total: number;
                        pending: number;
                        approved: number;
                        rejected: number;
                    }>;
                } else if ('total' in response.data && 'pending' in response.data && 'approved' in response.data && 'rejected' in response.data) {
                    const wrappedResponse: ApiResponse<{
                        total: number;
                        pending: number;
                        approved: number;
                        rejected: number;
                    }> = {
                        success: true,
                        data: response.data as {
                            total: number;
                            pending: number;
                            approved: number;
                            rejected: number;
                        },
                        message: 'Статистика загружена успешно'
                    };
                    setError(null);
                    return wrappedResponse;
                }
            }

            setError(null);
            return null;
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } }; message?: string };
            const errorMessage = error.response?.data?.error || 'Не удалось получить статистику';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Очистка ошибки
    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        loading,
        error,
        createRequest,
        getAllRequests,
        getMyRequests,
        getRequestById,
        updateRequestStatus,
        deleteRequest,
        getRequestsStats,
        clearError
    };
};

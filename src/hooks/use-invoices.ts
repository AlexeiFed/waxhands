/**
 * @file: use-invoices.ts
 * @description: Хук для работы со счетами мастер-классов
 * @dependencies: React Query, API endpoints
 * @created: 2024-12-19
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Invoice, CreateInvoiceRequest, InvoiceFilters } from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// API функции для работы со счетами
const invoicesAPI = {
    // Получение списка счетов с фильтрацией
    getInvoices: async (filters: InvoiceFilters = {}): Promise<{ invoices: Invoice[]; total: number }> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== '') {
                params.append(key, value.toString());
            }
        });

        const url = `${API_BASE_URL}/invoices?${params.toString()}`;
        console.log('🔍 API getInvoices - URL:', url);
        console.log('🔍 API getInvoices - filters:', filters);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        console.log('🔍 API getInvoices - response status:', response.status);
        console.log('🔍 API getInvoices - response ok:', response.ok);

        if (!response.ok) {
            throw new Error('Не удалось загрузить счета');
        }

        const data = await response.json();
        console.log('🔍 API getInvoices - raw response data:', data);

        if (!data.success) {
            throw new Error(data.error || 'Не удалось загрузить счета');
        }

        const result = {
            invoices: data.data.invoices,
            total: data.data.pagination?.total || data.data.invoices.length
        };

        console.log('🔍 API getInvoices - processed result:', result);
        return result;
    },

    // Получение счета по ID
    getInvoiceById: async (id: string): Promise<Invoice> => {
        const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось загрузить счет');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось загрузить счет');
        }

        return data.data;
    },

    // Создание нового счета
    createInvoice: async (invoiceData: CreateInvoiceRequest): Promise<Invoice> => {
        console.log('🔄 createInvoice: Отправляем данные:', invoiceData);
        console.log('🔄 createInvoice: Токен аутентификации:', localStorage.getItem('authToken') ? 'Есть' : 'Отсутствует');

        const response = await fetch(`${API_BASE_URL}/invoices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(invoiceData)
        });

        console.log('🔄 createInvoice: Статус ответа:', response.status);
        console.log('🔄 createInvoice: Статус ok:', response.ok);

        // Получаем текст ответа для лучшей диагностики
        const responseText = await response.text();
        console.log('🔄 createInvoice: Текст ответа:', responseText);

        if (!response.ok) {
            let errorMessage = 'Не удалось создать счет';

            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.error || errorMessage;
                console.log('❌ createInvoice: Данные об ошибке:', errorData);
            } catch (parseError) {
                console.log('❌ createInvoice: Не удалось распарсить ответ об ошибке:', parseError);
            }

            throw new Error(`${errorMessage} (HTTP ${response.status})`);
        }

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('❌ createInvoice: Ошибка парсинга успешного ответа:', parseError);
            throw new Error('Некорректный ответ сервера');
        }

        if (!data.success) {
            throw new Error(data.error || 'Не удалось создать счет');
        }

        console.log('✅ createInvoice: Счет успешно создан:', data.data);
        return data.data;
    },

    // Обновление статуса счета
    updateInvoiceStatus: async (id: string, status: string): Promise<Invoice> => {
        const response = await fetch(`${API_BASE_URL}/invoices/${id}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify({ status })
        });

        if (!response.ok) {
            throw new Error('Не удалось обновить статус счета');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось обновить статус счета');
        }

        return data.data;
    },

    // Получение счетов по дате
    getInvoicesByDate: async (date: string): Promise<Invoice[]> => {
        const response = await fetch(`${API_BASE_URL}/invoices/date/${date}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось загрузить счета по дате');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось загрузить счета по дате');
        }

        return data.data;
    }
};

// Экспортируем API для использования в других компонентах
export { invoicesAPI };

// Хуки для работы со счетами
export const useInvoices = (filters: InvoiceFilters = {}) => {
    return useQuery({
        queryKey: ['invoices', JSON.stringify(filters)],
        queryFn: () => invoicesAPI.getInvoices(filters),
        staleTime: 5 * 60 * 1000, // 5 минут
    });
};

export const useInvoiceById = (id: string) => {
    return useQuery({
        queryKey: ['invoice', id],
        queryFn: () => invoicesAPI.getInvoiceById(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateInvoice = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: invoicesAPI.createInvoice,
        onSuccess: () => {
            // Инвалидируем кэш счетов и мастер-классов
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
            queryClient.invalidateQueries({ queryKey: ['masterClasses'] });
        },
    });
};

export const useUpdateInvoiceStatus = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            invoicesAPI.updateInvoiceStatus(id, status),
        onSuccess: () => {
            // Инвалидируем кэш счетов
            queryClient.invalidateQueries({ queryKey: ['invoices'] });
        },
    });
};

export const useInvoicesByDate = (date: string) => {
    return useQuery({
        queryKey: ['invoices', 'date', date],
        queryFn: () => invoicesAPI.getInvoicesByDate(date),
        enabled: !!date,
        staleTime: 5 * 60 * 1000,
    });
};

// Хук для получения счетов участника
export const useParticipantInvoices = (participantId: string) => {
    return useQuery({
        queryKey: ['invoices', 'participant', participantId],
        queryFn: () => invoicesAPI.getInvoices({ participant_id: participantId }),
        enabled: !!participantId,
        staleTime: 5 * 60 * 1000,
    });
};

// Хук для получения счетов по мастер-классу
export const useWorkshopInvoices = (workshopId: string) => {
    return useQuery({
        queryKey: ['invoices', 'workshop', workshopId],
        queryFn: () => invoicesAPI.getInvoices({ master_class_id: workshopId }),
        enabled: !!workshopId,
        staleTime: 5 * 60 * 1000,
    });
};

// Хук для проверки участия в мастер-классе
export const useWorkshopParticipation = (workshopId: string, participantId: string) => {
    return useQuery({
        queryKey: ['invoices', 'workshop', workshopId, 'participant', participantId],
        queryFn: () => invoicesAPI.getInvoices({
            master_class_id: workshopId,
            participant_id: participantId
        }),
        enabled: !!workshopId && !!participantId,
        staleTime: 5 * 60 * 1000,
    });
};

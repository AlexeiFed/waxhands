import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { Service, ServiceStyle, ServiceOption } from '../types';
import { useServicesWebSocket } from './use-services-websocket';

interface UseServicesReturn {
    services: Service[];
    loading: boolean;
    error: string | null;
    total: number;
    fetchServices: (params?: {
        page?: number;
        limit?: number;
        category?: string;
        surname?: string;
        phone?: string;
        userId?: string;
        forceRefresh?: boolean;
    }) => Promise<void>;
    createService: (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateService: (id: string, serviceData: Partial<Service>) => Promise<void>;
    deleteService: (id: string) => Promise<void>;
    getServiceById: (id: string, userData?: { surname?: string; phone?: string; userId?: string }) => Promise<Service>;
    addStyleToService: (serviceId: string, style: Omit<ServiceStyle, 'id'>) => Promise<void>;
    addOptionToService: (serviceId: string, option: Omit<ServiceOption, 'id'>) => Promise<void>;
    updateServiceStyle: (serviceId: string, styleId: string, style: Partial<ServiceStyle>) => Promise<void>;
    updateServiceOption: (serviceId: string, optionId: string, option: Partial<ServiceOption>) => Promise<void>;
    reorderServiceStyles: (serviceId: string, order: string[]) => Promise<void>;
    reorderServiceOptions: (serviceId: string, order: string[]) => Promise<void>;
}

export const useServices = (userId?: string): UseServicesReturn => {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    const fetchServices = useCallback(async (params?: {
        page?: number;
        limit?: number;
        category?: string;
        surname?: string;
        phone?: string;
        userId?: string;
        forceRefresh?: boolean;
    }) => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.services.getServices(params);
            setServices(response.services);
            setTotal(response.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch services');
            console.error('Error fetching services:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // WebSocket для автоматических обновлений услуг
    const { isConnected: servicesWsConnected } = useServicesWebSocket({
        userId,
        enabled: true,
        onServiceUpdate: useCallback(() => {
            // Принудительно обновляем услуги
            fetchServices({ forceRefresh: true });
        }, [fetchServices])
    });

    const createService = async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setLoading(true);
            setError(null);
            await api.services.createService(serviceData);
            // Обновляем список услуг после создания
            await fetchServices();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create service');
            console.error('Error creating service:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const addStyleToService = async (serviceId: string, style: Omit<ServiceStyle, 'id'>) => {
        try {
            setLoading(true);
            setError(null);
            await api.services.addStyleToService(serviceId, style);
            await fetchServices();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add style to service');
            console.error('Error adding style:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const addOptionToService = async (serviceId: string, option: Omit<ServiceOption, 'id'>) => {
        try {
            setLoading(true);
            setError(null);
            await api.services.addOptionToService(serviceId, option);
            await fetchServices();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add option to service');
            console.error('Error adding option:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateServiceStyle = async (serviceId: string, styleId: string, style: Partial<ServiceStyle>) => {
        try {
            setLoading(true);
            setError(null);
            const result = await api.services.updateServiceStyle(serviceId, styleId, style);
            await fetchServices();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update service style');
            console.error('Error updating style:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateServiceOption = async (serviceId: string, optionId: string, option: Partial<ServiceOption>) => {
        try {
            setLoading(true);
            setError(null);
            await api.services.updateServiceOption(serviceId, optionId, option);
            await fetchServices();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update service option');
            console.error('Error updating option:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reorderServiceStyles = async (serviceId: string, order: string[]) => {
        try {
            setLoading(true);
            setError(null);

            // Валидация входных данных
            if (!Array.isArray(order) || order.length === 0) {
                throw new Error('Неверный массив порядка стилей');
            }

            if (!serviceId) {
                throw new Error('ID услуги обязателен');
            }

            // Валидация ID стилей
            const invalidIds = order.filter(id => !id || typeof id !== 'string');
            if (invalidIds.length > 0) {
                throw new Error(`Неверные ID стилей: ${invalidIds.join(', ')}`);
            }
            await apiRequestReorder('styles', serviceId, order);
            await fetchServices();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Не удалось изменить порядок стилей';
            setError(errorMessage);
            console.error('Error reordering styles:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const reorderServiceOptions = async (serviceId: string, order: string[]) => {
        try {
            setLoading(true);
            setError(null);

            // Валидация входных данных
            if (!Array.isArray(order) || order.length === 0) {
                throw new Error('Неверный массив порядка опций');
            }

            if (!serviceId) {
                throw new Error('ID услуги обязателен');
            }

            // Валидация ID опций
            const invalidIds = order.filter(id => !id || typeof id !== 'string');
            if (invalidIds.length > 0) {
                throw new Error(`Неверные ID опций: ${invalidIds.join(', ')}`);
            }
            await apiRequestReorder('options', serviceId, order);
            await fetchServices();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Не удалось изменить порядок опций';
            setError(errorMessage);
            console.error('Error reordering options:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const apiRequestReorder = async (type: 'styles' | 'options', serviceId: string, order: string[]) => {
        try {
            // Получаем текущую услугу для дополнительной валидации
            const currentService = services.find(s => s.id === serviceId);
            if (currentService) {
                const currentItems = type === 'styles' ? currentService.styles : currentService.options;
                console.log(`Текущие ${type} в услуге:`, currentItems.map(item => ({ id: item.id, name: item.name })));
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/services/${serviceId}/${type}/reorder`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(localStorage.getItem('authToken') ? { 'Authorization': `Bearer ${localStorage.getItem('authToken')}` } : {})
                },
                body: JSON.stringify({ order })
            });

            const data = await response.json().catch(() => ({
                success: false,
                error: 'Не удалось обработать ответ сервера'
            }));
            if (!response.ok) {
                const errorMessage = data.error || `Ошибка ${response.status}: ${response.statusText}`;
                console.error(`Ошибка сортировки ${type}:`, errorMessage);
                throw new Error(errorMessage);
            }

            if (!data.success) {
                const errorMessage = data.error || `Не удалось выполнить сортировку ${type}`;
                console.error(`Ошибка успешности операции ${type}:`, errorMessage);
                throw new Error(errorMessage);
            }

            return data;
        } catch (error) {
            console.error(`Критическая ошибка при сортировке ${type}:`, error);
            throw error;
        }
    };

    const updateService = async (id: string, serviceData: Partial<Service>) => {
        try {
            setLoading(true);
            setError(null);
            await api.services.updateService(id, serviceData);
            // Обновляем список услуг после обновления
            await fetchServices();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update service');
            console.error('Error updating service:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteService = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await api.services.deleteService(id);
            // Обновляем список услуг после удаления
            await fetchServices();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete service');
            console.error('Error deleting service:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getServiceById = async (id: string, userData?: { surname?: string; phone?: string; userId?: string }): Promise<Service> => {
        try {
            setError(null);
            return await api.services.getServiceById(id, userData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get service';
            setError(errorMessage);
            console.error('Error getting service:', err);
            throw err;
        }
    };

    // Загружаем услуги при инициализации хука
    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    return {
        services,
        loading,
        error,
        total,
        fetchServices,
        createService,
        updateService,
        deleteService,
        getServiceById,
        addStyleToService,
        addOptionToService,
        updateServiceStyle,
        updateServiceOption,
        reorderServiceStyles,
        reorderServiceOptions,
    };
}; 
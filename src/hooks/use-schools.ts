import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/lib/api';
import { School, ApiResponse, SchoolWithAddress } from '@/types';

interface UseSchoolsReturn {
    schools: School[];
    loading: boolean;
    error: string | null;
    total: number;
    fetchSchools: (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }) => Promise<void>;
    createSchool: (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateSchool: (id: string, schoolData: Partial<School>) => Promise<void>;
    deleteSchool: (id: string) => Promise<void>;
    getSchoolById: (id: string) => Promise<School>;
    getSchoolClasses: (id: string) => Promise<string[]>;
    getSchoolsWithAddresses: () => Promise<ApiResponse<SchoolWithAddress[]> | null>;
}

export const useSchools = (): UseSchoolsReturn => {
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);

    const fetchSchools = useCallback(async (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }) => {
        try {

            setLoading(true);
            setError(null);
            const response = await api.schools.getSchools(params);

            setSchools(response.schools);
            setTotal(response.total);

        } catch (err) {
            console.error('use-schools: Ошибка загрузки школ:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch schools');
            console.error('Error fetching schools:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const createSchool = async (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setLoading(true);
            setError(null);
            await api.schools.createSchool(schoolData);
            // Обновляем список школ после создания
            await fetchSchools();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create school');
            console.error('Error creating school:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateSchool = async (id: string, schoolData: Partial<School>) => {
        try {
            setLoading(true);
            setError(null);
            await api.schools.updateSchool(id, schoolData);
            // Обновляем список школ после обновления
            await fetchSchools();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update school');
            console.error('Error updating school:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteSchool = async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            await api.schools.deleteSchool(id);
            // Обновляем список школ после удаления
            await fetchSchools();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete school');
            console.error('Error deleting school:', err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const getSchoolById = async (id: string): Promise<School> => {
        try {
            setError(null);
            return await api.schools.getSchoolById(id);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get school';
            setError(errorMessage);
            console.error('Error getting school:', err);
            throw err;
        }
    };

    const getSchoolClasses = async (id: string): Promise<string[]> => {
        try {
            setError(null);
            return await api.schools.getSchoolClasses(id);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to get school classes';
            setError(errorMessage);
            console.error('Error getting school classes:', err);
            throw err;
        }
    };

    // Получение школ с адресами для фильтрации
    const getSchoolsWithAddresses = useCallback(async (): Promise<ApiResponse<SchoolWithAddress[]> | null> => {
        setLoading(true);
        setError(null);

        try {
            const response = await api.get('/schools/with-addresses');

            // Проверяем структуру ответа и добавляем недостающие поля
            if (response.data && typeof response.data === 'object') {
                if ('success' in response.data) {
                    setError(null);
                    return response.data as ApiResponse<SchoolWithAddress[]>;
                } else if (Array.isArray(response.data)) {
                    const wrappedResponse: ApiResponse<SchoolWithAddress[]> = {
                        success: true,
                        data: response.data,
                        message: 'Школы с адресами загружены успешно'
                    };
                    setError(null);
                    return wrappedResponse;
                }
            }

            setError(null);
            return null;
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } }; message?: string };
            const errorMessage = error.response?.data?.error || 'Не удалось получить школы с адресами';
            setError(errorMessage);
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Загружаем школы при инициализации хука
    useEffect(() => {

        fetchSchools();
    }, []);

    return {
        schools,
        loading,
        error,
        total,
        fetchSchools,
        createSchool,
        updateSchool,
        deleteSchool,
        getSchoolById,
        getSchoolClasses,
        getSchoolsWithAddresses
    };
}; 
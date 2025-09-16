/**
 * @file: use-cities.ts
 * @description: Хук для работы с городами из адресов школ
 * @dependencies: api, types
 * @created: 2024-12-25
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { School, ApiResponse } from '@/types';

interface UseCitiesReturn {
    cities: string[];
    loading: boolean;
    error: string | null;
    schoolsError: string | null;
    fetchCities: () => Promise<void>;
    getSchoolsByCity: (city: string) => Promise<School[]>;
}

export const useCities = (): UseCitiesReturn => {
    const [cities, setCities] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [schoolsError, setSchoolsError] = useState<string | null>(null);

    const fetchCities = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            console.log('use-cities v2: Начинаем загрузку городов...');
            const response = await api.get('/schools/cities');
            console.log('use-cities v2: Получен ответ:', response);

            // Обрабатываем разные форматы ответа API
            let citiesData: string[] = [];

            if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
                const apiResponse = response.data as { success: boolean; data: unknown };
                if (apiResponse.success && Array.isArray(apiResponse.data)) {
                    // Стандартный формат: { success: true, data: [...] }
                    citiesData = apiResponse.data as string[];
                    console.log('use-cities v2: Города получены (стандартный формат):', citiesData);
                } else {
                    console.error('use-cities v2: Неожиданный формат ответа API:', response.data);
                    setError('Не удалось получить города');
                    return;
                }
            } else if (Array.isArray(response.data)) {
                // Прямой массив: [...]
                citiesData = response.data as string[];
                console.log('use-cities v2: Города получены (прямой массив):', citiesData);
            } else {
                console.error('use-cities v2: Неожиданный формат ответа API:', response.data);
                setError('Не удалось получить города');
                return;
            }

            if (citiesData.length > 0) {
                setCities(citiesData);
            } else {
                console.warn('use-cities v2: Получен пустой массив городов');
                setError('Города не найдены');
            }
        } catch (err) {
            console.error('use-cities: Ошибка загрузки городов:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch cities');
        } finally {
            setLoading(false);
        }
    }, []);

    const getSchoolsByCity = useCallback(async (city: string): Promise<School[]> => {
        try {
            console.log('use-cities: getSchoolsByCity called with city:', city);
            setSchoolsError(null);
            const response = await api.get(`/schools/by-city/${encodeURIComponent(city)}`);
            console.log('use-cities: API response:', response);
            console.log('use-cities: response.data:', response.data);

            // Проверяем успешность ответа - response.data уже содержит {success: true, data: [...]}
            if (response.data && typeof response.data === 'object' && 'success' in response.data && 'data' in response.data) {
                const apiResponse = response.data as { success: boolean; data: unknown };
                if (apiResponse.success && Array.isArray(apiResponse.data)) {
                    console.log('use-cities: Response data.data:', apiResponse.data);
                    setSchoolsError(null); // Сбрасываем ошибку при успешной загрузке
                    const mappedSchools = apiResponse.data.map((school: Record<string, unknown>) => ({
                        ...school,
                        classes: school.classes || [],
                        teacherPhone: school.teacher_phone
                    }));
                    console.log('use-cities: Mapped schools:', mappedSchools);
                    return mappedSchools as School[];
                } else {
                    console.log('use-cities: API response not successful or invalid data:', response.data);
                    setSchoolsError('Не удалось получить школы по городу');
                    return [];
                }
            } else if (Array.isArray(response.data)) {
                // Прямой массив школ (если API возвращает массив напрямую)
                console.log('use-cities: Direct array response:', response.data);
                setSchoolsError(null);
                const mappedSchools = response.data.map((school: Record<string, unknown>) => ({
                    ...school,
                    classes: school.classes || [],
                    teacherPhone: school.teacher_phone
                }));
                console.log('use-cities: Mapped schools (direct array):', mappedSchools);
                return mappedSchools as School[];
            } else {
                console.log('use-cities: API response not successful or invalid data:', response.data);
                setSchoolsError('Не удалось получить школы по городу');
                return [];
            }
        } catch (err) {
            console.error('use-cities: Error fetching schools by city:', err);
            setSchoolsError(err instanceof Error ? err.message : 'Failed to fetch schools by city');
            return [];
        }
    }, []);

    // Загружаем города при инициализации хука
    useEffect(() => {
        fetchCities();
    }, [fetchCities]);

    return {
        cities,
        loading,
        error,
        schoolsError,
        fetchCities,
        getSchoolsByCity
    };
};

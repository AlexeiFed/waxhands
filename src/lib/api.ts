// API клиент для работы с бэкендом
import {
    ApiResponse,
    LoginResponse,
    User,
    School,
    Service,
    ServiceStyle,
    ServiceOption,
    MasterClass,
    LoginCredentials,
    RegisterData,
    UserRole,
    WorkshopRegistration,
    CreateRegistrationData,
    WorkshopStats,
    CreateGroupRegistrationRequest,
    Invoice,
    InvoiceFilters,
    CreateInvoiceRequest
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Утилиты для работы с токенами
const getAuthToken = (): string | null => {
    return localStorage.getItem('authToken');
};

const setAuthToken = (token: string): void => {
    localStorage.setItem('authToken', token);
};

const removeAuthToken = (): void => {
    localStorage.removeItem('authToken');
};

// Базовый запрос к API
const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔑 Using auth token:', token.substring(0, 20) + '...');
    } else {
        console.log('⚠️ No auth token found');
    }

    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log('🌐 Making API request to:', fullUrl);
    console.log('📋 Request options:', { method: options.method || 'GET', headers });

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers,
        });

        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

        const data = await response.json();
        console.log('📄 Response data:', data);

        if (!response.ok) {
            // Обработка 401 ошибки (неавторизован)
            if (response.status === 401) {
                console.log('❌ Unauthorized access, clearing auth token');
                removeAuthToken();
                // Можно добавить редирект на страницу входа
                window.location.href = '/login';
                throw new Error('Unauthorized access');
            }

            // Retry логика для 429 ошибок
            if (response.status === 429) {
                console.log('⏳ Rate limit exceeded, retrying in 5 seconds...');
                await new Promise(resolve => setTimeout(resolve, 5000));

                // Повторяем запрос один раз
                const retryResponse = await fetch(fullUrl, {
                    ...options,
                    headers,
                });

                const retryData = await retryResponse.json();

                if (!retryResponse.ok) {
                    throw new Error(retryData.error || `HTTP error! status: ${retryResponse.status}`);
                }

                return retryData;
            }

            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('❌ API request error:', error);
        throw error;
    }
};

// API методы для аутентификации
export const authAPI = {
    // Вход в систему
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        // Нормализуем данные для backend
        const normalizedCredentials = {
            ...credentials,
            name: credentials.name || credentials.username, // Поддерживаем оба поля
        };

        // Убираем username из данных, отправляемых на backend
        const { username, ...credentialsForBackend } = normalizedCredentials;

        const response = await apiRequest<LoginResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentialsForBackend),
        });

        if (response.success && response.data) {
            setAuthToken(response.data.token);
            return response.data;
        }

        throw new Error(response.error || 'Login failed');
    },

    // Регистрация
    register: async (userData: RegisterData): Promise<LoginResponse> => {
        const response = await apiRequest<LoginResponse>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        if (response.success && response.data) {
            setAuthToken(response.data.token);
            return response.data;
        }

        throw new Error(response.error || 'Registration failed');
    },

    // Получение профиля
    getProfile: async (): Promise<User> => {
        const response = await apiRequest<User>('/auth/profile');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to get profile');
    },

    // Обновление профиля
    updateProfile: async (updateData: Partial<User>): Promise<User> => {
        // Преобразуем camelCase поля в snake_case для бэкенда
        const transformedData: Record<string, unknown> = {};

        if (updateData.name !== undefined) transformedData.name = updateData.name;
        if (updateData.surname !== undefined) transformedData.surname = updateData.surname;
        if (updateData.email !== undefined) transformedData.email = updateData.email;
        if (updateData.phone !== undefined) transformedData.phone = updateData.phone;
        if (updateData.age !== undefined) transformedData.age = updateData.age;
        if (updateData.schoolId !== undefined) {
            transformedData.school_id = updateData.schoolId;
            // school_name будет обновлен на бэкенде автоматически
        }
        if (updateData.class !== undefined) {
            transformedData.class = updateData.class;
            transformedData.class_group = updateData.class;
        }

        console.log('📤 Sending profile update data:', transformedData);

        const response = await apiRequest<User>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(transformedData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to update profile');
    },

    // Выход из системы
    logout: (): void => {
        removeAuthToken();
    },

    // Проверка аутентификации
    isAuthenticated: (): boolean => {
        return !!getAuthToken();
    },
};

// API методы для школ
export const schoolsAPI = {
    // Получение списка школ
    getSchools: async (params?: {
        page?: number;
        limit?: number;
        search?: string;
    }): Promise<{ schools: School[]; total: number }> => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.search) searchParams.append('search', params.search);

        const response = await apiRequest<{ schools: School[]; total: number }>(
            `/schools?${searchParams.toString()}`
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to get schools');
    },

    // Получение школы по ID
    getSchoolById: async (id: string): Promise<School> => {
        const response = await apiRequest<School>(`/schools/${id}`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to get school');
    },

    // Создание школы
    createSchool: async (schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'>): Promise<School> => {
        const response = await apiRequest<School>('/schools', {
            method: 'POST',
            body: JSON.stringify(schoolData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to create school');
    },

    // Обновление школы
    updateSchool: async (id: string, schoolData: Partial<School>): Promise<School> => {
        const response = await apiRequest<School>(`/schools/${id}`, {
            method: 'PUT',
            body: JSON.stringify(schoolData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to update school');
    },

    // Удаление школы
    deleteSchool: async (id: string): Promise<void> => {
        const response = await apiRequest(`/schools/${id}`, {
            method: 'DELETE',
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to delete school');
        }
    },

    // Получение классов школы
    getSchoolClasses: async (id: string): Promise<string[]> => {
        const response = await apiRequest<{ classes: string[] }>(`/schools/${id}/classes`);

        if (response.success && response.data) {
            return response.data.classes;
        }

        throw new Error(response.error || 'Failed to get school classes');
    },
};

// API методы для пользователей
export const usersAPI = {
    // Получение списка пользователей
    getUsers: async (params?: {
        page?: number;
        limit?: number;
        role?: string;
    }): Promise<{ users: User[]; total: number }> => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.role) searchParams.append('role', params.role);

        const response = await apiRequest<{ users: User[]; total: number }>(
            `/users?${searchParams.toString()}`
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to get users');
    },

    // Получение пользователя по ID
    getUserById: async (id: string): Promise<User> => {
        const response = await apiRequest<User>(`/users/${id}`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to get user');
    },

    // Создание пользователя
    createUser: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
        const response = await apiRequest<User>('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to create user');
    },

    // Обновление пользователя
    updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
        const response = await apiRequest<User>(`/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to update user');
    },

    // Удаление пользователя
    deleteUser: async (id: string): Promise<void> => {
        const response = await apiRequest(`/users/${id}`, {
            method: 'DELETE',
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to delete user');
        }
    },

    // Получение детей по ID родителя
    getChildrenByParentId: async (parentId: string): Promise<User[]> => {
        const response = await apiRequest<User[]>(`/users/${parentId}/children`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to get children');
    },
};

// API методы для услуг
export const servicesAPI = {
    // Получение списка услуг
    getServices: async (params?: {
        page?: number;
        limit?: number;
        category?: string;
    }): Promise<{ services: Service[]; total: number }> => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.category) searchParams.append('category', params.category);

        const response = await apiRequest<{ services: Service[]; total: number }>(
            `/services?${searchParams.toString()}`
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to get services');
    },

    // Получение услуги по ID
    getServiceById: async (id: string): Promise<Service> => {
        const response = await apiRequest<Service>(`/services/${id}`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to get service');
    },

    // Получение медиафайлов услуги
    getServiceMedia: async (serviceId: string): Promise<{
        serviceId: string;
        serviceName: string;
        styles: ServiceStyle[];
        options: ServiceOption[];
        events: Array<{
            id: string;
            notes?: string;
            statistics: Record<string, unknown>;
            createdAt: string;
        }>;
    }> => {
        const response = await apiRequest<{
            serviceId: string;
            serviceName: string;
            styles: ServiceStyle[];
            options: ServiceOption[];
            events: Array<{
                id: string;
                notes?: string;
                statistics: Record<string, unknown>;
                createdAt: string;
            }>;
        }>(`/services/${serviceId}/media`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to get service media');
    },

    // Создание услуги
    createService: async (serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> => {
        const response = await apiRequest<Service>('/services', {
            method: 'POST',
            body: JSON.stringify(serviceData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to create service');
    },

    // Обновление услуги
    updateService: async (id: string, serviceData: Partial<Service>): Promise<Service> => {
        const response = await apiRequest<Service>(`/services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(serviceData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to update service');
    },

    // Удаление услуги
    deleteService: async (id: string): Promise<void> => {
        const response = await apiRequest(`/services/${id}`, {
            method: 'DELETE',
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to delete service');
        }
    },

    // Добавление стиля к услуге
    addStyleToService: async (serviceId: string, styleData: Omit<ServiceStyle, 'id'>): Promise<ServiceStyle> => {
        const response = await apiRequest<ServiceStyle>(`/services/${serviceId}/styles`, {
            method: 'POST',
            body: JSON.stringify(styleData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to add style to service');
    },

    // Добавление опции к услуге
    addOptionToService: async (serviceId: string, optionData: Omit<ServiceOption, 'id'>): Promise<ServiceOption> => {
        const response = await apiRequest<ServiceOption>(`/services/${serviceId}/options`, {
            method: 'POST',
            body: JSON.stringify(optionData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to add option to service');
    },

    // Обновление стиля услуги
    updateServiceStyle: async (serviceId: string, styleId: string, styleData: Partial<ServiceStyle>): Promise<ServiceStyle> => {
        console.log('api: updateServiceStyle called:', { serviceId, styleId, styleData });
        console.log('api: styleData price type:', typeof styleData.price, 'value:', styleData.price);

        const response = await apiRequest<ServiceStyle>(`/services/${serviceId}/styles/${styleId}`, {
            method: 'PUT',
            body: JSON.stringify(styleData),
        });

        console.log('api: updateServiceStyle response:', response);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to update service style');
    },

    // Обновление опции услуги
    updateServiceOption: async (serviceId: string, optionId: string, optionData: Partial<ServiceOption>): Promise<ServiceOption> => {
        const response = await apiRequest<ServiceOption>(`/services/${serviceId}/options/${optionId}`, {
            method: 'PUT',
            body: JSON.stringify(optionData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to update service option');
    },
};

// API методы для загрузки файлов
export const uploadAPI = {
    // Загрузка файлов для стилей/опций
    uploadServiceFiles: async (files: {
        avatar?: File;
        images?: File[];
        videos?: File[];
    }): Promise<{
        avatar?: string;
        images?: string[];
        videos?: string[];
    }> => {
        const formData = new FormData();

        // Добавляем аватар
        if (files.avatar) {
            formData.append('avatar', files.avatar);
        }

        // Добавляем изображения
        if (files.images) {
            console.log('API: добавляем изображения в FormData:', files.images.length);
            files.images.forEach((image, index) => {
                console.log(`API: добавляем изображение ${index + 1}:`, image.name, image.type, image.size);
                formData.append('images', image);
            });
        }

        // Добавляем видео
        if (files.videos) {
            files.videos.forEach(video => {
                formData.append('videos', video);
            });
        }

        console.log('API: отправляем FormData на сервер');
        console.log('API: FormData entries:');
        for (const [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`  ${key}: File(${value.name}, ${value.type}, ${value.size} bytes)`);
            } else {
                console.log(`  ${key}: ${value}`);
            }
        }

        const response = await fetch(`${API_BASE_URL}/upload/service-files`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getAuthToken()}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (data.success && data.data) {
            return data.data;
        }

        throw new Error(data.error || 'Failed to upload files');
    },
};

// API методы для мастер-классов
export const masterClassesAPI = {
    // Получение списка мастер-классов
    getMasterClasses: async (params?: {
        page?: number;
        limit?: number;
        isActive?: boolean;
    }): Promise<{ masterClasses: MasterClass[]; total: number }> => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.isActive !== undefined) searchParams.append('isActive', params.isActive.toString());

        const response = await apiRequest<{ masterClasses: MasterClass[]; total: number }>(
            `/master-classes?${searchParams.toString()}`
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to get master classes');
    },

    // Получение мастер-класса по ID
    getMasterClassById: async (id: string): Promise<MasterClass> => {
        const response = await apiRequest<MasterClass>(`/master-classes/${id}`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to get master class');
    },

    // Создание мастер-класса
    createMasterClass: async (masterClassData: Omit<MasterClass, 'id' | 'createdAt' | 'updatedAt'>): Promise<MasterClass> => {
        const response = await apiRequest<MasterClass>('/master-classes', {
            method: 'POST',
            body: JSON.stringify(masterClassData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to create master class');
    },

    // Обновление мастер-класса
    updateMasterClass: async (id: string, masterClassData: Partial<MasterClass>): Promise<MasterClass> => {
        const response = await apiRequest<MasterClass>(`/master-classes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(masterClassData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to update master class');
    },

    // Удаление мастер-класса
    deleteMasterClass: async (id: string): Promise<void> => {
        const response = await apiRequest(`/master-classes/${id}`, {
            method: 'DELETE',
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to delete master class');
        }
    },
};

// API для событий мастер-классов
type MasterClassEventDTO = {
    id: string;
    date: string;
    time: string;
    school_id: string;
    class_group: string;
    service_id: string;
    executors: string[];
    notes?: string;
    participants: Array<{
        id: string;
        childId: string;
        childName: string;
        parentId: string;
        parentName: string;
        selectedStyles: string[];
        selectedOptions: string[];
        totalAmount: number;
        isPaid: boolean;
        hasReceived?: boolean;
        paymentMethod?: 'cash' | 'transfer';
        paymentDate?: string;
        notes?: string;
    }>;
    statistics: Record<string, unknown>;
    school_address?: string;
    school_name?: string; // Добавляем название школы
    service_name?: string; // Добавляем название услуги
    created_at: string;
    updated_at: string;
};

export const masterClassEventsAPI = {
    getEvents: async (params?: { schoolId?: string; classGroup?: string; date?: string; userId?: string }): Promise<{ masterClasses: Record<string, unknown>[]; total: number }> => {
        try {
            const searchParams = new URLSearchParams();
            if (params?.schoolId) searchParams.append('schoolId', params.schoolId);
            if (params?.classGroup) searchParams.append('classGroup', params.classGroup);
            if (params?.date) searchParams.append('date', params.date);
            if (params?.userId) searchParams.append('userId', params.userId);

            const response = await apiRequest<{ masterClasses: MasterClassEventDTO[]; total: number }>(`/master-classes?${searchParams.toString()}`);
            if (response.success && response.data) {
                // Получаем школы и услуги для заполнения названий
                const schoolsResponse = await apiRequest<{ schools: School[] }>('/schools');
                const servicesResponse = await apiRequest<{ services: Service[] }>('/services');

                const schools = schoolsResponse.success ? schoolsResponse.data?.schools || [] : [];
                const services = servicesResponse.success ? servicesResponse.data?.services || [] : [];

                const mapped = response.data.masterClasses.map(ev => {
                    const school = schools.find(s => s.id === ev.school_id);
                    const service = services.find(s => s.id === ev.service_id);

                    // Извлекаем город из адреса школы
                    const city = ev.school_address ? ev.school_address.split(',')[0].trim() : 'Неизвестно';

                    // Отладочная информация для участников
                    if (ev.participants && ev.participants.length > 0) {
                        console.log(`API: Мастер-класс ${ev.id} имеет ${ev.participants.length} участников:`, ev.participants);
                        ev.participants.forEach((participant, index) => {
                            console.log(`API: Участник ${index + 1}:`, {
                                selectedStyles: participant.selectedStyles,
                                selectedOptions: participant.selectedOptions,
                                totalAmount: participant.totalAmount
                            });
                        });
                    }

                    return {
                        id: ev.id,
                        date: ev.date,
                        time: ev.time,
                        schoolId: ev.school_id,
                        classGroup: ev.class_group,
                        serviceId: ev.service_id,
                        executors: ev.executors,
                        notes: ev.notes,
                        participants: ev.participants,
                        statistics: ev.statistics,
                        createdAt: ev.created_at,
                        updatedAt: ev.updated_at,
                        schoolName: ev.school_name || school?.name || `Школа ${ev.school_id}`,
                        serviceName: ev.service_name || service?.name || `Услуга ${ev.service_id}`,
                        city: city,
                    };
                });

                return { masterClasses: mapped, total: response.data.total };
            }
            throw new Error(response.error || 'Failed to get master class events');
        } catch (error) {
            console.error('Error in getEvents:', error);
            throw error;
        }
    },
    getEventById: async (id: string): Promise<MasterClassEventDTO> => {
        const response = await apiRequest<MasterClassEventDTO>(`/master-classes/${id}`);
        if (response.success && response.data) {
            const ev = response.data;
            return {
                id: ev.id,
                date: ev.date,
                time: ev.time,
                school_id: ev.school_id,
                class_group: ev.class_group,
                service_id: ev.service_id,
                executors: ev.executors,
                notes: ev.notes,
                participants: ev.participants,
                statistics: ev.statistics,
                school_address: ev.school_address,
                created_at: ev.created_at,
                updated_at: ev.updated_at,
            };
        }
        throw new Error(response.error || 'Failed to get master class event');
    },
    createEvent: async (data: Record<string, unknown>): Promise<MasterClassEventDTO> => {
        // Отладочная информация для понимания проблемы с датами
        console.log('API createEvent: отправляем данные:', {
            originalData: data,
            dateValue: data.date,
            dateType: typeof data.date,
            parsedDate: data.date ? new Date(data.date as string) : null
        });

        const response = await apiRequest<MasterClassEventDTO>(`/master-classes`, { method: 'POST', body: JSON.stringify(data) });
        if (response.success && response.data) return response.data;
        throw new Error(response.error || 'Failed to create master class event');
    },
    updateEvent: async (id: string, data: Record<string, unknown>): Promise<MasterClassEventDTO> => {
        const response = await apiRequest<MasterClassEventDTO>(`/master-classes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (response.success && response.data) return response.data;
        throw new Error(response.error || 'Failed to update master class event');
    },
    deleteEvent: async (id: string): Promise<void> => {
        const response = await apiRequest(`/master-classes/${id}`, { method: 'DELETE' });
        if (!response.success) throw new Error(response.error || 'Failed to delete master class event');
    },
    // Обновить статус оплаты участника
    updateParticipantPaymentStatus: async (masterClassId: string, participantId: string, isPaid: boolean): Promise<void> => {
        const response = await apiRequest(`/master-classes/${masterClassId}/participants/${participantId}/payment-status`, {
            method: 'PATCH',
            body: JSON.stringify({ isPaid })
        });
        if (!response.success) throw new Error(response.error || 'Failed to update participant payment status');
    }
};

// API для регистраций на мастер-классы
export const workshopRegistrationsAPI = {
    // Получить записи пользователя на мастер-классы
    getUserRegistrations: async (userId: string): Promise<WorkshopRegistration[]> => {
        const response = await apiRequest<{ success: boolean; data: WorkshopRegistration[] }>(`/workshop-registrations/user/${userId}`);

        // Проверяем формат ответа и извлекаем данные
        if (response.success && Array.isArray(response.data)) {
            return response.data;
        }

        throw new Error('Failed to get user workshop registrations - invalid response format');
    },

    // Создать регистрацию на мастер-класс
    createRegistration: async (data: CreateRegistrationData): Promise<WorkshopRegistration> => {
        const response = await apiRequest<WorkshopRegistration>('/workshop-registrations', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // Проверяем, что это объект WorkshopRegistration
        if (response && typeof response === 'object' && 'id' in response && 'workshop_id' in response) {
            return response as unknown as WorkshopRegistration;
        }

        // Если что-то пошло не так, выбрасываем ошибку
        throw new Error('Failed to create workshop registration - invalid response format');
    },

    // Создать групповую регистрацию на мастер-класс (несколько детей, один счет)
    createGroupRegistration: async (data: CreateGroupRegistrationRequest): Promise<{
        invoice: Invoice;
        registrations: WorkshopRegistration[];
        participants: number;
    }> => {
        const response = await apiRequest<{
            invoice: Invoice;
            registrations: WorkshopRegistration[];
            participants: number;
        }>('/workshop-registrations/group', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        // apiRequest возвращает данные напрямую, проверяем формат
        if (response && typeof response === 'object' && 'invoice' in response && 'registrations' in response && 'participants' in response) {
            return {
                invoice: response.invoice as Invoice,
                registrations: response.registrations as WorkshopRegistration[],
                participants: response.participants as number
            };
        }

        throw new Error('Failed to create group workshop registration - invalid response format');
    },

    // Получить регистрации на мастер-класс
    getRegistrations: async (workshopId: string): Promise<WorkshopRegistration[]> => {
        const response = await apiRequest<{ success: boolean; data: WorkshopRegistration[] }>(`/workshop-registrations/${workshopId}`);

        // Проверяем формат ответа и извлекаем данные
        if (response.success && Array.isArray(response.data)) {
            return response.data;
        }

        throw new Error('Failed to get workshop registrations - invalid response format');
    },

    // Получить статистику по мастер-классу
    getWorkshopStats: async (workshopId: string): Promise<WorkshopStats> => {
        const response = await apiRequest<{ success: boolean; data: WorkshopStats }>(`/workshop-registrations/${workshopId}/stats`);

        // Проверяем формат ответа и извлекаем данные
        if (response.success && response.data) {
            return response.data as unknown as WorkshopStats;
        }

        throw new Error('Failed to get workshop stats - invalid response format');
    },

    // Обновить статус регистрации
    updateRegistrationStatus: async (id: string, status: string): Promise<void> => {
        const response = await apiRequest(`/workshop-registrations/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });

        // apiRequest уже разворачивает ответ
        // Если запрос успешен, response должен содержать данные
        if (response && typeof response === 'object') {
            return;
        }

        throw new Error('Failed to update registration status');
    },

    // Удалить регистрацию (для отката транзакций)
    deleteRegistration: async (id: string): Promise<void> => {
        const response = await apiRequest(`/workshop-registrations/${id}`, {
            method: 'DELETE',
        });

        // apiRequest уже разворачивает ответ
        // Если запрос успешен, response должен содержать данные
        if (response && typeof response === 'object') {
            return;
        }

        throw new Error('Failed to delete workshop registration');
    },
};

const invoicesAPI = {
    // Получение списка счетов с фильтрацией
    getInvoices: async (filters: InvoiceFilters = {}): Promise<{ invoices: Invoice[]; total: number }> => {
        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'all') {
                searchParams.append(key, value);
            }
        });

        const response = await fetch(`${API_BASE_URL}/invoices?${searchParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось загрузить счета');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось загрузить счета');
        }

        return data.data;
    },

    // Создание нового счета
    createInvoice: async (invoiceData: CreateInvoiceRequest): Promise<Invoice> => {
        const response = await fetch(`${API_BASE_URL}/invoices`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(invoiceData)
        });

        if (!response.ok) {
            throw new Error('Не удалось создать счет');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось создать счет');
        }

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

    // Синхронизация всех счетов с участниками мастер-класса
    syncAllInvoicesWithParticipants: async (): Promise<{ total: number; synced: number; errors: number }> => {
        const response = await fetch(`${API_BASE_URL}/invoices/sync-participants`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось синхронизировать счета');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось синхронизировать счета');
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

// Экспорт всех API методов
export const api = {
    auth: authAPI,
    schools: schoolsAPI,
    users: usersAPI,
    services: servicesAPI,
    masterClasses: masterClassesAPI,
    masterClassEvents: masterClassEventsAPI,
    workshopRegistrations: workshopRegistrationsAPI,
    invoices: invoicesAPI,

    // HTTP методы для прямых запросов
    get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
        return apiRequest<T>(endpoint, { method: 'GET' });
    },

    post: async <T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> => {
        return apiRequest<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    put: async <T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> => {
        return apiRequest<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    patch: async <T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> => {
        return apiRequest<T>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    delete: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
        return apiRequest<T>(endpoint, { method: 'DELETE' });
    }
};

export default api; 
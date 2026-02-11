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
    CreateInvoiceRequest,
    Offer,
    CreateOfferRequest,
    UpdateOfferRequest,
    OfferFilters,
    ContactData,
    PrivacyPolicy,
    CreatePrivacyPolicyRequest,
    UpdatePrivacyPolicyRequest,
    PrivacyPolicyFilters
} from '../types';
import { MasterClassEvent } from '../types/services';

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
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    };

    // Не устанавливаем Content-Type для FormData - браузер установит его автоматически
    // Для POST запросов всегда устанавливаем Content-Type, даже если нет body
    if (!(options.body instanceof FormData)) {
        if (options.body !== undefined) {
            headers['Content-Type'] = 'application/json';
        } else if ((options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') &&
            !endpoint.includes('/refund/initiate')) {
            // Для POST/PUT/PATCH запросов без body устанавливаем application/json
            // Исключение: роуты возврата не должны иметь Content-Type
            headers['Content-Type'] = 'application/json';
        }
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${API_BASE_URL}${endpoint}`;

    try {
        const response = await fetch(fullUrl, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            // Обработка 401 ошибки (неавторизован)
            if (response.status === 401) {
                removeAuthToken();
                // Можно добавить редирект на страницу входа
                window.location.href = '/login';
                throw new Error('Unauthorized access');
            }

            // Retry логика для 429 ошибок
            if (response.status === 429) {
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

            // Регистрация успешна

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

    // Переключение оплаты для школы
    togglePayment: async (id: string, paymentDisabled: boolean): Promise<School> => {
        const response = await apiRequest<School>(`/schools/${id}/payment`, {
            method: 'PATCH',
            body: JSON.stringify({ paymentDisabled })
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to toggle school payment');
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
    createUser: async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password?: string }): Promise<User> => {
        const response = await apiRequest<User>('/users', {
            method: 'POST',
            body: JSON.stringify(userData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to create user');
    },

    // Создание ребенка (для родителей)
    createChild: async (childData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> => {
        const response = await apiRequest<User>('/users/children', {
            method: 'POST',
            body: JSON.stringify(childData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to create child');
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

    // Удаление ребенка (для родителей и админов)
    deleteChild: async (id: string): Promise<void> => {
        const response = await apiRequest(`/users/children/${id}`, {
            method: 'DELETE',
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to delete child');
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
        surname?: string;
        phone?: string;
        userId?: string;
    }): Promise<{ services: Service[]; total: number }> => {
        const searchParams = new URLSearchParams();
        if (params?.page) searchParams.append('page', params.page.toString());
        if (params?.limit) searchParams.append('limit', params.limit.toString());
        if (params?.category) searchParams.append('category', params.category);
        if (params?.surname) searchParams.append('surname', params.surname);
        if (params?.phone) searchParams.append('phone', params.phone);
        if (params?.userId) searchParams.append('userId', params.userId);

        const response = await apiRequest<{ services: Service[]; total: number }>(
            `/services?${searchParams.toString()}`
        );

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Failed to get services');
    },

    // Получение услуги по ID
    getServiceById: async (id: string, userData?: { surname?: string; phone?: string; userId?: string }): Promise<Service> => {
        const searchParams = new URLSearchParams();
        if (userData?.surname) searchParams.append('surname', userData.surname);
        if (userData?.phone) searchParams.append('phone', userData.phone);
        if (userData?.userId) searchParams.append('userId', userData.userId);

        const url = `/services/${id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
        const response = await apiRequest<Service>(url);

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

        const response = await apiRequest<ServiceStyle>(`/services/${serviceId}/styles/${styleId}`, {
            method: 'PUT',
            body: JSON.stringify(styleData),
        });

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
            files.images.forEach((image) => {
                formData.append('images', image);
            });
        }

        // Добавляем видео
        if (files.videos) {
            files.videos.forEach(video => {
                formData.append('videos', video);
            });
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

    // Массовое создание мастер-классов
    createMultiple: async (data: {
        date: string;
        time: string;
        schoolId: string;
        classGroups: string[];
        serviceId: string;
        executors: string[];
        notes?: string;
    }): Promise<ApiResponse<MasterClassEvent[]>> => {
        const response = await apiRequest<MasterClassEvent[]>('/master-classes/multiple', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        return response;
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

    // Удаление всех мастер-классов школы за дату
    deleteSchoolMasterClasses: async (schoolId: string, date: string): Promise<void> => {
        const response = await apiRequest(`/master-classes/school/${schoolId}/date/${date}`, {
            method: 'DELETE',
        });

        if (!response.success) {
            throw new Error(response.error || 'Failed to delete school master classes');
        }
    },
};

// Тип для статистики мастер-класса
type MasterClassStatisticsDTO = {
    totalParticipants?: number;
    totalAmount?: number;
    paidAmount?: number;
    unpaidAmount?: number;
    stylesStats?: Record<string, number>;
    optionsStats?: Record<string, number>;
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
    statistics: MasterClassStatisticsDTO;
    school_address?: string;
    school_name?: string; // Добавляем название школы
    service_name?: string; // Добавляем название услуги
    // Новые поля для отображения имен исполнителей и данных школы
    executor_names?: string[];
    executors_full?: Array<{
        id: string;
        name: string;
        surname: string;
        fullName: string;
    }>;
    school_data?: {
        teacher?: string;
        teacherPhone?: string;
    };
    created_at: string;
    updated_at: string;
};

export const masterClassEventsAPI = {
    getEvents: async (params?: { schoolId?: string; classGroup?: string; date?: string; userId?: string }): Promise<{ masterClasses: MasterClassEvent[]; total: number }> => {
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

                const mapped = (response.data.masterClasses || []).map(ev => {
                    const school = schools.find(s => s.id === ev.school_id);
                    const service = services.find(s => s.id === ev.service_id);

                    // Извлекаем город из адреса школы
                    const city = ev.school_address ? ev.school_address.split(',')[0].trim() : 'Неизвестно';

                    // Обработка участников
                    if (ev.participants && ev.participants.length > 0) {
                        ev.participants.forEach((participant) => {
                            // Обработка участника
                        });
                    }

                    return {
                        id: ev.id,
                        date: ev.date,
                        time: ev.time,
                        schoolId: ev.school_id,
                        schoolName: ev.school_name || school?.name || `Школа ${ev.school_id}`,
                        city: city,
                        classGroup: ev.class_group,
                        serviceId: ev.service_id,
                        serviceName: ev.service_name || service?.name || `Услуга ${ev.service_id}`,
                        executors: ev.executors,
                        executor_names: ev.executor_names,
                        executors_full: ev.executors_full,
                        notes: ev.notes,
                        participants: ev.participants,
                        statistics: {
                            totalParticipants: ev.statistics?.totalParticipants || 0,
                            totalAmount: ev.statistics?.totalAmount || 0,
                            paidAmount: ev.statistics?.paidAmount || 0,
                            unpaidAmount: ev.statistics?.unpaidAmount || 0,
                            stylesStats: ev.statistics?.stylesStats || {},
                            optionsStats: ev.statistics?.optionsStats || {},
                        },
                        school_data: ev.school_data,
                        createdAt: ev.created_at,
                        updatedAt: ev.updated_at,
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
    getEventById: async (id: string): Promise<MasterClassEvent> => {
        const response = await apiRequest<MasterClassEventDTO>(`/master-classes/${id}`);
        if (response.success && response.data) {
            const ev = response.data;
            return {
                id: ev.id,
                date: ev.date,
                time: ev.time,
                schoolId: ev.school_id,
                schoolName: ev.school_name || 'Школа не указана',
                city: ev.school_address ? ev.school_address.split(',')[0].trim() : 'Не указан',
                classGroup: ev.class_group,
                serviceId: ev.service_id,
                serviceName: ev.service_name || 'Услуга не указана',
                executors: ev.executors,
                executor_names: ev.executor_names,
                executors_full: ev.executors_full,
                notes: ev.notes,
                participants: ev.participants,
                statistics: {
                    totalParticipants: ev.statistics?.totalParticipants || 0,
                    totalAmount: ev.statistics?.totalAmount || 0,
                    paidAmount: ev.statistics?.paidAmount || 0,
                    unpaidAmount: ev.statistics?.unpaidAmount || 0,
                    stylesStats: ev.statistics?.stylesStats || {},
                    optionsStats: ev.statistics?.optionsStats || {},
                },
                school_data: ev.school_data,
                createdAt: ev.created_at,
                updatedAt: ev.updated_at,
            };
        }
        throw new Error(response.error || 'Failed to get master class event');
    },
    createEvent: async (data: Record<string, unknown>): Promise<MasterClassEvent> => {

        const response = await apiRequest<MasterClassEventDTO>(`/master-classes`, { method: 'POST', body: JSON.stringify(data) });
        if (response.success && response.data) {
            const ev = response.data;
            return {
                id: ev.id,
                date: ev.date,
                time: ev.time,
                schoolId: ev.school_id,
                schoolName: ev.school_name || 'Школа не указана',
                city: ev.school_address ? ev.school_address.split(',')[0].trim() : 'Не указан',
                classGroup: ev.class_group,
                serviceId: ev.service_id,
                serviceName: ev.service_name || 'Услуга не указана',
                executors: ev.executors,
                executor_names: ev.executor_names,
                executors_full: ev.executors_full,
                notes: ev.notes,
                participants: ev.participants,
                statistics: {
                    totalParticipants: ev.statistics?.totalParticipants || 0,
                    totalAmount: ev.statistics?.totalAmount || 0,
                    paidAmount: ev.statistics?.paidAmount || 0,
                    unpaidAmount: ev.statistics?.unpaidAmount || 0,
                    stylesStats: ev.statistics?.stylesStats || {},
                    optionsStats: ev.statistics?.optionsStats || {},
                },
                school_data: ev.school_data,
                createdAt: ev.created_at,
                updatedAt: ev.updated_at,
            };
        }
        throw new Error(response.error || 'Failed to create master class event');
    },
    updateEvent: async (id: string, data: Record<string, unknown>): Promise<MasterClassEvent> => {
        const response = await apiRequest<MasterClassEventDTO>(`/master-classes/${id}`, { method: 'PUT', body: JSON.stringify(data) });
        if (response.success && response.data) {
            const ev = response.data;
            return {
                id: ev.id,
                date: ev.date,
                time: ev.time,
                schoolId: ev.school_id,
                schoolName: ev.school_name || 'Школа не указана',
                city: ev.school_address ? ev.school_address.split(',')[0].trim() : 'Не указан',
                classGroup: ev.class_group,
                serviceId: ev.service_id,
                serviceName: ev.service_name || 'Услуга не указана',
                executors: ev.executors,
                executor_names: ev.executor_names,
                executors_full: ev.executors_full,
                notes: ev.notes,
                participants: ev.participants,
                statistics: {
                    totalParticipants: ev.statistics?.totalParticipants || 0,
                    totalAmount: ev.statistics?.totalAmount || 0,
                    paidAmount: ev.statistics?.paidAmount || 0,
                    unpaidAmount: ev.statistics?.unpaidAmount || 0,
                    stylesStats: ev.statistics?.stylesStats || {},
                    optionsStats: ev.statistics?.optionsStats || {},
                },
                school_data: ev.school_data,
                createdAt: ev.created_at,
                updatedAt: ev.updated_at,
            };
        }
        throw new Error(response.error || 'Failed to update master class event');
    },
    deleteEvent: async (id: string): Promise<void> => {
        const response = await apiRequest(`/master-classes/${id}`, { method: 'DELETE' });
        if (!response.success) throw new Error(response.error || 'Failed to delete master class event');
    },
    // Обновить участника в мастер-классе (для родителей)
    updateParticipant: async (masterClassId: string, participantId: string, data: { selectedStyles?: unknown[], selectedOptions?: unknown[], notes?: string }): Promise<MasterClassEvent> => {
        const response = await apiRequest<MasterClassEventDTO>(`/master-classes/${masterClassId}/update-participant-data`, {
            method: 'PATCH',
            body: JSON.stringify({ participantId, ...data })
        });
        if (response.success && response.data) {
            const ev = response.data;
            return {
                id: ev.id,
                date: ev.date,
                time: ev.time,
                schoolId: ev.school_id,
                schoolName: ev.school_name || 'Школа не указана',
                city: ev.school_address ? ev.school_address.split(',')[0].trim() : 'Не указан',
                classGroup: ev.class_group,
                serviceId: ev.service_id,
                serviceName: ev.service_name || 'Услуга не указана',
                executors: ev.executors,
                executor_names: ev.executor_names,
                executors_full: ev.executors_full,
                notes: ev.notes,
                participants: ev.participants,
                statistics: {
                    totalParticipants: ev.statistics?.totalParticipants || 0,
                    totalAmount: ev.statistics?.totalAmount || 0,
                    paidAmount: ev.statistics?.paidAmount || 0,
                    unpaidAmount: ev.statistics?.unpaidAmount || 0,
                    stylesStats: ev.statistics?.stylesStats || {},
                    optionsStats: ev.statistics?.optionsStats || {},
                },
                school_data: ev.school_data,
                createdAt: ev.created_at,
                updatedAt: ev.updated_at,
            };
        }
        throw new Error(response.error || 'Failed to update participant');
    },
    // Обновить статус оплаты участника
    updateParticipantPaymentStatus: async (masterClassId: string, participantId: string, isPaid: boolean): Promise<void> => {
        const response = await apiRequest(`/master-classes/${masterClassId}/participants/${participantId}/payment-status`, {
            method: 'PATCH',
            body: JSON.stringify({ isPaid })
        });
        if (!response.success) throw new Error(response.error || 'Failed to update participant payment status');
    },
    // Удалить все мастер-классы школы за дату
    deleteSchoolMasterClasses: async (schoolId: string, date: string): Promise<void> => {
        const response = await apiRequest(`/master-classes/school/${schoolId}/date/${date}`, { method: 'DELETE' });
        if (!response.success) throw new Error(response.error || 'Failed to delete school master classes');
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

    // Удалить участника с мастер-класса
    removeParticipant: async (workshopId: string, participantId: string): Promise<{ 
        success: boolean; 
        message?: string; 
        updatedStatistics?: MasterClassStatistics;
        deletedParticipant?: unknown;
    }> => {
        const response = await apiRequest('/workshop-registrations/remove-participant', {
            method: 'POST',
            body: JSON.stringify({
                workshopId,
                participantId
            }),
        });

        // apiRequest уже разворачивает ответ
        if (response && typeof response === 'object') {
            return response as { 
                success: boolean; 
                message?: string; 
                updatedStatistics?: MasterClassStatistics;
                deletedParticipant?: unknown;
            };
        }

        throw new Error('Failed to remove participant from workshop');
    }
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

    // Обновление счета (стили, опции, сумма)
    updateInvoice: async (id: string, updateData: {
        selected_styles: Array<{ id: string; name: string; price: number }>;
        selected_options: Array<{ id: string; name: string; price: number }>;
        amount: number;
        notes?: string;
    }): Promise<Invoice> => {
        const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error('Не удалось обновить счет');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось обновить счет');
        }

        return data.data;
    },

    // Удаление счета
    deleteInvoice: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/invoices/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось удалить счет');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось удалить счет');
        }
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

const offersAPI = {
    // Получение текущей активной оферты
    getCurrentOffer: async (): Promise<Offer> => {
        const response = await fetch(`${API_BASE_URL}/offers/current`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось загрузить оферту');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось загрузить оферту');
        }

        return data.data;
    },

    // Получение всех оферт (только для админа)
    getOffers: async (filters: OfferFilters = {}): Promise<Offer[]> => {
        const searchParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                searchParams.append(key, value.toString());
            }
        });

        const response = await fetch(`${API_BASE_URL}/offers?${searchParams.toString()}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось загрузить оферты');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось загрузить оферты');
        }

        return data.data;
    },

    // Создание новой оферты (только для админа)
    createOffer: async (offerData: CreateOfferRequest): Promise<Offer> => {
        const response = await fetch(`${API_BASE_URL}/offers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(offerData)
        });

        if (!response.ok) {
            throw new Error('Не удалось создать оферту');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось создать оферту');
        }

        return data.data;
    },

    // Обновление оферты (только для админа)
    updateOffer: async (id: string, updateData: UpdateOfferRequest): Promise<Offer> => {
        const response = await fetch(`${API_BASE_URL}/offers/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: JSON.stringify(updateData)
        });

        if (!response.ok) {
            throw new Error('Не удалось обновить оферту');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось обновить оферту');
        }

        return data.data;
    },

    // Активация оферты (только для админа)
    activateOffer: async (id: string): Promise<Offer> => {
        const response = await fetch(`${API_BASE_URL}/offers/${id}/activate`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось активировать оферту');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось активировать оферту');
        }

        return data.data;
    },

    // Удаление оферты (только для админа)
    deleteOffer: async (id: string): Promise<void> => {
        const response = await fetch(`${API_BASE_URL}/offers/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось удалить оферту');
        }

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.error || 'Не удалось удалить оферту');
        }
    },

    // Скачивание PDF текущей оферты
    downloadCurrentPdf: async (): Promise<Blob> => {
        const response = await fetch(`${API_BASE_URL}/offers/current/pdf`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось скачать PDF оферты');
        }

        return response.blob();
    },

    // Скачивание PDF оферты по ID (только для админа)
    downloadPdf: async (id: string): Promise<Blob> => {
        const response = await fetch(`${API_BASE_URL}/offers/${id}/pdf`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            }
        });

        if (!response.ok) {
            throw new Error('Не удалось скачать PDF оферты');
        }

        return response.blob();
    }
};

// API методы для Robokassa
const robokassaAPI = {
    // Инициирование возврата
    initiateRefund: async (invoiceId: string, reason: string, email: string): Promise<{ success: boolean; error?: string }> => {
        const response = await apiRequest<{ success: boolean; error?: string }>(`/robokassa/invoices/${invoiceId}/refund/initiate`, {
            method: 'POST',
            body: JSON.stringify({ reason, email })
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Не удалось инициировать возврат');
    },

    // Проверка возможности возврата
    checkRefundAvailability: async (invoiceId: string): Promise<{ canRefund: boolean; reason?: string }> => {
        const response = await apiRequest<{ canRefund: boolean; reason?: string }>(`/robokassa/invoices/${invoiceId}/refund/check`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Не удалось проверить возможность возврата');
    },

    // Получение статуса возврата
    getRefundStatus: async (requestId: string): Promise<{ status: string; amount?: number; date?: string }> => {
        const response = await apiRequest<{ status: string; amount?: number; date?: string }>(`/robokassa/refunds/${requestId}/status`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Не удалось получить статус возврата');
    },

    // Создание возврата
    createRefund: async (invoiceId: string, amount?: number): Promise<{ success: boolean; requestId?: string; error?: string }> => {
        const response = await apiRequest<{ success: boolean; requestId?: string; error?: string }>(`/robokassa/invoices/${invoiceId}/refund`, {
            method: 'POST',
            body: JSON.stringify({ amount }),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Не удалось создать возврат');
    }
};

// API методы для контактов
const contactsAPI = {
    // Получение контактных данных
    getContacts: async (): Promise<ContactData> => {
        const response = await apiRequest<ContactData>('/contacts');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Не удалось получить контактные данные');
    },

    // Обновление контактных данных (только для админа)
    updateContacts: async (contactData: Partial<ContactData>): Promise<ContactData> => {
        const response = await apiRequest<ContactData>('/contacts', {
            method: 'PUT',
            body: JSON.stringify(contactData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Не удалось обновить контактные данные');
    }
};

// API для политики конфиденциальности
const privacyPolicyAPI = {
    // Получение всех политик конфиденциальности
    getAllPolicies: async (): Promise<PrivacyPolicy[]> => {
        const response = await apiRequest<PrivacyPolicy[]>('/privacy-policy');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Не удалось получить политики конфиденциальности');
    },

    // Получение активной политики конфиденциальности
    getCurrentPolicy: async (): Promise<PrivacyPolicy> => {
        const response = await apiRequest<PrivacyPolicy>('/privacy-policy/current');

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Не удалось получить текущую политику конфиденциальности');
    },

    // Получение политики конфиденциальности по ID
    getPolicyById: async (id: string): Promise<PrivacyPolicy> => {
        const response = await apiRequest<PrivacyPolicy>(`/privacy-policy/${id}`);

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Не удалось получить политику конфиденциальности');
    },

    // Создание новой политики конфиденциальности
    createPolicy: async (policyData: CreatePrivacyPolicyRequest): Promise<PrivacyPolicy> => {
        const response = await apiRequest<PrivacyPolicy>('/privacy-policy', {
            method: 'POST',
            body: JSON.stringify(policyData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Не удалось создать политику конфиденциальности');
    },

    // Обновление политики конфиденциальности
    updatePolicy: async (id: string, policyData: UpdatePrivacyPolicyRequest): Promise<PrivacyPolicy> => {
        const response = await apiRequest<PrivacyPolicy>(`/privacy-policy/${id}`, {
            method: 'PUT',
            body: JSON.stringify(policyData),
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Не удалось обновить политику конфиденциальности');
    },

    // Активация политики конфиденциальности
    activatePolicy: async (id: string): Promise<PrivacyPolicy> => {
        const response = await apiRequest<PrivacyPolicy>(`/privacy-policy/${id}/activate`, {
            method: 'PATCH',
        });

        if (response.success && response.data) {
            return response.data;
        }

        throw new Error(response.error || 'Не удалось активировать политику конфиденциальности');
    },

    // Удаление политики конфиденциальности
    deletePolicy: async (id: string): Promise<void> => {
        const response = await apiRequest<void>(`/privacy-policy/${id}`, {
            method: 'DELETE',
        });

        if (!response.success) {
            throw new Error(response.error || 'Не удалось удалить политику конфиденциальности');
        }
    },

    // Скачивание PDF текущей политики конфиденциальности
    downloadCurrentPdf: async (): Promise<Blob> => {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/privacy-policy/current/pdf`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Не удалось скачать PDF политики конфиденциальности');
        }

        return response.blob();
    },

    // Скачивание PDF конкретной политики конфиденциальности
    downloadPolicyPdf: async (id: string): Promise<Blob> => {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/privacy-policy/${id}/pdf`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            throw new Error('Не удалось скачать PDF политики конфиденциальности');
        }

        return response.blob();
    }
};

const paymentSettingsAPI = {
    get: async (): Promise<{ isEnabled: boolean; updatedAt: string | null }> => {
        const response = await apiRequest<{ isEnabled: boolean; updatedAt: string | null }>('/payment-settings');

        if (!response.success || !response.data) {
            throw new Error(response.error || 'Не удалось получить настройки оплаты');
        }

        return {
            isEnabled: response.data.isEnabled,
            updatedAt: response.data.updatedAt
        };
    },

    update: async (payload: { isEnabled: boolean }): Promise<{ isEnabled: boolean; updatedAt: string | null }> => {
        const response = await apiRequest<{ isEnabled: boolean; updatedAt: string | null }>('/payment-settings', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.success || !response.data) {
            throw new Error(response.error || 'Не удалось обновить настройки оплаты');
        }

        return {
            isEnabled: response.data.isEnabled,
            updatedAt: response.data.updatedAt
        };
    }
};

const landingSettingsAPI = {
    get: async (): Promise<{ registrationEnabled: boolean; updatedAt: string | null }> => {
        const response = await apiRequest<{ registrationEnabled: boolean; updatedAt: string | null }>('/landing-settings/public');

        if (!response.success || !response.data) {
            throw new Error(response.error || 'Не удалось получить настройки лендинга');
        }

        return {
            registrationEnabled: response.data.registrationEnabled,
            updatedAt: response.data.updatedAt
        };
    },

    getAdmin: async (): Promise<{ registrationEnabled: boolean; updatedAt: string | null }> => {
        const response = await apiRequest<{ registrationEnabled: boolean; updatedAt: string | null }>('/landing-settings');

        if (!response.success || !response.data) {
            throw new Error(response.error || 'Не удалось получить настройки лендинга');
        }

        return {
            registrationEnabled: response.data.registrationEnabled,
            updatedAt: response.data.updatedAt
        };
    },

    update: async (payload: { registrationEnabled: boolean }): Promise<{ registrationEnabled: boolean; updatedAt: string | null }> => {
        const response = await apiRequest<{ registrationEnabled: boolean; updatedAt: string | null }>('/landing-settings', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.success || !response.data) {
            throw new Error(response.error || 'Не удалось обновить настройки лендинга');
        }

        return {
            registrationEnabled: response.data.registrationEnabled,
            updatedAt: response.data.updatedAt
        };
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
    offers: offersAPI,
    privacyPolicy: privacyPolicyAPI,
    contacts: contactsAPI,
    robokassa: robokassaAPI,
    paymentSettings: paymentSettingsAPI,
    landingSettings: landingSettingsAPI,
    admin: {
        // Получение списка возвратов
        getRefunds: async (): Promise<{ success: boolean; data?: unknown[]; error?: string }> => {
            const response = await apiRequest<unknown[]>(`/admin/refunds`);

            if (response.success && response.data) {
                return { success: true, data: response.data };
            }

            throw new Error(response.error || 'Не удалось загрузить возвраты');
        }
    },

    // HTTP методы для прямых запросов
    get: async <T>(endpoint: string): Promise<ApiResponse<T>> => {
        return apiRequest<T>(endpoint, { method: 'GET' });
    },

    post: async <T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> => {
        // Если data это FormData, не используем JSON.stringify
        if (data instanceof FormData) {
            return apiRequest<T>(endpoint, {
                method: 'POST',
                body: data
            });
        }
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
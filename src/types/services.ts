export interface ServiceStyle {
    id: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    price: number;
    avatar?: string;
    images?: string[];
    videos?: string[];
    // Ограничения видимости
    visibility?: {
        type: 'all' | 'specific_users' | 'specific_surnames' | 'specific_phones';
        restrictions?: {
            surnames?: string[];
            phones?: string[];
            userIds?: string[];
        };
    };
}

export interface ServiceOption {
    id: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    price: number;
    avatar?: string;
    images?: string[];
    videos?: string[];
    // Ограничения видимости
    visibility?: {
        type: 'all' | 'specific_users' | 'specific_surnames' | 'specific_phones';
        restrictions?: {
            surnames?: string[];
            phones?: string[];
            userIds?: string[];
        };
    };
}

export interface Service {
    id: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    styles: ServiceStyle[];
    options: ServiceOption[];
    createdAt: string;
    updatedAt: string;
}

export interface MasterClassParticipant {
    id: string;
    childId: string;
    childName: string;
    parentId: string;
    parentName: string;
    parentPhone?: string; // Телефон родителя
    schoolName?: string; // Название школы ребенка
    selectedStyles: string[];
    selectedOptions: string[];
    totalAmount: number;
    isPaid: boolean;
    hasReceived?: boolean; // Добавляем поле для отслеживания получения услуги
    paymentMethod?: 'cash' | 'card' | 'transfer' | 'robokassa'; // Поддержка: наличные, карта, перевод, Robokassa
    paymentDate?: string;
    notes?: string;
}

export interface MasterClassStatistics {
    totalParticipants: number;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
    cashAmount: number; // Сумма оплаченная наличными
    stylesStats: Record<string, number>;
    optionsStats: Record<string, number>;
}

export interface MasterClassEvent {
    id: string;
    date: string;
    time: string;
    schoolId: string;
    schoolName: string;
    city: string;
    classGroup: string;
    serviceId: string;
    serviceName: string;
    executors: string[];
    executor_names?: string[]; // Имена исполнителей вместо ID
    executors_full?: Array<{ // Полные данные исполнителей
        id: string;
        name: string;
        surname: string;
        fullName: string;
    }>;
    notes?: string;
    participants: MasterClassParticipant[];
    statistics: MasterClassStatistics;
    school_data?: { // Данные школы для контактного лица
        teacher?: string;
        teacherPhone?: string;
    };
    createdAt: string;
    updatedAt: string;
}

// Утилитарная функция для проверки видимости стиля/опции для пользователя
export const isStyleVisibleForUser = (
    style: ServiceStyle,
    userData: { surname?: string; phone?: string; userId?: string }
): boolean => {
    if (!style.visibility || style.visibility.type === 'all') {
        return true;
    }

    const { type, restrictions } = style.visibility;

    if (!restrictions) return true;

    switch (type) {
        case 'specific_surnames':
            return restrictions.surnames?.includes(userData.surname || '') || false;

        case 'specific_phones':
            return restrictions.phones?.includes(userData.phone || '') || false;

        case 'specific_users':
            return restrictions.userIds?.includes(userData.userId || '') || false;

        default:
            return true;
    }
};

export const isOptionVisibleForUser = (
    option: ServiceOption,
    userData: { surname?: string; phone?: string; userId?: string }
): boolean => {
    if (!option.visibility || option.visibility.type === 'all') {
        return true;
    }

    const { type, restrictions } = option.visibility;

    if (!restrictions) return true;

    switch (type) {
        case 'specific_surnames':
            return restrictions.surnames?.includes(userData.surname || '') || false;

        case 'specific_phones':
            return restrictions.phones?.includes(userData.phone || '') || false;

        case 'specific_users':
            return restrictions.userIds?.includes(userData.userId || '') || false;

        default:
            return true;
    }
}; 
export interface ServiceStyle {
    id: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    price: number;
    avatar?: string;
    images?: string[];
    videos?: string[];
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
    selectedStyles: string[];
    selectedOptions: string[];
    totalAmount: number;
    isPaid: boolean;
    hasReceived?: boolean; // Добавляем поле для отслеживания получения услуги
    paymentMethod?: 'cash' | 'transfer';
    paymentDate?: string;
    notes?: string;
}

export interface MasterClassStatistics {
    totalParticipants: number;
    totalAmount: number;
    paidAmount: number;
    unpaidAmount: number;
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
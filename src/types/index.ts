// Основные типы пользователей согласно документации
export type UserRole = 'admin' | 'parent' | 'child' | 'executor';

export interface User {
    id: string;
    name: string;
    surname?: string;
    role: UserRole;
    email?: string;
    phone?: string;
    age?: number; // Добавляем поле возраста
    schoolId?: string;
    schoolName?: string;
    class?: string;
    parentId?: string; // ID родителя для детей
    children?: User[]; // Дети для родителей
    parent?: User; // Родитель для детей
    createdAt?: string;
    updatedAt?: string;
}

// Типы школ согласно документации
export interface School {
    id: string;
    name: string;
    address: string;
    classes: string[];
    teacher?: string;
    teacherPhone?: string;
    notes?: string;
    paymentDisabled?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface SchoolWithAddress {
    id: string;
    name: string;
    address: string;
    classes: string[];
}

// Типы услуг согласно документации
export interface ServiceStyle {
    id: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    price: number;
    images?: string[];
    videos?: string[];
}

export interface ServiceOption {
    id: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    price: number;
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

// Типы мастер-классов согласно документации
export interface MasterClass {
    id: string;
    name: string;
    shortDescription: string;
    fullDescription: string;
    price: number;
    duration: string;
    maxParticipants: number;
    avatar?: string;
    images?: string[];
    video?: string;
    schedule: string[];
    createdAt: string;
    updatedAt: string;
}

// API типы
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface LoginResponse {
    user: User;
    token: string;
}

export interface LoginCredentials {
    name?: string; // Для детей и администратора
    username?: string; // Альтернативное поле для имени (для совместимости)
    surname?: string; // Для родителей
    phone?: string; // Для родителей
    schoolId?: string; // Для детей
    class?: string; // Для детей
    password?: string; // Для администратора
    role: UserRole;
}

// Новые типы для семейной регистрации
export interface ChildData {
    name: string;
    surname?: string;
    age?: number; // Добавляем поле возраста
    schoolId: string;
    class: string;
}

export interface FamilyRegistrationData {
    parent: {
        name: string;
        phone: string;
    };
    children: ChildData[];
}

export interface SingleChildRegistrationData {
    name: string;
    surname: string;
    age?: number; // Добавляем поле возраста
    schoolId: string;
    class: string;
}

// Обновленные типы для регистрации
export interface RegisterData {
    name: string;
    surname?: string;
    role: UserRole;
    phone?: string;
    email?: string;
    password?: string;
    schoolId?: string;
    class?: string;
    // Новые поля для семейной регистрации
    children?: ChildData[];
    parentId?: string;
}

export interface JwtPayload {
    userId: string;
    role: UserRole;
    iat?: number;
    exp?: number;
}

// Типы для регистраций на мастер-классы
export interface WorkshopRegistration {
    id: string;
    workshopId: string;
    userId: string;
    userName: string;
    userClass: string;
    schoolName: string;
    style: string;
    options: string[];
    totalPrice: number;
    status: 'pending' | 'confirmed' | 'cancelled';
    notes?: string; // Примечания к заказу
    createdAt: string;
    updatedAt: string;
}

export interface CreateRegistrationData {
    workshopId: string;
    userId: string;
    style: string;
    options: string[];
    totalPrice: number;
}

export interface WorkshopStats {
    workshopId: string;
    workshopTitle: string;
    totalRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    totalRevenue: number;
    maxParticipants: number;
    currentParticipants: number;
    isFull: boolean;
}

// Типы для счетов мастер-классов
export interface Invoice {
    id: string;
    master_class_id: string;
    workshop_date: string;
    city: string;
    school_name: string;
    class_group: string;
    participant_name: string;
    participant_id: string;
    amount: number;
    status: 'pending' | 'paid' | 'cancelled';
    selected_styles: Array<{
        id: string;
        name: string;
        price: number;
    }>;
    selected_options: Array<{
        id: string;
        name: string;
        price: number;
    }>;
    notes?: string;
    created_at: string;
    updated_at: string;
    master_class_name?: string;
    master_class_description?: string;
    payment_id?: string;
    payment_method?: string;
    payment_date?: string;
    payment_label?: string;
    sender_phone?: string;
    participant_email?: string;
    refund_status?: 'none' | 'pending' | 'completed' | 'cancelled' | 'failed';
    refund_reason?: string;
    refund_email?: string;
    refund_request_id?: string;
}

export interface CreateInvoiceRequest {
    master_class_id: string;
    workshop_date: string;
    city: string;
    school_name: string;
    class_group: string;
    participant_name: string;
    participant_id: string;
    amount: number;
    selected_styles: Array<{
        id: string;
        name: string;
        price: number;
    }>;
    selected_options: Array<{
        id: string;
        name: string;
        price: number;
    }>;
    notes?: string;
}

// Новый тип для группового счета
export interface CreateGroupInvoiceRequest {
    master_class_id: string;
    workshop_date: string;
    city: string;
    school_name: string;
    class_group: string;
    parent_id: string;
    parent_name: string;
    children: Array<{
        child_id: string;
        child_name: string;
        selected_styles: Array<{
            id: string;
            name: string;
            price: number;
        }>;
        selected_options: Array<{
            id: string;
            name: string;
            price: number;
        }>;
        individual_amount: number;
    }>;
    total_amount: number;
}

// Новый тип для групповой регистрации
export interface CreateGroupRegistrationRequest {
    workshopId: string;
    parentId: string;
    children: Array<{
        childId: string;
        childName: string;
        style: string;
        options: string[];
        totalPrice: number;
    }>;
}

export interface InvoiceFilters {
    city?: string;
    school_name?: string;
    class_group?: string;
    workshop_date?: string;
    status?: 'all' | 'pending' | 'paid' | 'cancelled';
    participant_id?: string;
    master_class_id?: string;
}

// Типы для заявок на проведение мастер-классов
export interface WorkshopRequest {
    id: string;
    parent_id: string;
    school_name: string;
    class_group: string;
    desired_date?: string; // Сделаем опциональным
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    admin_notes?: string;
    admin_id?: string;
    // Новые поля
    city?: string;
    is_other_school?: boolean;
    other_school_name?: string;
    other_school_address?: string;
}

export interface CreateWorkshopRequestData {
    parent_id: string;
    school_name: string;
    class_group: string;
    desired_date?: string; // Сделаем опциональным
    notes?: string;
    // Новые поля
    city?: string;
    is_other_school?: boolean;
    other_school_name?: string;
    other_school_address?: string;
}

export interface UpdateWorkshopRequestData {
    status?: 'pending' | 'approved' | 'rejected';
    admin_notes?: string;
}

export interface WorkshopRequestWithParent extends WorkshopRequest {
    parent_name: string;
    parent_surname?: string;
    parent_phone?: string;
    parent_email: string;
    admin_name?: string;
}

// Типы для оферт
export interface Offer {
    id: string;
    title: string;
    content: string;
    version: string;
    is_active: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CreateOfferRequest {
    title: string;
    content: string;
    version: string;
}

export interface UpdateOfferRequest {
    title?: string;
    content?: string;
    version?: string;
}

export interface OfferFilters {
    is_active?: boolean;
    version?: string;
    created_by?: string;
}

// Типы для контактов
export interface ContactData {
    id: string;
    company_name: string;
    legal_status: string;
    inn: string;
    phone: string;
    email: string;
    address?: string;
    website?: string;
    created_at: string;
    updated_at: string;
}

// Типы для политики конфиденциальности
export interface PrivacyPolicy {
    id: string;
    title: string;
    content: string;
    version: string;
    is_active: boolean;
    created_by: string;
    created_at: string;
    updated_at: string;
}

export interface CreatePrivacyPolicyRequest {
    title: string;
    content: string;
    version: string;
}

export interface UpdatePrivacyPolicyRequest {
    title?: string;
    content?: string;
    version?: string;
}

export interface PrivacyPolicyFilters {
    is_active?: boolean;
    version?: string;
    created_by?: string;
} 
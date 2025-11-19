export type UserRole = "admin" | "parent" | "child" | "executor";
export interface User {
    id: string;
    name: string;
    surname?: string;
    role: UserRole;
    email?: string;
    phone?: string;
    password_hash?: string;
    age?: number;
    school_id?: string;
    school_name?: string;
    class?: string;
    class_group?: string;
    parent_id?: string;
    created_at: string;
    updated_at: string;
}
export interface School {
    id: string;
    name: string;
    address: string;
    classes: string[];
    teacher?: string;
    teacherPhone?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
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
    createdAt: Date;
    updatedAt: Date;
}
export interface MasterClass {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    maxParticipants: number;
    materials: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface Order {
    id: string;
    userId: string;
    serviceId?: string;
    masterClassId?: string;
    status: "pending" | "confirmed" | "completed" | "cancelled";
    totalPrice: number;
    scheduledDate?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface LoginCredentials {
    name?: string;
    surname?: string;
    phone?: string;
    schoolId?: string;
    class?: string;
    password?: string;
    role: UserRole;
}
export interface RegisterData {
    name: string;
    surname?: string;
    age?: number;
    role: UserRole;
    phone?: string;
    email?: string;
    password?: string;
    schoolId?: string;
    schoolName?: string;
    class?: string;
    children?: ChildData[];
    parentId?: string;
}
export interface JwtPayload {
    userId: string;
    role: UserRole;
    iat: number;
    exp: number;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}
export interface PaginationParams {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export interface PaginatedResponse<T> {
    data: T[];
    total: number;
}
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
    createdAt: Date;
    updatedAt: Date;
}
export interface CreateWorkshopRegistrationRequest {
    workshopId: string;
    userId: string;
    style: string;
    options: string[];
    totalPrice: number;
    notes?: string;
}
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
    created_at: string;
    updated_at: string;
    payment_id?: string;
    payment_method?: string;
    notes?: string;
    payment_date?: string;
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
    page?: number;
    limit?: number;
}
export interface ChildData {
    name: string;
    surname: string;
    age?: number;
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
    schoolId: string;
    class: string;
}
export interface WorkshopRequest {
    id: string;
    parent_id: string;
    school_name: string;
    class_group: string;
    desired_date?: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    admin_notes?: string;
    admin_id?: string;
    city?: string;
    is_other_school?: boolean;
    other_school_name?: string;
    other_school_address?: string;
}
export interface CreateWorkshopRequestData {
    parent_id: string;
    school_name: string;
    class_group: string;
    desired_date?: string;
    notes?: string;
    city?: string;
    is_other_school?: boolean;
    other_school_name?: string;
    other_school_address?: string;
}
export interface UpdateWorkshopRequestData {
    status?: 'pending' | 'approved' | 'rejected';
    admin_notes?: string;
}
export interface WorkshopRequestWithParent {
    id: string;
    parent_id: string;
    parent_name: string;
    parent_surname?: string;
    parent_phone?: string;
    parent_email: string;
    school_name: string;
    class_group: string;
    desired_date: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    admin_notes?: string;
    admin_id?: string;
    admin_name?: string;
}
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
//# sourceMappingURL=index.d.ts.map
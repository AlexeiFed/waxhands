/**
 * @file: backend/src/types/workshop-requests.ts
 * @description: Типы для заявок на проведение мастер-классов
 * @dependencies: index.ts
 * @created: 2024-12-19
 */

export interface WorkshopRequest {
    id: string;
    parent_id: string;
    school_name: string;
    class_group: string;
    desired_date: string;
    notes?: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    updated_at: string;
    admin_notes?: string;
    admin_id?: string;
}

export interface CreateWorkshopRequestData {
    parent_id: string;
    school_name: string;
    class_group: string;
    desired_date: string;
    notes?: string;
}

export interface UpdateWorkshopRequestData {
    status?: 'pending' | 'approved' | 'rejected';
    admin_notes?: string;
}

export interface WorkshopRequestWithParent {
    id: string;
    parent_id: string;
    parent_name: string;
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

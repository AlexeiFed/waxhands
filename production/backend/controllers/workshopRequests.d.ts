/**
 * @file: backend/src/controllers/workshopRequests.ts
 * @description: Контроллер для управления заявками на проведение мастер-классов
 * @dependencies: connection.ts, types/workshop-requests.ts
 * @created: 2024-12-19
 */
import { CreateWorkshopRequestData, UpdateWorkshopRequestData, WorkshopRequestWithParent, ApiResponse } from '../types';
export declare class WorkshopRequestsController {
    private static getAdminId;
    static createRequest(data: CreateWorkshopRequestData): Promise<ApiResponse<WorkshopRequestWithParent>>;
    static getRequestById(id: string): Promise<WorkshopRequestWithParent | null>;
    static getAllRequests(): Promise<ApiResponse<WorkshopRequestWithParent[]>>;
    static getRequestsByParentId(parentId: string): Promise<ApiResponse<WorkshopRequestWithParent[]>>;
    static updateRequestStatus(id: string, data: UpdateWorkshopRequestData): Promise<ApiResponse<WorkshopRequestWithParent>>;
    static deleteRequest(id: string): Promise<ApiResponse<boolean>>;
    static getRequestsStats(): Promise<ApiResponse<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    }>>;
    static getRequestsStatsByParentId(parentId: string): Promise<ApiResponse<{
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    }>>;
}
//# sourceMappingURL=workshopRequests.d.ts.map
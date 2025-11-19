/**
 * @file: workshopRegistrations.ts
 * @description: Контроллер для управления записями на мастер-классы
 * @dependencies: database, types
 * @created: 2024-12-19
 */
import { Request, Response } from 'express';
export declare const getUserWorkshopRegistrations: (req: Request, res: Response) => Promise<void>;
export declare const getWorkshopRegistrations: (req: Request, res: Response) => Promise<void>;
export declare const createWorkshopRegistration: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const createGroupWorkshopRegistration: (req: Request, res: Response) => Promise<void>;
export declare const updateRegistrationStatus: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getWorkshopStats: (workshopId: string) => Promise<{
    workshopId: string;
    workshopTitle: any;
    totalRegistrations: number;
    confirmedRegistrations: number;
    pendingRegistrations: number;
    totalRevenue: any;
    maxParticipants: number;
    currentParticipants: number;
    isFull: boolean;
}>;
export declare const checkRegistration: (req: Request, res: Response) => Promise<void>;
export declare const removeParticipant: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
//# sourceMappingURL=workshopRegistrations.d.ts.map
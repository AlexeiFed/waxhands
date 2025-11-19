/**
 * @file: invoices.ts
 * @description: Контроллер для управления счетами мастер-классов
 * @dependencies: types/index.ts, database/connection.ts
 * @created: 2024-12-19
 */
import { Request, Response } from 'express';
import { UserRole } from '../types/index.js';
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        role: UserRole;
        email?: string;
        iat: number;
        exp: number;
    };
}
export declare const createInvoice: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getInvoices: (req: Request, res: Response) => Promise<void>;
export declare const getInvoiceById: (req: Request, res: Response) => Promise<void>;
export declare const updateInvoice: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updateInvoiceStatus: (req: Request, res: Response) => Promise<void>;
export declare const getInvoicesByDate: (req: Request, res: Response) => Promise<void>;
export declare const deleteInvoice: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const syncAllInvoicesWithParticipants: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=invoices.d.ts.map
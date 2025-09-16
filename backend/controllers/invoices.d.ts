/**
 * @file: invoices.ts
 * @description: Контроллер для управления счетами мастер-классов
 * @dependencies: types/index.ts, database/connection.ts
 * @created: 2024-12-19
 */
import { Request, Response } from 'express';
export declare const createInvoice: (req: Request, res: Response) => Promise<void>;
export declare const getInvoices: (req: Request, res: Response) => Promise<void>;
export declare const getInvoiceById: (req: Request, res: Response) => Promise<void>;
export declare const updateInvoice: (req: Request, res: Response) => Promise<void>;
export declare const updateInvoiceStatus: (req: Request, res: Response) => Promise<void>;
export declare const getInvoicesByDate: (req: Request, res: Response) => Promise<void>;
export declare const deleteInvoice: (req: Request, res: Response) => Promise<void>;
export declare const syncAllInvoicesWithParticipants: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=invoices.d.ts.map
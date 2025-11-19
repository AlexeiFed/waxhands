/**
 * @file: backend/src/controllers/chat.ts
 * @description: Контроллер для управления чатом между пользователями и администраторами
 * @dependencies: database/connection.ts, types/chat.ts
 * @created: 2024-12-19
 */
import { Request, Response } from 'express';
interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        role: UserRole;
        iat: number;
        exp: number;
    };
}
import { CreateChatRequest, UpdateChatStatusRequest, MarkAsReadRequest } from '../types/chat.js';
import { UserRole } from '../types/index.js';
export declare class ChatController {
    static createChat(req: Request<Record<string, never>, Record<string, never>, CreateChatRequest>, res: Response): Promise<Response | void>;
    static getUserChats(req: Request, res: Response): Promise<Response | void>;
    static getAllChats(req: Request, res: Response): Promise<Response | void>;
    static getChatMessages(req: Request, res: Response): Promise<Response | void>;
    static sendMessage(req: AuthenticatedRequest, res: Response): Promise<Response | void>;
    static markAsRead(req: Request<Record<string, never>, Record<string, never>, MarkAsReadRequest>, res: Response): Promise<Response | void>;
    static markMessageAsRead(req: Request<Record<string, never>, Record<string, never>, {
        messageId: string;
        chatId: string;
        readerId: string;
        readerRole: string;
    }>, res: Response): Promise<Response | void>;
    static updateChatStatus(req: Request<Record<string, never>, Record<string, never>, UpdateChatStatusRequest>, res: Response): Promise<Response | void>;
    static getUnreadCount(req: Request, res: Response): Promise<Response | void>;
}
export {};
//# sourceMappingURL=chat.d.ts.map
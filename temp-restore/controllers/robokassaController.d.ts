/**
 * @file: robokassaController.ts
 * @description: Контроллер для интеграции с Robokassa
 * @dependencies: robokassaService.ts, types/robokassa.ts
 * @created: 2025-01-26
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
/**
 * Создает данные для iframe оплаты через Robokassa
 */
export declare const createIframePaymentData: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Создает ссылку на оплату через Robokassa
 */
export declare const createPaymentLink: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Обрабатывает возврат пользователя после успешной оплаты (SuccessURL)
 */
export declare const handleSuccessRedirect: (req: Request, res: Response) => Promise<void>;
/**
 * Обрабатывает возврат пользователя при отказе от оплаты (FailURL)
 */
export declare const handleFailRedirect: (req: Request, res: Response) => Promise<void>;
/**
 * Обрабатывает уведомления от Robokassa (ResultURL)
 */
export declare const handleResultNotification: (req: Request, res: Response) => Promise<void>;
/**
 * Обрабатывает JWS уведомления от Robokassa (ResultURL2)
 */
export declare const handleJWSNotification: (req: Request, res: Response) => Promise<void>;
/**
 * Инициирует возврат средств
 */
export declare const createRefund: (req: AuthenticatedRequest, res: Response) => Promise<void>;
/**
 * Получает статус возврата
 */
export declare const getRefundStatus: (req: Request, res: Response) => Promise<void>;
export {};
//# sourceMappingURL=robokassaController.d.ts.map
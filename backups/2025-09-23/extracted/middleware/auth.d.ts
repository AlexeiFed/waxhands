import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../types/index.js';
declare module 'express' {
    interface Request {
        user?: JwtPayload;
    }
}
export declare const authenticateToken: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorizeAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorizeParentOrAdmin: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorizeRoles: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const authorizeChild: (req: Request, res: Response, next: NextFunction) => void;
export declare const authorizeExecutor: (req: Request, res: Response, next: NextFunction) => void;
export declare const requireRole: (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export declare const authorizeResourceOwner: (resourceUserIdField?: string) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const logRequest: (req: Request, res: Response, next: NextFunction) => void;
export declare const errorHandler: (err: Error, req: Request, res: Response, next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=auth.d.ts.map
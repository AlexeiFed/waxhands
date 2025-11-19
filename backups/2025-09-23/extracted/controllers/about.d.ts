/**
 * @file: about.ts
 * @description: Контроллер для управления контентом страницы "О нас"
 * @dependencies: database/connection.ts, types/about.ts
 * @created: 2024-12-19
 */
import { Request, Response } from 'express';
export declare class AboutController {
    static getContent(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateContent(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static getMedia(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static addMedia(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static updateMedia(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static deleteMedia(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    static reorderMedia(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
//# sourceMappingURL=about.d.ts.map
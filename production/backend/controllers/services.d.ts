import { Request, Response } from 'express';
export declare const getServices: (req: Request, res: Response) => Promise<void>;
export declare const getServiceById: (req: Request, res: Response) => Promise<void>;
export declare const createService: (req: Request, res: Response) => Promise<void>;
export declare const updateService: (req: Request, res: Response) => Promise<void>;
export declare const deleteService: (req: Request, res: Response) => Promise<void>;
export declare const addStyleToService: (req: Request, res: Response) => Promise<void>;
export declare const addOptionToService: (req: Request, res: Response) => Promise<void>;
export declare const updateServiceStyle: (req: Request, res: Response) => Promise<void>;
export declare const updateServiceOption: (req: Request, res: Response) => Promise<void>;
export declare const reorderServiceStyles: (req: Request, res: Response) => Promise<void>;
export declare const reorderServiceOptions: (req: Request, res: Response) => Promise<void>;
export declare const getServiceMedia: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=services.d.ts.map
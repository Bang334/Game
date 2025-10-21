import { Request, Response } from 'express';
export declare class UserController {
    /**
     * Get user profile
     */
    static getProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Update user profile
     */
    static updateProfile(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get all users (Admin only)
     */
    static getAllUsers(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=userController.d.ts.map
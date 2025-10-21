import { Request, Response } from 'express';
export declare class PurchaseController {
    /**
     * Get user's purchases
     */
    static getUserPurchases(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Create a new purchase
     */
    static createPurchase(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get all purchases (Admin only)
     */
    static getAllPurchases(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=purchaseController.d.ts.map
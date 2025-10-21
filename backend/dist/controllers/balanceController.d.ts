import { Request, Response } from 'express';
export declare class BalanceController {
    /**
     * Get user's balance transactions
     */
    static getUserTransactions(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Request deposit
     */
    static requestDeposit(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get user's pending deposits
     */
    static getUserPendingDeposits(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get all deposit requests (Admin only)
     */
    static getAllDepositRequests(req: Request, res: Response): Promise<void>;
    /**
     * Approve deposit request (Admin only)
     */
    static approveDeposit(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Reject deposit request (Admin only)
     */
    static rejectDeposit(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=balanceController.d.ts.map
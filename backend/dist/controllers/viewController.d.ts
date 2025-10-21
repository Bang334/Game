import { Request, Response } from 'express';
export declare class ViewController {
    /**
     * Get user's viewed games
     */
    static getUserViewedGames(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Add view to game
     */
    static addView(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Remove view from game
     */
    static removeView(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=viewController.d.ts.map
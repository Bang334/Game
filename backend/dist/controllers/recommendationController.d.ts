import { Request, Response } from 'express';
export declare class RecommendationController {
    /**
     * Prepare data for AI service
     */
    private static prepareGameData;
    /**
     * Prepare user data for AI service
     */
    private static prepareUserData;
    /**
     * Get AI-powered game recommendations
     */
    static getRecommendations(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Health check for AI service
     */
    static checkAIServiceHealth(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=recommendationController.d.ts.map
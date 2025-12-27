import { Request, Response } from 'express';
export declare class SimilarGamesController {
    /**
     * Get similar games for a specific game
     */
    static getSimilarGames(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Prepare games data for AI service
     */
    private static prepareGameData;
}
//# sourceMappingURL=similarGamesController.d.ts.map
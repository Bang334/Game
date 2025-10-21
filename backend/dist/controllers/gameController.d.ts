import { Request, Response } from 'express';
export declare class GameController {
    /**
     * Get all games with filters and pagination
     */
    static getAllGames(req: Request, res: Response): Promise<void>;
    /**
     * Get game by ID with full details
     */
    static getGameById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get top downloaded games
     */
    static getTopDownloaded(req: Request, res: Response): Promise<void>;
    /**
     * Get top rated games
     */
    static getTopRated(req: Request, res: Response): Promise<void>;
    /**
     * Get all genres
     */
    static getAllGenres(req: Request, res: Response): Promise<void>;
    /**
     * Get all platforms
     */
    static getAllPlatforms(req: Request, res: Response): Promise<void>;
    /**
     * Get all publishers
     */
    static getAllPublishers(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=gameController.d.ts.map
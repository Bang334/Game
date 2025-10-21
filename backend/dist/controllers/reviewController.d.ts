import { Request, Response } from 'express';
export declare class ReviewController {
    /**
     * Get user's reviews
     */
    static getUserReviews(req: Request, res: Response): Promise<void>;
    /**
     * Get reviews for a game
     */
    static getGameReviews(req: Request, res: Response): Promise<void>;
    /**
     * Create or update review for a game
     */
    static createOrUpdateReview(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Update an existing review
     */
    static updateReview(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Delete a review
     */
    static deleteReview(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get user's rating for a specific game
     */
    static getUserRatingForGame(req: Request, res: Response): Promise<void>;
    /**
     * Create or update rating (same as review but different endpoint)
     */
    static createOrUpdateRating(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get all reviews (Admin only)
     */
    static getAllReviews(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=reviewController.d.ts.map
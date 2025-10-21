import { Request, Response } from 'express';
export declare class WishlistController {
    /**
     * Get user's wishlist
     */
    static getUserWishlist(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Add game to wishlist
     */
    static addToWishlist(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Remove game from wishlist by wishlist_id
     */
    static removeFromWishlistById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Remove game from wishlist by game_id
     */
    static removeFromWishlistByGameId(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
}
//# sourceMappingURL=wishlistController.d.ts.map
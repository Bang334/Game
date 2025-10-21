"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WishlistController = void 0;
const models_1 = require("../models");
class WishlistController {
    /**
     * Get user's wishlist
     */
    static async getUserWishlist(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return res.status(401).json({ error: 'UNAUTHORIZED' });
            }
            const wishlist = await models_1.WishlistModel.findByUserIdWithDetails(userId);
            res.json({ wishlist });
        }
        catch (error) {
            console.error('Error in getUserWishlist:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Add game to wishlist
     */
    static async addToWishlist(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return res.status(401).json({ error: 'UNAUTHORIZED' });
            }
            const { game_id } = req.body;
            if (!game_id) {
                return res.status(400).json({ error: 'GAME_ID_REQUIRED' });
            }
            // Check if already in wishlist
            const existing = await models_1.WishlistModel.findByUserAndGame(userId, game_id);
            if (existing) {
                return res.status(400).json({ error: 'ALREADY_IN_WISHLIST' });
            }
            const wishlistId = await models_1.WishlistModel.create({ user_id: userId, game_id });
            res.status(201).json({ created: true, wishlist_id: wishlistId });
        }
        catch (error) {
            console.error('Error in addToWishlist:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Remove game from wishlist by wishlist_id
     */
    static async removeFromWishlistById(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return res.status(401).json({ error: 'UNAUTHORIZED' });
            }
            const wishlistId = parseInt(req.params.id || '0');
            // Check if wishlist item exists and belongs to user
            const existing = await models_1.WishlistModel.findById(wishlistId);
            if (!existing || existing.user_id !== userId) {
                return res.status(404).json({ error: 'WISHLIST_ITEM_NOT_FOUND' });
            }
            const success = await models_1.WishlistModel.delete(wishlistId);
            if (!success) {
                return res.status(400).json({ error: 'DELETE_FAILED' });
            }
            res.json({ deleted: true });
        }
        catch (error) {
            console.error('Error in removeFromWishlistById:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Remove game from wishlist by game_id
     */
    static async removeFromWishlistByGameId(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return res.status(401).json({ error: 'UNAUTHORIZED' });
            }
            const gameId = parseInt(req.params.gameId || '0');
            const success = await models_1.WishlistModel.removeFromWishlist(userId, gameId);
            if (success) {
                res.json({ removed: true });
            }
            else {
                res.status(404).json({ error: 'WISHLIST_ITEM_NOT_FOUND' });
            }
        }
        catch (error) {
            console.error('Error in removeFromWishlistByGameId:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
}
exports.WishlistController = WishlistController;
//# sourceMappingURL=wishlistController.js.map
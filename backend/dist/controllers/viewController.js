"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewController = void 0;
const models_1 = require("../models");
class ViewController {
    /**
     * Get user's viewed games
     */
    static async getUserViewedGames(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return res.status(401).json({ error: 'UNAUTHORIZED' });
            }
            const games = await models_1.ViewModel.findByUserIdWithDetails(userId);
            res.json({ games });
        }
        catch (error) {
            console.error('Error in getUserViewedGames:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Add view to game
     */
    static async addView(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return res.status(401).json({ error: 'UNAUTHORIZED' });
            }
            const gameId = parseInt(req.params.id || '0');
            if (!gameId) {
                return res.status(400).json({ error: 'INVALID_GAME_ID' });
            }
            // Check if user exists
            const user = await models_1.UserModel.findById(userId);
            if (!user) {
                return res.status(401).json({ error: 'USER_NOT_FOUND' });
            }
            // Check if game exists
            const game = await models_1.GameModel.findById(gameId);
            if (!game) {
                return res.status(404).json({ error: 'GAME_NOT_FOUND' });
            }
            const viewId = await models_1.ViewModel.addView(userId, gameId);
            res.status(201).json({ added: true, view_id: viewId });
        }
        catch (error) {
            console.error('Error in addView:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Remove view from game
     */
    static async removeView(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return res.status(401).json({ error: 'UNAUTHORIZED' });
            }
            const gameId = parseInt(req.params.gameId || '0');
            const success = await models_1.ViewModel.deleteByUserAndGame(userId, gameId);
            if (success) {
                res.json({ removed: true });
            }
            else {
                res.status(404).json({ error: 'VIEW_NOT_FOUND' });
            }
        }
        catch (error) {
            console.error('Error in removeView:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
}
exports.ViewController = ViewController;
//# sourceMappingURL=viewController.js.map
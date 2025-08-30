"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me';
function requireAdmin(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token)
        return res.status(401).json({ error: 'UNAUTHORIZED' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded?.role !== 'ADMIN')
            return res.status(403).json({ error: 'FORBIDDEN' });
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({ error: 'UNAUTHORIZED' });
    }
}
const router = (0, express_1.Router)();
// Game Management
router.get('/games', requireAdmin, async (_req, res) => {
    try {
        const games = await models_1.GameModel.findAllWithPublisher();
        res.json({ games });
    }
    catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
router.get('/games/:id', requireAdmin, async (req, res) => {
    try {
        const gameId = parseInt(req.params.id || '0');
        const game = await models_1.GameModel.findByIdWithDetails(gameId);
        if (!game) {
            return res.status(404).json({ error: 'GAME_NOT_FOUND' });
        }
        res.json({ game });
    }
    catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
router.post('/games', requireAdmin, async (req, res) => {
    try {
        const gameData = req.body;
        const gameId = await models_1.GameModel.create(gameData);
        res.status(201).json({ created: true, game_id: gameId });
    }
    catch (error) {
        console.error('Error creating game:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
router.put('/games/:id', requireAdmin, async (req, res) => {
    try {
        const gameId = parseInt(req.params.id || '0');
        const updateData = req.body;
        const success = await models_1.GameModel.update(gameId, updateData);
        if (success) {
            res.json({ updated: true });
        }
        else {
            res.status(404).json({ error: 'GAME_NOT_FOUND' });
        }
    }
    catch (error) {
        console.error('Error updating game:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
router.delete('/games/:id', requireAdmin, async (req, res) => {
    try {
        const gameId = parseInt(req.params.id || '0');
        const success = await models_1.GameModel.delete(gameId);
        if (success) {
            res.json({ deleted: true });
        }
        else {
            res.status(404).json({ error: 'GAME_NOT_FOUND' });
        }
    }
    catch (error) {
        console.error('Error deleting game:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// User Management
router.get('/users', requireAdmin, async (_req, res) => {
    try {
        const users = await models_1.UserModel.findAllWithRole();
        res.json({ users });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
router.get('/users/:id', requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id || '0');
        const user = await models_1.UserModel.findByIdWithRole(userId);
        if (!user) {
            return res.status(404).json({ error: 'USER_NOT_FOUND' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Publisher Management
router.get('/publishers', requireAdmin, async (_req, res) => {
    try {
        const publishers = await models_1.PublisherModel.findWithGameCount();
        res.json({ publishers });
    }
    catch (error) {
        console.error('Error fetching publishers:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Genre Management
router.get('/genres', requireAdmin, async (_req, res) => {
    try {
        const genres = await models_1.GenreModel.findWithGameCount();
        res.json({ genres });
    }
    catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Platform Management
router.get('/platforms', requireAdmin, async (_req, res) => {
    try {
        const platforms = await models_1.PlatformModel.findWithGameCount();
        res.json({ platforms });
    }
    catch (error) {
        console.error('Error fetching platforms:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Purchase Statistics
router.get('/purchases/stats', requireAdmin, async (_req, res) => {
    try {
        const stats = await models_1.PurchaseModel.getPurchaseStats();
        const topSelling = await models_1.PurchaseModel.getTopSellingGames(10);
        res.json({ stats, top_selling: topSelling });
    }
    catch (error) {
        console.error('Error fetching purchase stats:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Review Statistics
router.get('/reviews/stats', requireAdmin, async (_req, res) => {
    try {
        const stats = await models_1.ReviewModel.getReviewStats();
        const topRated = await models_1.ReviewModel.getTopRatedGames(10);
        res.json({ stats, top_rated: topRated });
    }
    catch (error) {
        console.error('Error fetching review stats:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Wishlist Statistics
router.get('/wishlists/stats', requireAdmin, async (_req, res) => {
    try {
        const stats = await models_1.WishlistModel.getWishlistStats();
        const mostWished = await models_1.WishlistModel.getMostWishedGames(10);
        res.json({ stats, most_wished: mostWished });
    }
    catch (error) {
        console.error('Error fetching wishlist stats:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map
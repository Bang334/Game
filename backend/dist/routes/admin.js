"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../db");
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
router.put('/users/:id', requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id || '0');
        const { username, email, password, age, gender, balance, role_id } = req.body;
        // Check if email is being changed and if it already exists
        if (email) {
            const emailExists = await models_1.UserModel.emailExists(email, userId);
            if (emailExists) {
                return res.status(400).json({ error: 'EMAIL_ALREADY_EXISTS' });
            }
        }
        // Check if username is being changed and if it already exists
        if (username) {
            const usernameExists = await models_1.UserModel.usernameExists(username, userId);
            if (usernameExists) {
                return res.status(400).json({ error: 'USERNAME_ALREADY_EXISTS' });
            }
        }
        // Update user
        const updateData = {};
        if (username !== undefined)
            updateData.username = username;
        if (email !== undefined)
            updateData.email = email;
        if (password !== undefined) {
            // Hash password before storing
            updateData.password = await bcrypt_1.default.hash(password, 10);
        }
        if (age !== undefined)
            updateData.age = age;
        if (gender !== undefined)
            updateData.gender = gender;
        if (balance !== undefined)
            updateData.balance = balance;
        if (role_id !== undefined)
            updateData.role_id = role_id;
        const success = await models_1.UserModel.update(userId, updateData);
        if (success) {
            const updatedUser = await models_1.UserModel.findByIdWithRole(userId);
            res.json({ success: true, user: updatedUser });
        }
        else {
            res.status(404).json({ error: 'USER_NOT_FOUND' });
        }
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const userId = parseInt(req.params.id || '0');
        const success = await models_1.UserModel.delete(userId);
        if (success) {
            res.json({ deleted: true });
        }
        else {
            res.status(404).json({ error: 'USER_NOT_FOUND' });
        }
    }
    catch (error) {
        console.error('Error deleting user:', error);
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
// Purchase Management
router.get('/purchases', requireAdmin, async (_req, res) => {
    try {
        const [rows] = await db_1.pool.query(`
      SELECT p.*, u.username, u.email, g.name as game_title, g.image as game_image_url, g.price as game_price
      FROM Purchase p
      JOIN User u ON p.user_id = u.user_id
      JOIN Game g ON p.game_id = g.game_id
      ORDER BY p.purchase_date DESC
    `);
        // Format the response to match frontend expectations
        const purchases = rows.map(row => ({
            purchase_id: row.purchase_id,
            user_id: row.user_id,
            game_id: row.game_id,
            purchase_date: row.purchase_date,
            amount: row.amount,
            payment_method: row.payment_method || 'Credit Card',
            status: row.status || 'completed',
            user: {
                username: row.username,
                email: row.email
            },
            game: {
                title: row.game_title,
                image_url: row.game_image_url,
                price: row.game_price
            }
        }));
        res.json({ purchases });
    }
    catch (error) {
        console.error('Error fetching purchases:', error);
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
// Review Management
router.get('/reviews', requireAdmin, async (_req, res) => {
    try {
        const [rows] = await db_1.pool.query(`
      SELECT r.*, u.username, u.email, g.name as game_title, g.image as game_image_url
      FROM Review r
      JOIN User u ON r.user_id = u.user_id
      JOIN Game g ON r.game_id = g.game_id
      ORDER BY r.review_date DESC
    `);
        // Format the response to match frontend expectations
        const reviews = rows.map(row => ({
            review_id: row.review_id,
            user_id: row.user_id,
            game_id: row.game_id,
            rating: row.rating,
            comment: row.comment,
            created_at: row.created_at,
            user: {
                username: row.username,
                email: row.email
            },
            game: {
                title: row.game_title,
                image_url: row.game_image_url
            }
        }));
        res.json({ reviews });
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Delete Review
router.delete('/reviews/:id', requireAdmin, async (req, res) => {
    try {
        const reviewId = parseInt(req.params.id || '0');
        const [result] = await db_1.pool.execute('DELETE FROM Review WHERE review_id = ?', [reviewId]);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Review deleted successfully' });
        }
        else {
            res.status(404).json({ error: 'REVIEW_NOT_FOUND' });
        }
    }
    catch (error) {
        console.error('Error deleting review:', error);
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
// Wishlist Management
router.get('/wishlists', requireAdmin, async (_req, res) => {
    try {
        const [rows] = await db_1.pool.query(`
      SELECT w.*, u.username, g.name as game_name
      FROM wishlist w
      JOIN User u ON w.user_id = u.user_id
      JOIN Game g ON w.game_id = g.game_id
      ORDER BY w.wishlist_id DESC
    `);
        res.json({ wishlists: rows });
    }
    catch (error) {
        console.error('Error fetching wishlists:', error);
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
// Dashboard Stats
router.get('/dashboard', requireAdmin, async (req, res) => {
    try {
        const { range = '30d' } = req.query;
        // Get basic counts
        const [gamesResult] = await db_1.pool.execute('SELECT COUNT(*) as count FROM Game');
        const [usersResult] = await db_1.pool.execute('SELECT COUNT(*) as count FROM User WHERE role_id = 2');
        const [purchasesResult] = await db_1.pool.execute('SELECT COUNT(*) as count FROM Purchase');
        const [reviewsResult] = await db_1.pool.execute('SELECT COUNT(*) as count FROM Review');
        // Get revenue
        const [revenueResult] = await db_1.pool.execute(`
      SELECT COALESCE(SUM(g.price), 0) as total_revenue 
      FROM Purchase p 
      JOIN Game g ON p.game_id = g.game_id
    `);
        // Get recent purchases
        const [recentPurchasesResult] = await db_1.pool.execute(`
      SELECT p.purchase_date, g.name as game_name, g.price, u.username
      FROM Purchase p
      JOIN Game g ON p.game_id = g.game_id
      JOIN User u ON p.user_id = u.user_id
      ORDER BY p.purchase_date DESC
      LIMIT 10
    `);
        // Get top games by sales
        const [topGamesResult] = await db_1.pool.execute(`
      SELECT g.name, g.price, COUNT(p.purchase_id) as sales_count
      FROM Game g
      LEFT JOIN Purchase p ON g.game_id = p.game_id
      GROUP BY g.game_id, g.name, g.price
      ORDER BY sales_count DESC
      LIMIT 5
    `);
        const stats = {
            total_games: gamesResult[0].count,
            total_users: usersResult[0].count,
            total_purchases: purchasesResult[0].count,
            total_reviews: reviewsResult[0].count,
            total_revenue: revenueResult[0].total_revenue,
            recent_purchases: recentPurchasesResult,
            top_games: topGamesResult
        };
        res.json({ stats });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
exports.default = router;
//# sourceMappingURL=admin.js.map
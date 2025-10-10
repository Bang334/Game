"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const models_1 = require("../models");
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me';
function requireAuth(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token)
        return res.status(401).json({ error: 'UNAUTHORIZED' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            ...decoded,
            user_id: decoded.sub
        };
        next();
    }
    catch (error) {
        console.error('JWT verification error:', error);
        return res.status(401).json({ error: 'UNAUTHORIZED' });
    }
}
const router = (0, express_1.Router)();
// Browse Games
router.get('/games', async (req, res) => {
    try {
        const { search, genre, platform, publisher, minPrice, maxPrice, sortBy = 'name', page = '1', limit = '20' } = req.query;
        let games = await models_1.GameModel.findAllWithPublisherAndGenres();
        // Apply filters
        if (search) {
            games = games.filter(game => game.name.toLowerCase().includes(search.toLowerCase()));
        }
        if (genre) {
            const genreId = parseInt(genre);
            const genreGames = await models_1.GameModel.findByGenre(genreId);
            const genreGameIds = genreGames.map(g => g.game_id);
            games = games.filter(game => genreGameIds.includes(game.game_id));
        }
        if (platform) {
            const platformId = parseInt(platform);
            const platformGames = await models_1.GameModel.findByPlatform(platformId);
            const platformGameIds = platformGames.map(g => g.game_id);
            games = games.filter(game => platformGameIds.includes(game.game_id));
        }
        if (publisher) {
            const publisherId = parseInt(publisher);
            games = games.filter(game => game.publisher_id === publisherId);
        }
        if (minPrice || maxPrice) {
            const min = minPrice ? parseFloat(minPrice) : 0;
            const max = maxPrice ? parseFloat(maxPrice) : Number.MAX_SAFE_INTEGER;
            games = games.filter(game => game.price >= min && game.price <= max);
        }
        // Apply sorting
        switch (sortBy) {
            case 'price_asc':
                games.sort((a, b) => a.price - b.price);
                break;
            case 'price_desc':
                games.sort((a, b) => b.price - a.price);
                break;
            case 'rating':
                games.sort((a, b) => b.average_rating - a.average_rating);
                break;
            case 'release_year':
                games.sort((a, b) => {
                    const dateA = new Date(a.release_date || '2020-01-01').getFullYear();
                    const dateB = new Date(b.release_date || '2020-01-01').getFullYear();
                    return dateB - dateA;
                });
                break;
            default:
                games.sort((a, b) => a.name.localeCompare(b.name));
        }
        // Apply pagination
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const totalGames = games.length;
        const totalPages = Math.ceil(totalGames / limitNum);
        const startIndex = (pageNum - 1) * limitNum;
        const endIndex = startIndex + limitNum;
        const paginatedGames = games.slice(startIndex, endIndex);
        res.json({
            games: paginatedGames,
            pagination: {
                page: pageNum,
                limit: limitNum,
                totalGames,
                totalPages
            }
        });
    }
    catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
router.get('/games/:id', async (req, res) => {
    try {
        const gameId = parseInt(req.params.id || '0');
        const game = await models_1.GameModel.findByIdWithDetails(gameId);
        if (!game) {
            return res.status(404).json({ error: 'GAME_NOT_FOUND' });
        }
        // Format game with proper image handling
        const formattedGame = {
            ...game,
            image: game.image || null, // Use actual image from database or null
            screenshots: game.image ? [game.image] : [], // Use main image as screenshot if available
            genres: game.genres || [],
            platforms: game.platforms || []
        };
        res.json({ game: formattedGame });
    }
    catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Get top games
router.get('/games/top/downloaded', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const games = await models_1.GameModel.findTopDownloaded(limit);
        res.json({ games });
    }
    catch (error) {
        console.error('Error fetching top downloaded games:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
router.get('/games/top/rated', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const games = await models_1.GameModel.findTopRated(limit);
        res.json({ games });
    }
    catch (error) {
        console.error('Error fetching top rated games:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Get filters
router.get('/filters/genres', async (_req, res) => {
    try {
        const genres = await models_1.GenreModel.findAll();
        res.json({ genres });
    }
    catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
router.get('/filters/platforms', async (_req, res) => {
    try {
        const platforms = await models_1.PlatformModel.findAll();
        res.json({ platforms });
    }
    catch (error) {
        console.error('Error fetching platforms:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
router.get('/filters/publishers', async (_req, res) => {
    try {
        const publishers = await models_1.PublisherModel.findAll();
        res.json({ publishers });
    }
    catch (error) {
        console.error('Error fetching publishers:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// User Profile
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const user = await models_1.UserModel.findByIdWithRole(userId);
        if (!user) {
            return res.status(404).json({ error: 'USER_NOT_FOUND' });
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Update User Profile
router.put('/profile', requireAuth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { username, email, password, age, gender } = req.body;
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
            // Store password as plain text
            updateData.password = password;
        }
        if (age !== undefined)
            updateData.age = age;
        if (gender !== undefined)
            updateData.gender = gender;
        const success = await models_1.UserModel.update(userId, updateData);
        if (success) {
            const updatedUser = await models_1.UserModel.findByIdWithRole(userId);
            res.json({ success: true, user: updatedUser });
        }
        else {
            res.status(400).json({ error: 'UPDATE_FAILED' });
        }
    }
    catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// User Purchases
router.get('/purchases', requireAuth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const purchases = await models_1.PurchaseModel.findByUserIdWithDetails(userId);
        res.json({ purchases });
    }
    catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// User Reviews
router.get('/reviews', requireAuth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const reviews = await models_1.ReviewModel.findByUserIdWithDetails(userId);
        res.json({ reviews });
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// User Wishlist
router.get('/wishlist', requireAuth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const wishlist = await models_1.WishlistModel.findByUserIdWithDetails(userId);
        res.json({ wishlist });
    }
    catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Add to Wishlist
router.post('/wishlist', requireAuth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { game_id } = req.body;
        if (!game_id) {
            return res.status(400).json({ error: 'GAME_ID_REQUIRED' });
        }
        const wishlistId = await models_1.WishlistModel.addToWishlist({ user_id: userId, game_id });
        res.status(201).json({ added: true, wishlist_id: wishlistId });
    }
    catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Remove from Wishlist
router.delete('/wishlist/:gameId', requireAuth, async (req, res) => {
    try {
        const userId = req.user.user_id;
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
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Game Reviews
router.get('/games/:id/reviews', async (req, res) => {
    try {
        const gameId = parseInt(req.params.id || '0');
        const reviews = await models_1.ReviewModel.findByGameIdWithDetails(gameId);
        res.json({ reviews });
    }
    catch (error) {
        console.error('Error fetching game reviews:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Add or Update Review
router.post('/games/:id/reviews', requireAuth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const gameId = parseInt(req.params.id || '0');
        const { rating, comment } = req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'INVALID_RATING' });
        }
        // Check if user has purchased the game
        const hasPurchased = await models_1.PurchaseModel.userHasPurchased(userId, gameId);
        if (!hasPurchased) {
            return res.status(403).json({ error: 'MUST_PURCHASE_FIRST' });
        }
        // Create or update review using UPSERT
        const result = await models_1.ReviewModel.createOrUpdate({ user_id: userId, game_id: gameId, rating, comment });
        // Update game's average rating
        const newAverageRating = await models_1.ReviewModel.getAverageRating(gameId);
        await models_1.GameModel.updateRating(gameId, newAverageRating);
        if (result.isNew) {
            res.status(201).json({
                created: true,
                review_id: result.review_id,
                message: 'Review created successfully'
            });
        }
        else {
            res.json({
                updated: true,
                review_id: result.review_id,
                message: 'Review updated successfully'
            });
        }
    }
    catch (error) {
        console.error('Error creating/updating review:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Update Review
router.put('/reviews/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const reviewId = parseInt(req.params.id || '0');
        const { rating, comment } = req.body;
        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({ error: 'INVALID_RATING' });
        }
        // Check if review exists and belongs to user
        const existingReview = await models_1.ReviewModel.findById(reviewId);
        if (!existingReview || existingReview.user_id !== userId) {
            return res.status(404).json({ error: 'REVIEW_NOT_FOUND' });
        }
        const success = await models_1.ReviewModel.update(reviewId, { rating, comment });
        if (!success) {
            return res.status(400).json({ error: 'UPDATE_FAILED' });
        }
        // Update game's average rating
        const newAverageRating = await models_1.ReviewModel.getAverageRating(existingReview.game_id);
        await models_1.GameModel.updateRating(existingReview.game_id, newAverageRating);
        res.json({ updated: true });
    }
    catch (error) {
        console.error('Error updating review:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Delete Review
router.delete('/reviews/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const reviewId = parseInt(req.params.id || '0');
        // Check if review exists and belongs to user
        const existingReview = await models_1.ReviewModel.findById(reviewId);
        if (!existingReview || existingReview.user_id !== userId) {
            return res.status(404).json({ error: 'REVIEW_NOT_FOUND' });
        }
        const success = await models_1.ReviewModel.delete(reviewId);
        if (!success) {
            return res.status(400).json({ error: 'DELETE_FAILED' });
        }
        // Update game's average rating
        const newAverageRating = await models_1.ReviewModel.getAverageRating(existingReview.game_id);
        await models_1.GameModel.updateRating(existingReview.game_id, newAverageRating);
        res.json({ deleted: true });
    }
    catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Wishlist Management
router.get('/wishlist', requireAuth, async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }
        const wishlist = await models_1.WishlistModel.findByUserIdWithDetails(userId);
        res.json({ wishlist });
    }
    catch (error) {
        console.error('Error fetching wishlist:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
router.post('/wishlist', requireAuth, async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }
        const { game_id } = req.body;
        // Check if already in wishlist
        const existing = await models_1.WishlistModel.findByUserAndGame(userId, game_id);
        if (existing) {
            return res.status(400).json({ error: 'ALREADY_IN_WISHLIST' });
        }
        const wishlistId = await models_1.WishlistModel.create({ user_id: userId, game_id });
        res.status(201).json({ created: true, wishlist_id: wishlistId });
    }
    catch (error) {
        console.error('Error adding to wishlist:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
router.delete('/wishlist/:id', requireAuth, async (req, res) => {
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
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Purchases Management
router.get('/purchases', requireAuth, async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }
        const purchases = await models_1.PurchaseModel.findByUserIdWithDetails(userId);
        res.json({ purchases });
    }
    catch (error) {
        console.error('Error fetching purchases:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Create Purchase
router.post('/purchases', requireAuth, async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }
        const { game_id } = req.body;
        if (!game_id) {
            return res.status(400).json({ error: 'GAME_ID_REQUIRED' });
        }
        // Check if game exists
        const game = await models_1.GameModel.findById(game_id);
        if (!game) {
            return res.status(404).json({ error: 'GAME_NOT_FOUND' });
        }
        // Check if user already purchased this game
        const hasPurchased = await models_1.PurchaseModel.userHasPurchased(userId, game_id);
        if (hasPurchased) {
            return res.status(400).json({ error: 'ALREADY_PURCHASED' });
        }
        // Check if user has enough balance
        const user = await models_1.UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'USER_NOT_FOUND' });
        }
        if (user.balance < game.price) {
            return res.status(400).json({ error: 'INSUFFICIENT_BALANCE' });
        }
        // Create purchase
        const purchaseId = await models_1.PurchaseModel.create({
            user_id: userId,
            game_id,
            payment_method: 'bank_transfer'
        });
        // Deduct balance
        const newBalance = user.balance - game.price;
        await models_1.UserModel.update(userId, { balance: newBalance });
        // Increment game downloads
        await models_1.GameModel.incrementDownloads(game_id);
        res.status(201).json({
            success: true,
            purchase_id: purchaseId,
            new_balance: newBalance,
            message: 'Game purchased successfully'
        });
    }
    catch (error) {
        console.error('Error creating purchase:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Viewed Games Management
router.get('/viewed-games', requireAuth, async (req, res) => {
    try {
        const userId = req.user?.user_id;
        if (!userId) {
            return res.status(401).json({ error: 'UNAUTHORIZED' });
        }
        const games = await models_1.ViewModel.findByUserIdWithDetails(userId);
        res.json({ games });
    }
    catch (error) {
        console.error('Error fetching viewed games:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Add view to game
router.post('/games/:id/view', requireAuth, async (req, res) => {
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
        console.error('Error adding view:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Remove view from game
router.delete('/viewed-games/:gameId', requireAuth, async (req, res) => {
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
        console.error('Error removing view:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Get user's rating for a specific game
router.get('/ratings/:gameId', requireAuth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const gameId = parseInt(req.params.gameId || '0');
        const rating = await models_1.ReviewModel.findByUserAndGame(userId, gameId);
        res.json({ rating });
    }
    catch (error) {
        console.error('Error fetching user rating:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Create or update rating
router.post('/ratings', requireAuth, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { game_id, rating, comment } = req.body;
        if (!game_id || !rating || rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'INVALID_RATING_DATA' });
        }
        // Check if user has purchased the game
        const hasPurchased = await models_1.PurchaseModel.userHasPurchased(userId, game_id);
        if (!hasPurchased) {
            return res.status(403).json({ error: 'MUST_PURCHASE_FIRST' });
        }
        // Create or update review using UPSERT
        const result = await models_1.ReviewModel.createOrUpdate({ user_id: userId, game_id, rating, comment });
        // Update game's average rating
        const newAverageRating = await models_1.ReviewModel.getAverageRating(game_id);
        await models_1.GameModel.updateRating(game_id, newAverageRating);
        if (result.isNew) {
            res.status(201).json({
                success: true,
                review_id: result.review_id,
                message: 'Rating created successfully'
            });
        }
        else {
            res.json({
                success: true,
                review_id: result.review_id,
                message: 'Rating updated successfully'
            });
        }
    }
    catch (error) {
        console.error('Error creating/updating rating:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Get reviews for a game
router.get('/games/:id/reviews', async (req, res) => {
    try {
        const gameId = parseInt(req.params.id);
        const [rows] = await db_1.pool.execute(`
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM \`Review\` r
      JOIN \`User\` u ON r.user_id = u.user_id
      WHERE r.game_id = ?
      ORDER BY r.created_at DESC
    `, [gameId]);
        res.json({ reviews: rows });
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
exports.default = router;
//# sourceMappingURL=customer.js.map
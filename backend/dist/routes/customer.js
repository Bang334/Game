"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me';
function requireAuth(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token)
        return res.status(401).json({ error: 'UNAUTHORIZED' });
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        return res.status(401).json({ error: 'UNAUTHORIZED' });
    }
}
const router = (0, express_1.Router)();
// Browse Games
router.get('/games', async (req, res) => {
    try {
        const { search, genre, platform, publisher, minPrice, maxPrice, sortBy = 'name' } = req.query;
        let games = await models_1.GameModel.findAllWithPublisher();
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
                games.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
                break;
            default:
                games.sort((a, b) => a.name.localeCompare(b.name));
        }
        res.json({ games });
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
        res.json({ game });
    }
    catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
// Get top games
router.get('/games/top/selling', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        const games = await models_1.GameModel.findTopSelling(limit);
        res.json({ games });
    }
    catch (error) {
        console.error('Error fetching top selling games:', error);
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
// Add Review
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
        // Check if user already reviewed
        const existingReview = await models_1.ReviewModel.findByUserAndGame(userId, gameId);
        if (existingReview) {
            return res.status(400).json({ error: 'ALREADY_REVIEWED' });
        }
        const reviewId = await models_1.ReviewModel.create({ user_id: userId, game_id: gameId, rating, comment });
        res.status(201).json({ created: true, review_id: reviewId });
    }
    catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
exports.default = router;
//# sourceMappingURL=customer.js.map
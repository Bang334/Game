"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const gameController_1 = require("../controllers/gameController");
const userController_1 = require("../controllers/userController");
const purchaseController_1 = require("../controllers/purchaseController");
const reviewController_1 = require("../controllers/reviewController");
const wishlistController_1 = require("../controllers/wishlistController");
const balanceController_1 = require("../controllers/balanceController");
const viewController_1 = require("../controllers/viewController");
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me';
/**
 * Authentication middleware
 */
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
// ==================== GAME ROUTES ====================
// Browse Games
router.get('/games', gameController_1.GameController.getAllGames);
// Get game by ID
router.get('/games/:id', gameController_1.GameController.getGameById);
// Get top games
router.get('/games/top/downloaded', gameController_1.GameController.getTopDownloaded);
router.get('/games/top/rated', gameController_1.GameController.getTopRated);
// Get filters
router.get('/filters/genres', gameController_1.GameController.getAllGenres);
router.get('/filters/platforms', gameController_1.GameController.getAllPlatforms);
router.get('/filters/publishers', gameController_1.GameController.getAllPublishers);
// ==================== USER ROUTES ====================
// User Profile
router.get('/profile', requireAuth, userController_1.UserController.getProfile);
router.put('/profile', requireAuth, userController_1.UserController.updateProfile);
// ==================== PURCHASE ROUTES ====================
// User Purchases
router.get('/purchases', requireAuth, purchaseController_1.PurchaseController.getUserPurchases);
router.post('/purchases', requireAuth, purchaseController_1.PurchaseController.createPurchase);
// ==================== REVIEW ROUTES ====================
// User Reviews
router.get('/reviews', requireAuth, reviewController_1.ReviewController.getUserReviews);
// Game Reviews
router.get('/games/:id/reviews', reviewController_1.ReviewController.getGameReviews);
router.post('/games/:id/reviews', requireAuth, reviewController_1.ReviewController.createOrUpdateReview);
// Review Management
router.put('/reviews/:id', requireAuth, reviewController_1.ReviewController.updateReview);
router.delete('/reviews/:id', requireAuth, reviewController_1.ReviewController.deleteReview);
// Ratings
router.get('/ratings/:gameId', requireAuth, reviewController_1.ReviewController.getUserRatingForGame);
router.post('/ratings', requireAuth, reviewController_1.ReviewController.createOrUpdateRating);
// ==================== WISHLIST ROUTES ====================
// Wishlist Management
router.get('/wishlist', requireAuth, wishlistController_1.WishlistController.getUserWishlist);
router.post('/wishlist', requireAuth, wishlistController_1.WishlistController.addToWishlist);
router.delete('/wishlist/:id', requireAuth, wishlistController_1.WishlistController.removeFromWishlistById);
router.delete('/wishlist/:gameId', requireAuth, wishlistController_1.WishlistController.removeFromWishlistByGameId);
// ==================== VIEW ROUTES ====================
// Viewed Games Management
router.get('/viewed-games', requireAuth, viewController_1.ViewController.getUserViewedGames);
router.post('/games/:id/view', requireAuth, viewController_1.ViewController.addView);
router.delete('/viewed-games/:gameId', requireAuth, viewController_1.ViewController.removeView);
// ==================== BALANCE ROUTES ====================
// Balance Transactions
router.get('/balance-transactions', requireAuth, balanceController_1.BalanceController.getUserTransactions);
router.post('/deposit-request', requireAuth, balanceController_1.BalanceController.requestDeposit);
router.get('/pending-deposits', requireAuth, balanceController_1.BalanceController.getUserPendingDeposits);
exports.default = router;
//# sourceMappingURL=customer.js.map
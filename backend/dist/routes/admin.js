"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const adminController_1 = require("../controllers/adminController");
const gameController_1 = require("../controllers/gameController");
const purchaseController_1 = require("../controllers/purchaseController");
const reviewController_1 = require("../controllers/reviewController");
const balanceController_1 = require("../controllers/balanceController");
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me';
/**
 * Admin authentication middleware
 */
function requireAdmin(req, res, next) {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'NO_TOKEN' });
    }
    const token = auth.slice(7);
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== 'ADMIN') {
            return res.status(403).json({ error: 'FORBIDDEN' });
        }
        // Map sub to user_id for consistency
        ;
        req.user = {
            ...decoded,
            user_id: decoded.sub
        };
        next();
    }
    catch (e) {
        console.error('Token verification error:', e);
        return res.status(401).json({ error: 'INVALID_TOKEN' });
    }
}
const router = (0, express_1.Router)();
// ==================== USER MANAGEMENT ====================
// Get all users
router.get('/users', requireAdmin, adminController_1.AdminController.getAllUsers);
// ==================== PURCHASE MANAGEMENT ====================
// Get all purchases
router.get('/purchases', requireAdmin, purchaseController_1.PurchaseController.getAllPurchases);
// ==================== DEPOSIT MANAGEMENT ====================
// Get all deposit requests with filtering
router.get('/deposit-requests', requireAdmin, balanceController_1.BalanceController.getAllDepositRequests);
// Approve deposit request
router.post('/deposit-requests/:id/approve', requireAdmin, balanceController_1.BalanceController.approveDeposit);
// Reject deposit request
router.post('/deposit-requests/:id/reject', requireAdmin, balanceController_1.BalanceController.rejectDeposit);
// ==================== REVIEW MANAGEMENT ====================
// Get all reviews
router.get('/reviews', requireAdmin, reviewController_1.ReviewController.getAllReviews);
// ==================== GAME MANAGEMENT ====================
// Get all games
router.get('/games', requireAdmin, gameController_1.GameController.getAllGames);
exports.default = router;
//# sourceMappingURL=admin.js.map
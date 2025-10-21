import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AdminController } from '../controllers/adminController'
import { GameController } from '../controllers/gameController'
import { PurchaseController } from '../controllers/purchaseController'
import { ReviewController } from '../controllers/reviewController'
import { BalanceController } from '../controllers/balanceController'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me'

/**
 * Admin authentication middleware
 */
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || ''
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'NO_TOKEN' })
  }
  const token = auth.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: 'FORBIDDEN' })
    }
    // Map sub to user_id for consistency
    ;(req as any).user = {
      ...decoded,
      user_id: decoded.sub
    }
    next()
  } catch (e) {
    console.error('Token verification error:', e)
    return res.status(401).json({ error: 'INVALID_TOKEN' })
  }
}

const router = Router()

// ==================== USER MANAGEMENT ====================

// Get all users
router.get('/users', requireAdmin, AdminController.getAllUsers)

// ==================== PURCHASE MANAGEMENT ====================

// Get all purchases
router.get('/purchases', requireAdmin, PurchaseController.getAllPurchases)

// ==================== DEPOSIT MANAGEMENT ====================

// Get all deposit requests with filtering
router.get('/deposit-requests', requireAdmin, BalanceController.getAllDepositRequests)

// Approve deposit request
router.post('/deposit-requests/:id/approve', requireAdmin, BalanceController.approveDeposit)

// Reject deposit request
router.post('/deposit-requests/:id/reject', requireAdmin, BalanceController.rejectDeposit)

// ==================== REVIEW MANAGEMENT ====================

// Get all reviews
router.get('/reviews', requireAdmin, ReviewController.getAllReviews)

// ==================== GAME MANAGEMENT ====================

// Get all games
router.get('/games', requireAdmin, GameController.getAllGames)

export default router

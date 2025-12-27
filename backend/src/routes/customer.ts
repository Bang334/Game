import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { GameController } from '../controllers/gameController'
import { UserController } from '../controllers/userController'
import { PurchaseController } from '../controllers/purchaseController'
import { ReviewController } from '../controllers/reviewController'
import { WishlistController } from '../controllers/wishlistController'
import { BalanceController } from '../controllers/balanceController'
import { ViewController } from '../controllers/viewController'
import { SimilarGamesController } from '../controllers/similarGamesController'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me'

/**
 * Authentication middleware
 */
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    // Map sub to user_id for consistency
    ;(req as any).user = {
      ...decoded,
      user_id: decoded.sub
    }
    next()
  } catch (error) {
    console.error('JWT verification error:', error)
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }
}

const router = Router()

// ==================== GAME ROUTES ====================

// Browse Games
router.get('/games', GameController.getAllGames)

// Get game by ID
router.get('/games/:id', GameController.getGameById)

// Get similar games
router.get('/games/:id/similar', SimilarGamesController.getSimilarGames)

// Get top games
router.get('/games/top/downloaded', GameController.getTopDownloaded)
router.get('/games/top/rated', GameController.getTopRated)
router.get('/games/top/newest', GameController.getNewestReleases)

// Get filters
router.get('/filters/genres', GameController.getAllGenres)
router.get('/filters/platforms', GameController.getAllPlatforms)
router.get('/filters/publishers', GameController.getAllPublishers)

// ==================== USER ROUTES ====================

// User Profile
router.get('/profile', requireAuth, UserController.getProfile)
router.put('/profile', requireAuth, UserController.updateProfile)

// ==================== PURCHASE ROUTES ====================

// User Purchases
router.get('/purchases', requireAuth, PurchaseController.getUserPurchases)
router.post('/purchases', requireAuth, PurchaseController.createPurchase)

// ==================== REVIEW ROUTES ====================

// User Reviews
router.get('/reviews', requireAuth, ReviewController.getUserReviews)

// Game Reviews
router.get('/games/:id/reviews', ReviewController.getGameReviews)
router.post('/games/:id/reviews', requireAuth, ReviewController.createOrUpdateReview)

// Review Management
router.put('/reviews/:id', requireAuth, ReviewController.updateReview)
router.delete('/reviews/:id', requireAuth, ReviewController.deleteReview)

// Ratings
router.get('/ratings/:gameId', requireAuth, ReviewController.getUserRatingForGame)
router.post('/ratings', requireAuth, ReviewController.createOrUpdateRating)

// ==================== WISHLIST ROUTES ====================

// Wishlist Management
router.get('/wishlist', requireAuth, WishlistController.getUserWishlist)
router.post('/wishlist', requireAuth, WishlistController.addToWishlist)
router.delete('/wishlist/:id', requireAuth, WishlistController.removeFromWishlistById)
router.delete('/wishlist/:gameId', requireAuth, WishlistController.removeFromWishlistByGameId)

// ==================== VIEW ROUTES ====================

// Viewed Games Management
router.get('/viewed-games', requireAuth, ViewController.getUserViewedGames)
router.post('/games/:id/view', requireAuth, ViewController.addView)
router.delete('/viewed-games/:gameId', requireAuth, ViewController.removeView)

// ==================== BALANCE ROUTES ====================

// Balance Transactions
router.get('/balance-transactions', requireAuth, BalanceController.getUserTransactions)
router.post('/deposit-request', requireAuth, BalanceController.requestDeposit)
router.get('/pending-deposits', requireAuth, BalanceController.getUserPendingDeposits)

export default router

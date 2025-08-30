import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { 
  GameModel, 
  UserModel, 
  PublisherModel, 
  GenreModel, 
  PlatformModel,
  PurchaseModel,
  ReviewModel,
  WishlistModel
} from '../models'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me'

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded?.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' })
    ;(req as any).user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }
}

const router = Router()

// Game Management
router.get('/games', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const games = await GameModel.findAllWithPublisher()
    res.json({ games })
  } catch (error) {
    console.error('Error fetching games:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.get('/games/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const gameId = parseInt(req.params.id || '0')
    const game = await GameModel.findByIdWithDetails(gameId)
    if (!game) {
      return res.status(404).json({ error: 'GAME_NOT_FOUND' })
    }
    res.json({ game })
  } catch (error) {
    console.error('Error fetching game:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.post('/games', requireAdmin, async (req: Request, res: Response) => {
  try {
    const gameData = req.body
    const gameId = await GameModel.create(gameData)
    res.status(201).json({ created: true, game_id: gameId })
  } catch (error) {
    console.error('Error creating game:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.put('/games/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const gameId = parseInt(req.params.id || '0')
    const updateData = req.body
    const success = await GameModel.update(gameId, updateData)
    if (success) {
      res.json({ updated: true })
    } else {
      res.status(404).json({ error: 'GAME_NOT_FOUND' })
    }
  } catch (error) {
    console.error('Error updating game:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.delete('/games/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const gameId = parseInt(req.params.id)
    const success = await GameModel.delete(gameId)
    if (success) {
      res.json({ deleted: true })
    } else {
      res.status(404).json({ error: 'GAME_NOT_FOUND' })
    }
  } catch (error) {
    console.error('Error deleting game:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// User Management
router.get('/users', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const users = await UserModel.findAllWithRole()
    res.json({ users })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.get('/users/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.id)
    const user = await UserModel.findByIdWithRole(userId)
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' })
    }
    res.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Publisher Management
router.get('/publishers', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const publishers = await PublisherModel.findWithGameCount()
    res.json({ publishers })
  } catch (error) {
    console.error('Error fetching publishers:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Genre Management
router.get('/genres', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const genres = await GenreModel.findWithGameCount()
    res.json({ genres })
  } catch (error) {
    console.error('Error fetching genres:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Platform Management
router.get('/platforms', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const platforms = await PlatformModel.findWithGameCount()
    res.json({ platforms })
  } catch (error) {
    console.error('Error fetching platforms:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Purchase Statistics
router.get('/purchases/stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const stats = await PurchaseModel.getPurchaseStats()
    const topSelling = await PurchaseModel.getTopSellingGames(10)
    res.json({ stats, top_selling: topSelling })
  } catch (error) {
    console.error('Error fetching purchase stats:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Review Statistics
router.get('/reviews/stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const stats = await ReviewModel.getReviewStats()
    const topRated = await ReviewModel.getTopRatedGames(10)
    res.json({ stats, top_rated: topRated })
  } catch (error) {
    console.error('Error fetching review stats:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Wishlist Statistics
router.get('/wishlists/stats', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const stats = await WishlistModel.getWishlistStats()
    const mostWished = await WishlistModel.getMostWishedGames(10)
    res.json({ stats, most_wished: mostWished })
  } catch (error) {
    console.error('Error fetching wishlist stats:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

export default router


import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { 
  GameModel, 
  UserModel, 
  PurchaseModel, 
  ReviewModel, 
  WishlistModel,
  GenreModel,
  PlatformModel,
  PublisherModel
} from '../models'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me'

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    ;(req as any).user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }
}

const router = Router()

// Browse Games
router.get('/games', async (req: Request, res: Response) => {
  try {
    const { search, genre, platform, publisher, minPrice, maxPrice, sortBy = 'name' } = req.query
    
    let games = await GameModel.findAllWithPublisher()
    
    // Apply filters
    if (search) {
      games = games.filter(game => 
        game.name.toLowerCase().includes((search as string).toLowerCase())
      )
    }
    
    if (genre) {
      const genreId = parseInt(genre as string)
      const genreGames = await GameModel.findByGenre(genreId)
      const genreGameIds = genreGames.map(g => g.game_id)
      games = games.filter(game => genreGameIds.includes(game.game_id))
    }
    
    if (platform) {
      const platformId = parseInt(platform as string)
      const platformGames = await GameModel.findByPlatform(platformId)
      const platformGameIds = platformGames.map(g => g.game_id)
      games = games.filter(game => platformGameIds.includes(game.game_id))
    }
    
    if (publisher) {
      const publisherId = parseInt(publisher as string)
      games = games.filter(game => game.publisher_id === publisherId)
    }
    
    if (minPrice || maxPrice) {
      const min = minPrice ? parseFloat(minPrice as string) : 0
      const max = maxPrice ? parseFloat(maxPrice as string) : Number.MAX_SAFE_INTEGER
      games = games.filter(game => game.price >= min && game.price <= max)
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        games.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        games.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        games.sort((a, b) => b.average_rating - a.average_rating)
        break
      case 'release_year':
        games.sort((a, b) => (b.release_year || 0) - (a.release_year || 0))
        break
      default:
        games.sort((a, b) => a.name.localeCompare(b.name))
    }
    
    res.json({ games })
  } catch (error) {
    console.error('Error fetching games:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.get('/games/:id', async (req: Request, res: Response) => {
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

// Get top games
router.get('/games/top/selling', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
    const games = await GameModel.findTopSelling(limit)
    res.json({ games })
  } catch (error) {
    console.error('Error fetching top selling games:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.get('/games/top/rated', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
    const games = await GameModel.findTopRated(limit)
    res.json({ games })
  } catch (error) {
    console.error('Error fetching top rated games:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Get filters
router.get('/filters/genres', async (_req: Request, res: Response) => {
  try {
    const genres = await GenreModel.findAll()
    res.json({ genres })
  } catch (error) {
    console.error('Error fetching genres:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.get('/filters/platforms', async (_req: Request, res: Response) => {
  try {
    const platforms = await PlatformModel.findAll()
    res.json({ platforms })
  } catch (error) {
    console.error('Error fetching platforms:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.get('/filters/publishers', async (_req: Request, res: Response) => {
  try {
    const publishers = await PublisherModel.findAll()
    res.json({ publishers })
  } catch (error) {
    console.error('Error fetching publishers:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// User Profile
router.get('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id
    const user = await UserModel.findByIdWithRole(userId)
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' })
    }
    res.json({ user })
  } catch (error) {
    console.error('Error fetching profile:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// User Purchases
router.get('/purchases', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id
    const purchases = await PurchaseModel.findByUserIdWithDetails(userId)
    res.json({ purchases })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// User Reviews
router.get('/reviews', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id
    const reviews = await ReviewModel.findByUserIdWithDetails(userId)
    res.json({ reviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// User Wishlist
router.get('/wishlist', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id
    const wishlist = await WishlistModel.findByUserIdWithDetails(userId)
    res.json({ wishlist })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Add to Wishlist
router.post('/wishlist', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id
    const { game_id } = req.body
    
    if (!game_id) {
      return res.status(400).json({ error: 'GAME_ID_REQUIRED' })
    }
    
    const wishlistId = await WishlistModel.addToWishlist({ user_id: userId, game_id })
    res.status(201).json({ added: true, wishlist_id: wishlistId })
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Remove from Wishlist
router.delete('/wishlist/:gameId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id
    const gameId = parseInt(req.params.gameId || '0')
    
    const success = await WishlistModel.removeFromWishlist(userId, gameId)
    if (success) {
      res.json({ removed: true })
    } else {
      res.status(404).json({ error: 'WISHLIST_ITEM_NOT_FOUND' })
    }
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Game Reviews
router.get('/games/:id/reviews', async (req: Request, res: Response) => {
  try {
    const gameId = parseInt(req.params.id || '0')
    const reviews = await ReviewModel.findByGameIdWithDetails(gameId)
    res.json({ reviews })
  } catch (error) {
    console.error('Error fetching game reviews:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Add Review
router.post('/games/:id/reviews', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id
    const gameId = parseInt(req.params.id || '0')
    const { rating, comment } = req.body
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'INVALID_RATING' })
    }
    
    // Check if user has purchased the game
    const hasPurchased = await PurchaseModel.userHasPurchased(userId, gameId)
    if (!hasPurchased) {
      return res.status(403).json({ error: 'MUST_PURCHASE_FIRST' })
    }
    
    // Check if user already reviewed
    const existingReview = await ReviewModel.findByUserAndGame(userId, gameId)
    if (existingReview) {
      return res.status(400).json({ error: 'ALREADY_REVIEWED' })
    }
    
    const reviewId = await ReviewModel.create({ user_id: userId, game_id: gameId, rating, comment })
    res.status(201).json({ created: true, review_id: reviewId })
  } catch (error) {
    console.error('Error creating review:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

export default router


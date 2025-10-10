import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db'
import { 
  GameModel, 
  UserModel, 
  PurchaseModel, 
  ReviewModel, 
  WishlistModel,
  ViewModel,
  GenreModel,
  PlatformModel,
  PublisherModel,
  BalanceTransactionModel
} from '../models'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me'

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

// Browse Games
router.get('/games', async (req: Request, res: Response) => {
  try {
    const { search, genre, platform, publisher, minPrice, maxPrice, sortBy = 'name', page = '1', limit = '20' } = req.query
    
    let games = await GameModel.findAllWithPublisherAndGenres()
    
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
        games.sort((a, b) => {
          const dateA = new Date(a.release_date || '2020-01-01').getFullYear()
          const dateB = new Date(b.release_date || '2020-01-01').getFullYear()
          return dateB - dateA
        })
        break
      default:
        games.sort((a, b) => a.name.localeCompare(b.name))
    }
    
    // Apply pagination
    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const totalGames = games.length
    const totalPages = Math.ceil(totalGames / limitNum)
    const startIndex = (pageNum - 1) * limitNum
    const endIndex = startIndex + limitNum
    const paginatedGames = games.slice(startIndex, endIndex)
    
    res.json({ 
      games: paginatedGames,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalGames,
        totalPages
      }
    })
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
    
    // Format game with proper image handling
    const formattedGame = {
      ...game,
      image: game.image || null, // Use actual image from database or null
      screenshots: game.image ? [game.image] : [], // Use main image as screenshot if available
      genres: game.genres || [],
      platforms: game.platforms || []
    }
    
    res.json({ game: formattedGame })
  } catch (error) {
    console.error('Error fetching game:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Get top games
router.get('/games/top/downloaded', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10
    const games = await GameModel.findTopDownloaded(limit)
    res.json({ games })
  } catch (error) {
    console.error('Error fetching top downloaded games:', error)
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

// Update User Profile
router.put('/profile', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id
    const { username, email, password, age, gender } = req.body
    
    // Check if email is being changed and if it already exists
    if (email) {
      const emailExists = await UserModel.emailExists(email, userId)
      if (emailExists) {
        return res.status(400).json({ error: 'EMAIL_ALREADY_EXISTS' })
      }
    }
    
    // Check if username is being changed and if it already exists
    if (username) {
      const usernameExists = await UserModel.usernameExists(username, userId)
      if (usernameExists) {
        return res.status(400).json({ error: 'USERNAME_ALREADY_EXISTS' })
      }
    }
    
    // Update user
    const updateData: any = {}
    if (username !== undefined) updateData.username = username
    if (email !== undefined) updateData.email = email
    if (password !== undefined) {
      // Store password as plain text
      updateData.password = password
    }
    if (age !== undefined) updateData.age = age
    if (gender !== undefined) updateData.gender = gender
    
    const success = await UserModel.update(userId, updateData)
    if (success) {
      const updatedUser = await UserModel.findByIdWithRole(userId)
      res.json({ success: true, user: updatedUser })
    } else {
      res.status(400).json({ error: 'UPDATE_FAILED' })
    }
  } catch (error) {
    console.error('Error updating profile:', error)
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

// Add or Update Review
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
    
    // Create or update review using UPSERT
    const result = await ReviewModel.createOrUpdate({ user_id: userId, game_id: gameId, rating, comment })
    
    // Update game's average rating
    const newAverageRating = await ReviewModel.getAverageRating(gameId)
    await GameModel.updateRating(gameId, newAverageRating)
    
    if (result.isNew) {
      res.status(201).json({ 
        created: true, 
        review_id: result.review_id, 
        message: 'Review created successfully' 
      })
    } else {
      res.json({ 
        updated: true, 
        review_id: result.review_id, 
        message: 'Review updated successfully' 
      })
    }
  } catch (error) {
    console.error('Error creating/updating review:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Update Review
router.put('/reviews/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id
    const reviewId = parseInt(req.params.id || '0')
    const { rating, comment } = req.body
    
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ error: 'INVALID_RATING' })
    }
    
    // Check if review exists and belongs to user
    const existingReview = await ReviewModel.findById(reviewId)
    if (!existingReview || existingReview.user_id !== userId) {
      return res.status(404).json({ error: 'REVIEW_NOT_FOUND' })
    }
    
    const success = await ReviewModel.update(reviewId, { rating, comment })
    if (!success) {
      return res.status(400).json({ error: 'UPDATE_FAILED' })
    }
    
    // Update game's average rating
    const newAverageRating = await ReviewModel.getAverageRating(existingReview.game_id)
    await GameModel.updateRating(existingReview.game_id, newAverageRating)
    
    res.json({ updated: true })
  } catch (error) {
    console.error('Error updating review:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Delete Review
router.delete('/reviews/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id
    const reviewId = parseInt(req.params.id || '0')
    
    // Check if review exists and belongs to user
    const existingReview = await ReviewModel.findById(reviewId)
    if (!existingReview || existingReview.user_id !== userId) {
      return res.status(404).json({ error: 'REVIEW_NOT_FOUND' })
    }
    
    const success = await ReviewModel.delete(reviewId)
    if (!success) {
      return res.status(400).json({ error: 'DELETE_FAILED' })
    }
    
    // Update game's average rating
    const newAverageRating = await ReviewModel.getAverageRating(existingReview.game_id)
    await GameModel.updateRating(existingReview.game_id, newAverageRating)
    
    res.json({ deleted: true })
  } catch (error) {
    console.error('Error deleting review:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Wishlist Management
router.get('/wishlist', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' })
    }
    const wishlist = await WishlistModel.findByUserIdWithDetails(userId)
    res.json({ wishlist })
  } catch (error) {
    console.error('Error fetching wishlist:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.post('/wishlist', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' })
    }
    const { game_id } = req.body
    
    // Check if already in wishlist
    const existing = await WishlistModel.findByUserAndGame(userId, game_id)
    if (existing) {
      return res.status(400).json({ error: 'ALREADY_IN_WISHLIST' })
    }
    
    const wishlistId = await WishlistModel.create({ user_id: userId, game_id })
    res.status(201).json({ created: true, wishlist_id: wishlistId })
  } catch (error) {
    console.error('Error adding to wishlist:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.delete('/wishlist/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' })
    }
    const wishlistId = parseInt(req.params.id || '0')
    
    // Check if wishlist item exists and belongs to user
    const existing = await WishlistModel.findById(wishlistId)
    if (!existing || existing.user_id !== userId) {
      return res.status(404).json({ error: 'WISHLIST_ITEM_NOT_FOUND' })
    }
    
    const success = await WishlistModel.delete(wishlistId)
    if (!success) {
      return res.status(400).json({ error: 'DELETE_FAILED' })
    }
    
    res.json({ deleted: true })
  } catch (error) {
    console.error('Error removing from wishlist:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Purchases Management
router.get('/purchases', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' })
    }
    const purchases = await PurchaseModel.findByUserIdWithDetails(userId)
    res.json({ purchases })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Create Purchase
router.post('/purchases', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' })
    }
    
    const { game_id } = req.body
    
    if (!game_id) {
      return res.status(400).json({ error: 'GAME_ID_REQUIRED' })
    }
    
    // Check if game exists
    const game = await GameModel.findById(game_id)
    if (!game) {
      return res.status(404).json({ error: 'GAME_NOT_FOUND' })
    }
    
    // Check if user already purchased this game
    const hasPurchased = await PurchaseModel.userHasPurchased(userId, game_id)
    if (hasPurchased) {
      return res.status(400).json({ error: 'ALREADY_PURCHASED' })
    }
    
    // Check if user has enough balance
    const user = await UserModel.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' })
    }
    
    if (user.balance < game.price) {
      return res.status(400).json({ error: 'INSUFFICIENT_BALANCE' })
    }
    
    // Create purchase
    const purchaseId = await PurchaseModel.create({ 
      user_id: userId, 
      game_id, 
      payment_method: 'bank_transfer' 
    })
    
    // Deduct balance
    const newBalance = user.balance - game.price
    await UserModel.update(userId, { balance: newBalance })
    
    // Record balance transaction (auto-approved for purchases)
    await BalanceTransactionModel.create({
      user_id: userId,
      amount: -game.price, // Negative for purchase
      balance_before: user.balance,
      balance_after: newBalance,
      transaction_type: 'PURCHASE',
      status: 'APPROVED',
      description: `Mua game: ${game.name}`,
      related_game_id: game_id
    })
    
    // Increment game downloads
    await GameModel.incrementDownloads(game_id)
    
    res.status(201).json({ 
      success: true, 
      purchase_id: purchaseId,
      new_balance: newBalance,
      message: 'Game purchased successfully'
    })
  } catch (error) {
    console.error('Error creating purchase:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Viewed Games Management
router.get('/viewed-games', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' })
    }
    const games = await ViewModel.findByUserIdWithDetails(userId)
    res.json({ games })
  } catch (error) {
    console.error('Error fetching viewed games:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Add view to game
router.post('/games/:id/view', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' })
    }
    const gameId = parseInt(req.params.id || '0')
    
    if (!gameId) {
      return res.status(400).json({ error: 'INVALID_GAME_ID' })
    }
    
    // Check if user exists
    const user = await UserModel.findById(userId)
    if (!user) {
      return res.status(401).json({ error: 'USER_NOT_FOUND' })
    }
    
    // Check if game exists
    const game = await GameModel.findById(gameId)
    if (!game) {
      return res.status(404).json({ error: 'GAME_NOT_FOUND' })
    }
    
    const viewId = await ViewModel.addView(userId, gameId)
    res.status(201).json({ added: true, view_id: viewId })
  } catch (error) {
    console.error('Error adding view:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Remove view from game
router.delete('/viewed-games/:gameId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' })
    }
    const gameId = parseInt(req.params.gameId || '0')
    
    const success = await ViewModel.deleteByUserAndGame(userId, gameId)
    if (success) {
      res.json({ removed: true })
    } else {
      res.status(404).json({ error: 'VIEW_NOT_FOUND' })
    }
  } catch (error) {
    console.error('Error removing view:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Get user's rating for a specific game
router.get('/ratings/:gameId', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id
    const gameId = parseInt(req.params.gameId || '0')
    
    const rating = await ReviewModel.findByUserAndGame(userId, gameId)
    res.json({ rating })
  } catch (error) {
    console.error('Error fetching user rating:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Create or update rating
router.post('/ratings', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.user_id
    const { game_id, rating, comment } = req.body
    
    if (!game_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'INVALID_RATING_DATA' })
    }
    
    // Check if user has purchased the game
    const hasPurchased = await PurchaseModel.userHasPurchased(userId, game_id)
    if (!hasPurchased) {
      return res.status(403).json({ error: 'MUST_PURCHASE_FIRST' })
    }
    
    // Create or update review using UPSERT
    const result = await ReviewModel.createOrUpdate({ user_id: userId, game_id, rating, comment })
    
    // Update game's average rating
    const newAverageRating = await ReviewModel.getAverageRating(game_id)
    await GameModel.updateRating(game_id, newAverageRating)
    
    if (result.isNew) {
      res.status(201).json({ 
        success: true, 
        review_id: result.review_id, 
        message: 'Rating created successfully' 
      })
    } else {
      res.json({ 
        success: true, 
        review_id: result.review_id, 
        message: 'Rating updated successfully' 
      })
    }
  } catch (error) {
    console.error('Error creating/updating rating:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Get reviews for a game
router.get('/games/:id/reviews', async (req: Request, res: Response) => {
  try {
    const gameId = parseInt(req.params.id!)
    
    const [rows] = await pool.execute(`
      SELECT r.*, u.name as user_name, u.email as user_email
      FROM \`Review\` r
      JOIN \`User\` u ON r.user_id = u.user_id
      WHERE r.game_id = ?
      ORDER BY r.created_at DESC
    `, [gameId])
    
    res.json({ reviews: rows })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Get balance transactions
router.get('/balance-transactions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' })
    }
    
    const limit = parseInt(req.query.limit as string) || 50
    const transactions = await BalanceTransactionModel.findByUserId(userId, limit)
    const stats = await BalanceTransactionModel.getStatsByUserId(userId)
    
    res.json({ 
      transactions,
      stats
    })
  } catch (error) {
    console.error('Error fetching balance transactions:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Request deposit
router.post('/deposit-request', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' })
    }
    
    const { amount, description } = req.body
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'INVALID_AMOUNT' })
    }
    
    // Get current balance
    const user = await UserModel.findById(userId)
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' })
    }
    
    // Create pending deposit transaction
    const transactionId = await BalanceTransactionModel.create({
      user_id: userId,
      amount: amount,
      balance_before: user.balance,
      balance_after: user.balance + amount, // Expected balance after approval
      transaction_type: 'DEPOSIT',
      status: 'PENDING',
      description: description || `Yêu cầu nạp ${new Intl.NumberFormat('vi-VN').format(amount)} VNĐ`
    })
    
    res.status(201).json({ 
      success: true,
      transaction_id: transactionId,
      message: 'Yêu cầu nạp tiền đã được gửi, vui lòng chờ admin duyệt'
    })
  } catch (error) {
    console.error('Error creating deposit request:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Get user's pending deposits
router.get('/pending-deposits', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.user_id
    if (!userId) {
      return res.status(401).json({ error: 'UNAUTHORIZED' })
    }
    
    const pendingDeposits = await BalanceTransactionModel.getUserPendingDeposits(userId)
    
    res.json({ pendingDeposits })
  } catch (error) {
    console.error('Error fetching pending deposits:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})


export default router


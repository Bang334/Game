import { Request, Response } from 'express'
import { GameModel, GenreModel, PlatformModel, PublisherModel } from '../models'
import { pool } from '../db'

export class GameController {
  /**
   * Get all games with filters and pagination
   */
  static async getAllGames(req: Request, res: Response) {
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
      console.error('Error in getAllGames:', error)
      res.status(500).json({ error: 'DB_ERROR' })
    }
  }

  /**
   * Get game by ID with full details
   */
  static async getGameById(req: Request, res: Response) {
    try {
      const gameId = parseInt(req.params.id || '0')
      const game = await GameModel.findByIdWithDetails(gameId)
      
      if (!game) {
        return res.status(404).json({ error: 'GAME_NOT_FOUND' })
      }
      
      // Format game with proper image handling
      const formattedGame = {
        ...game,
        image: game.image || null,
        screenshots: game.image ? [game.image] : [],
        genres: game.genres || [],
        platforms: game.platforms || []
      }
      
      res.json({ game: formattedGame })
    } catch (error) {
      console.error('Error in getGameById:', error)
      res.status(500).json({ error: 'DB_ERROR' })
    }
  }

  /**
   * Get top downloaded games
   */
  static async getTopDownloaded(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10
      const topGames = await GameModel.findTopDownloaded(limit)
      
      // Enrich with genres and platforms
      const gamesWithDetails = await Promise.all(
        topGames.map(async (game) => {
          // Get genres
          const [genreRows] = await pool.execute(`
            SELECT gen.name FROM Genre gen
            JOIN Game_Genre gg ON gen.genre_id = gg.genre_id
            WHERE gg.game_id = ?
          `, [game.game_id])
          const genres = (genreRows as any[]).map((row: any) => row.name)

          // Get platforms
          const [platformRows] = await pool.execute(`
            SELECT p.name FROM Platform p
            JOIN Game_Platform gp ON p.platform_id = gp.platform_id
            WHERE gp.game_id = ?
          `, [game.game_id])
          const platforms = (platformRows as any[]).map((row: any) => row.name)

          return {
            ...game,
            genres,
            platforms
          }
        })
      )
      
      res.json({ games: gamesWithDetails })
    } catch (error) {
      console.error('Error in getTopDownloaded:', error)
      res.status(500).json({ error: 'DB_ERROR' })
    }
  }

  /**
   * Get top rated games
   */
  static async getTopRated(req: Request, res: Response) {
    try {
      const limit = parseInt(req.query.limit as string) || 10
      const games = await GameModel.findTopRated(limit)
      res.json({ games })
    } catch (error) {
      console.error('Error in getTopRated:', error)
      res.status(500).json({ error: 'DB_ERROR' })
    }
  }

  /**
   * Get all genres
   */
  static async getAllGenres(req: Request, res: Response) {
    try {
      const genres = await GenreModel.findAll()
      res.json({ genres })
    } catch (error) {
      console.error('Error in getAllGenres:', error)
      res.status(500).json({ error: 'DB_ERROR' })
    }
  }

  /**
   * Get all platforms
   */
  static async getAllPlatforms(req: Request, res: Response) {
    try {
      const platforms = await PlatformModel.findAll()
      res.json({ platforms })
    } catch (error) {
      console.error('Error in getAllPlatforms:', error)
      res.status(500).json({ error: 'DB_ERROR' })
    }
  }

  /**
   * Get all publishers
   */
  static async getAllPublishers(req: Request, res: Response) {
    try {
      const publishers = await PublisherModel.findAll()
      res.json({ publishers })
    } catch (error) {
      console.error('Error in getAllPublishers:', error)
      res.status(500).json({ error: 'DB_ERROR' })
    }
  }
}




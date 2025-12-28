import { Request, Response } from 'express'
import axios from 'axios'
import { pool } from '../db'
import { GameModel } from '../models'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000'

export class RecommendationController {
  /**
   * Prepare data for AI service
   */
  private static async prepareGameData() {
    try {
      console.log('\n=== PREPARING GAME DATA ===')

      // Fetch all games with full details
      const [gamesRows] = await pool.query(`
        SELECT 
          g.game_id as id,
          g.name,
          g.description,
          g.price,
          g.release_date,
          g.image,
          g.downloads,
          g.mode,
          g.multiplayer,
          g.capacity,
          g.age_rating,
          g.link_download,
          g.average_rating as rating,
          pub.name as publisher
        FROM game g
        LEFT JOIN publisher pub ON g.publisher_id = pub.publisher_id
      `)

      const games = gamesRows as any[]

      // Fetch related data for each game
      for (const game of games) {
        // Genres
        const [genresRows] = await pool.query(`
          SELECT gen.name
          FROM game_genre gg
          JOIN genre gen ON gg.genre_id = gen.genre_id
          WHERE gg.game_id = ?
        `, [game.id])
        game.genre = (genresRows as any[]).map((g: any) => g.name)

        // Platforms
        const [platformsRows] = await pool.query(`
          SELECT p.name
          FROM game_platform gp
          JOIN platform p ON gp.platform_id = p.platform_id
          WHERE gp.game_id = ?
        `, [game.id])
        game.platform = (platformsRows as any[]).map((p: any) => p.name)

        // Languages
        const [languagesRows] = await pool.query(`
          SELECT l.name
          FROM game_language gl
          JOIN language l ON gl.language_id = l.language_id
          WHERE gl.game_id = ?
        `, [game.id])
        game.language = (languagesRows as any[]).map((l: any) => l.name)

        // Min specifications
        const [specsRows] = await pool.query(`
          SELECT cpu, gpu, ram
          FROM specification
          WHERE game_id = ? AND type = 'MIN'
          LIMIT 1
        `, [game.id])

        if ((specsRows as any[]).length > 0) {
          const spec = (specsRows as any[])[0]
          game.min_spec = {
            cpu: spec.cpu || '',
            gpu: spec.gpu || '',
            ram: spec.ram || '0GB'
          }
        } else {
          game.min_spec = { cpu: '', gpu: '', ram: '0GB' }
        }

        // Recommended specifications
        const [recSpecsRows] = await pool.query(`
          SELECT cpu, gpu, ram
          FROM specification
          WHERE game_id = ? AND type = 'REC'
          LIMIT 1
        `, [game.id])

        if ((recSpecsRows as any[]).length > 0) {
          const spec = (recSpecsRows as any[])[0]
          game.rec_spec = {
            cpu: spec.cpu || '',
            gpu: spec.gpu || '',
            ram: spec.ram || '0GB'
          }
        } else {
          game.rec_spec = { cpu: '', gpu: '', ram: '0GB' }
        }

        // Set defaults
        game.multiplayer = game.multiplayer || false
        game.capacity = game.capacity || 0
        game.age_rating = game.age_rating || 'Everyone'
        game.mode = game.mode || 'Single Player'
        game.link_download = game.link_download || ''
      }

      console.log(`✅ Prepared ${games.length} games`)
      return games
    } catch (error) {
      console.error('❌ Error preparing game data:', error)
      throw error
    }
  }

  /**
   * Prepare user data for AI service
   */
  private static async prepareUserData() {
    try {
      // Fetch all users
      const [usersRows] = await pool.query(`
        SELECT user_id as id, username as name, email, age, gender
        FROM user
      `)
      const users = usersRows as any[]

      // Fetch interactions for each user
      for (const user of users) {
        // Favorite games (from wishlist) - ALL TIME for SVD
        const [wishlistRows] = await pool.query(`
          SELECT game_id
          FROM wishlist
          WHERE user_id = ?
        `, [user.id])
        user.favorite_games = (wishlistRows as any[]).map((w: any) => w.game_id)

        // Purchased games with ratings - ALL TIME for SVD
        const [purchasedRows] = await pool.query(`
          SELECT p.game_id, COALESCE(r.rating, 3) as rating
          FROM purchase p
          LEFT JOIN review r ON p.user_id = r.user_id AND p.game_id = r.game_id
          WHERE p.user_id = ?
        `, [user.id])

        user.purchased_games = {}
        for (const purchase of (purchasedRows as any[])) {
          user.purchased_games[purchase.game_id] = purchase.rating
        }

        // View history - ALL TIME for SVD
        const [viewsRows] = await pool.query(`
          SELECT game_id, SUM(view_count) as view_count
          FROM view
          WHERE user_id = ?
          GROUP BY game_id
        `, [user.id])

        user.view_history = {}
        for (const view of (viewsRows as any[])) {
          user.view_history[view.game_id] = view.view_count || 1
        }

        // ⚡ PRE-FILTERED INTERACTIONS (Last 7 Days) for Adaptive Boosting
        // This MUST be limited to recent days to correctly reflect "current mood/trend"
        user.interactions = []

        // 1. Recent Wishlist
        const [recentWish] = await pool.query('SELECT game_id FROM wishlist WHERE user_id = ? AND created_at >= NOW() - INTERVAL 7 DAY', [user.id])
        for (const item of (recentWish as any[])) {
          user.interactions.push({ game_id: item.game_id, type: 'favorite' })
        }

        // 2. Recent Purchases
        const [recentPurch] = await pool.query(`
            SELECT p.game_id, COALESCE(r.rating, 3) as rating
            FROM purchase p
            LEFT JOIN review r ON p.user_id = r.user_id AND p.game_id = r.game_id
            WHERE p.user_id = ? AND p.purchase_date >= NOW() - INTERVAL 7 DAY
        `, [user.id])
        for (const item of (recentPurch as any[])) {
          user.interactions.push({ game_id: item.game_id, type: 'purchase', rating: item.rating })
        }

        // 3. Recent Views
        const [recentViews] = await pool.query('SELECT game_id, view_count FROM view WHERE user_id = ? AND viewed_at >= NOW() - INTERVAL 7 DAY', [user.id])
        for (const item of (recentViews as any[])) {
          user.interactions.push({ game_id: item.game_id, type: 'view', count: item.view_count })
        }

        // 4. Recent Reviews (that might not be recent purchases)
        const [recentReviews] = await pool.query(`
            SELECT game_id, COALESCE(rating, 3) as rating
            FROM review
            WHERE user_id = ? AND review_date >= NOW() - INTERVAL 7 DAY
        `, [user.id])

        for (const item of (recentReviews as any[])) {
          // Check if already recorded as a recent purchase to avoid duplicates
          const existing = user.interactions.find((i: any) => i.game_id === item.game_id && i.type === 'purchase')
          if (!existing) {
            user.interactions.push({ game_id: item.game_id, type: 'review', rating: item.rating })
          }
        }
      }

      console.log(`✅ Prepared ${users.length} users`)
      return users
    } catch (error) {
      console.error('❌ Error preparing user data:', error)
      throw error
    }
  }

  /**
   * Get AI-powered game recommendations
   */
  static async getRecommendations(req: Request, res: Response) {
    try {
      const { user_id, query, days, enable_adaptive } = req.query

      if (!user_id) {
        return res.status(400).json({
          success: false,
          error: 'USER_ID_REQUIRED',
          message: 'user_id query parameter is required'
        })
      }

      const userId = parseInt(user_id as string)
      const searchQuery = query ? (query as string).trim() : ''
      const recentDays = days ? parseInt(days as string) : null  // null = all time (SQLite data is old)
      const enableAdaptive = enable_adaptive === '1' || enable_adaptive === 'true' || enable_adaptive === undefined // Default: true

      console.log('\n=== RECOMMENDATION REQUEST ===')
      console.log('User ID:', userId)
      console.log('Search Query:', searchQuery || '(none)')
      console.log('Recent Days:', recentDays)
      console.log('enable_adaptive param:', enable_adaptive, '(raw)')
      console.log('enableAdaptive parsed:', enableAdaptive, '(parsed)')
      console.log('Adaptive Boost:', enableAdaptive ? 'ENABLED ⚡' : 'DISABLED 🔒')
      console.log('AI Service URL:', AI_SERVICE_URL)

      try {
        // Prepare data
        const games = await RecommendationController.prepareGameData()
        const users = await RecommendationController.prepareUserData()

        console.log('\n🚀 Calling AI Service...')
        console.log('Sending to AI: enable_adaptive =', enableAdaptive)

        // Call AI service
        // Request all games (or a large number) and let frontend handle pagination
        const requestBody = {
          user_id: userId,
          games: games,
          users: users,
          query: searchQuery,
          days: recentDays,
          enable_adaptive: enableAdaptive, // Pass adaptive boost setting to AI service
          top_n: games.length // Get all available games
        }

        console.log('Request body enable_adaptive:', requestBody.enable_adaptive)

        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/recommend`, requestBody, {
          timeout: 30000 // 30 second timeout
        })

        console.log('✅ AI Service responded successfully')
        console.log('Recommendations count:', aiResponse.data.games?.length || 0)

        // Transform recommendations to match frontend expectations
        const recommendations = (aiResponse.data.games || []).map((game: any) => ({
          game_id: game.id,
          name: game.name,
          price: game.price,
          image: game.image || '',
          description: game.description || '',
          average_rating: game.rating || 0,
          genres: game.genre || [],
          platforms: game.platform || [],
          publisher_name: game.publisher || '',
          score: game.score || 0
        }))

        console.log('=== RECOMMENDATION COMPLETED ===\n')

        res.json({
          success: true,
          games: recommendations,
          total: recommendations.length,
          message: 'AI recommendations generated successfully'
        })

      } catch (aiError: any) {
        console.error('❌ AI Service error:', aiError.message)

        // Fallback to regular games if AI service fails
        console.log('⚠️ Falling back to regular games list...')

        const games = await GameModel.findAllWithPublisherAndGenres()
        // Return all games for fallback as well
        const limitedGames = games

        res.json({
          success: true,
          games: limitedGames,
          total: limitedGames.length,
          message: 'Showing regular games (AI service unavailable)',
          fallback: true
        })
      }

    } catch (error) {
      console.error('❌ Recommendation controller error:', error)
      res.status(500).json({
        success: false,
        error: 'RECOMMENDATION_ERROR',
        message: 'Failed to get recommendations'
      })
    }
  }

  /**
   * Health check for AI service
   */
  static async checkAIServiceHealth(req: Request, res: Response) {
    try {
      const healthResponse = await axios.get(`${AI_SERVICE_URL}/health`, {
        timeout: 5000
      })

      res.json({
        success: true,
        ai_service: healthResponse.data,
        url: AI_SERVICE_URL
      })
    } catch (error: any) {
      res.json({
        success: false,
        error: 'AI_SERVICE_UNAVAILABLE',
        message: error.message,
        url: AI_SERVICE_URL
      })
    }
  }
}


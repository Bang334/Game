import { Request, Response } from 'express'
import axios from 'axios'
import { pool } from '../db'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000'

export class SimilarGamesController {
  /**
   * Get similar games for a specific game
   */
  static async getSimilarGames(req: Request, res: Response) {
    try {
      const gameId = parseInt(req.params.id || '0')
      const userId = req.query.user_id ? parseInt(req.query.user_id as string) : null
      
      if (!gameId) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_GAME_ID',
          message: 'Valid game ID is required'
        })
      }
      
      console.log('\n=== SIMILAR GAMES REQUEST ===')
      console.log('Game ID:', gameId)
      console.log('User ID:', userId || '(anonymous)')
      
      try {
        // Prepare games data
        const games = await SimilarGamesController.prepareGameData()
        
        // Get user's purchased games to exclude
        let excludePurchased: number[] = []
        if (userId) {
          const [purchasedRows] = await pool.query(`
            SELECT game_id FROM purchase WHERE user_id = ?
          `, [userId])
          excludePurchased = (purchasedRows as any[]).map(row => row.game_id)
        }
        
        console.log('🚀 Calling AI Service for similar games...')
        
        // Call AI service
        const aiResponse = await axios.post(`${AI_SERVICE_URL}/api/similar-games`, {
          game_id: gameId,
          games: games,
          top_n: 8,
          exclude_purchased: excludePurchased
        }, {
          timeout: 15000 // 15 second timeout
        })
        
        console.log('✅ AI Service responded successfully')
        console.log('Similar games count:', aiResponse.data.similar_games?.length || 0)
        
        res.json({
          success: true,
          game_id: gameId,
          game_name: aiResponse.data.game_name,
          similar_games: aiResponse.data.similar_games || [],
          total: aiResponse.data.total || 0,
          message: 'Similar games found successfully'
        })
        
      } catch (aiError: any) {
        console.error('❌ AI Service error:', aiError.message)
        
        // Fallback: Use database-based similarity
        console.log('⚠️ Falling back to database similarity...')
        
        const [targetGame] = await pool.query(`
          SELECT * FROM game WHERE game_id = ?
        `, [gameId])
        
        if ((targetGame as any[]).length === 0) {
          return res.status(404).json({
            success: false,
            error: 'GAME_NOT_FOUND',
            message: 'Game not found'
          })
        }
        
        // Simple SQL-based similarity (same genre, price range)
        const [similarGamesRows] = await pool.query(`
          SELECT DISTINCT g.*, p.name as publisher_name,
            (SELECT COUNT(*) FROM game_genre gg1 
             JOIN game_genre gg2 ON gg1.genre_id = gg2.genre_id
             WHERE gg1.game_id = g.game_id AND gg2.game_id = ?) as genre_match_count
          FROM game g
          JOIN publisher p ON g.publisher_id = p.publisher_id
          WHERE g.game_id != ?
            AND EXISTS (
              SELECT 1 FROM game_genre gg1
              JOIN game_genre gg2 ON gg1.genre_id = gg2.genre_id
              WHERE gg1.game_id = g.game_id AND gg2.game_id = ?
            )
          ORDER BY genre_match_count DESC, g.average_rating DESC
          LIMIT 8
        `, [gameId, gameId, gameId])
        
        // Transform to expected format
        const similarGames = (similarGamesRows as any[]).map(game => ({
          id: game.game_id,
          name: game.name,
          description: game.description || '',
          image: game.image || '',
          price: game.price,
          rating: game.average_rating,
          downloads: game.downloads,
          publisher: game.publisher_name,
          similarity_score: 0.75 // Default score for fallback
        }))
        
        res.json({
          success: true,
          game_id: gameId,
          similar_games: similarGames,
          total: similarGames.length,
          message: 'Similar games found (fallback method)',
          fallback: true
        })
      }
      
    } catch (error) {
      console.error('❌ Similar games controller error:', error)
      res.status(500).json({
        success: false,
        error: 'SIMILAR_GAMES_ERROR',
        message: 'Failed to get similar games'
      })
    }
  }
  
  /**
   * Prepare games data for AI service
   */
  private static async prepareGameData() {
    try {
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
          g.age_rating,
          g.average_rating as rating,
          pub.name as publisher
        FROM game g
        LEFT JOIN publisher pub ON g.publisher_id = pub.publisher_id
      `)
      
      const games = gamesRows as any[]
      
      // Fetch genres and platforms for each game
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
      }
      
      return games
    } catch (error) {
      console.error('❌ Error preparing game data:', error)
      throw error
    }
  }
}


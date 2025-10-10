import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { promisify } from 'util'
import { pool } from '../db'
import { GameModel, UserModel } from '../models'
import axios from 'axios'

const router = Router()
const execAsync = promisify(exec)

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me'
const PREDICT_DIR = path.join(__dirname, '../../../predict')
const PYTHON_SCRIPT = path.join(PREDICT_DIR, 'game_recommendation_system.py')
const RECOMMENDATIONS_FILE = path.join(PREDICT_DIR, 'recommendations.json')

// Flask API Configuration
const FLASK_API_URL = process.env.FLASK_API_URL ?? 'http://localhost:5000'
const USE_DIRECT_API = process.env.USE_DIRECT_API !== 'false' // Default: true

/**
 * Sync data from MySQL database to game.json for AI recommendation system
 */
async function syncDataToGameJson(): Promise<boolean> {
  try {
    console.log('\n=== SYNCING DATA TO GAME.JSON ===')
    
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
    
    // Fetch genres for each game
    for (const game of games) {
      const [genresRows] = await pool.query(`
        SELECT gen.name
        FROM game_genre gg
        JOIN genre gen ON gg.genre_id = gen.genre_id
        WHERE gg.game_id = ?
      `, [game.id])
      game.genre = (genresRows as any[]).map((g: any) => g.name)
      
      // Fetch platforms
      const [platformsRows] = await pool.query(`
        SELECT p.name
        FROM game_platform gp
        JOIN platform p ON gp.platform_id = p.platform_id
        WHERE gp.game_id = ?
      `, [game.id])
      game.platform = (platformsRows as any[]).map((p: any) => p.name)
      
      // Fetch languages
      const [languagesRows] = await pool.query(`
        SELECT l.name
        FROM game_language gl
        JOIN language l ON gl.language_id = l.language_id
        WHERE gl.game_id = ?
      `, [game.id])
      game.language = (languagesRows as any[]).map((l: any) => l.name)
      
      // Fetch specifications (MIN type)
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
      
      // Fetch recommended specs (REC type)
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
      
      // Use values from database or set defaults
      game.multiplayer = game.multiplayer || false
      game.capacity = game.capacity || 0
      game.age_rating = game.age_rating || 'Everyone'
      game.mode = game.mode || 'Single Player'
      game.link_download = game.link_download || ''
    }
    
    // Fetch all users with their interactions
    const [usersRows] = await pool.query(`
      SELECT user_id as id, username as name, email, age, gender
      FROM user
    `)
    const users = usersRows as any[]
    
    // Fetch favorite games (from wishlist)
    for (const user of users) {
      const [wishlistRows] = await pool.query(`
        SELECT game_id
        FROM wishlist
        WHERE user_id = ?
      `, [user.id])
      user.favorite_games = (wishlistRows as any[]).map((w: any) => w.game_id)
      
      // Fetch purchased games with ratings
      const [purchasedRows] = await pool.query(`
        SELECT p.game_id, COALESCE(r.rating, 3) as rating
        FROM purchase p
        LEFT JOIN review r ON p.user_id = r.user_id AND p.game_id = r.game_id
        WHERE p.user_id = ?
      `, [user.id])
      
      // Convert to object format: {"game_id": rating}
      user.purchased_games = {}
      for (const purchase of (purchasedRows as any[])) {
        user.purchased_games[purchase.game_id] = purchase.rating
      }
      
      // Fetch view history (use SUM of view_count from View table)
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
    }
    
    // Prepare final data structure
    const gameData = {
      games: games,
      users: users
    }
    
    // Write to game.json
    const gameJsonPath = path.join(PREDICT_DIR, 'game.json')
    fs.writeFileSync(gameJsonPath, JSON.stringify(gameData, null, 2), 'utf-8')
    
    console.log(`✅ Synced ${games.length} games and ${users.length} users to game.json`)
    console.log(`📁 File location: ${gameJsonPath}`)
    console.log('=== SYNC COMPLETED ===\n')
    
    return true
  } catch (error) {
    console.error('❌ Error syncing data to game.json:', error)
    return false
  }
}

/**
 * Get recommendations from Flask API (direct call - FASTER)
 */
async function getRecommendationsFromFlaskAPI(userId: number, keyword: string = '', topN: number = 20) {
  try {
    const url = `${FLASK_API_URL}/api/recommendations/${userId}`
    const params: any = { top_n: topN }
    
    if (keyword) {
      params.keyword = keyword
    }
    
    console.log(`🚀 Calling Flask API: ${url}`)
    console.log('   Params:', params)
    
    const response = await axios.get(url, { 
      params,
      timeout: 30000 // 30 seconds timeout
    })
    
    console.log(`✅ Flask API response: ${response.data.total} games`)
    
    return response.data
  } catch (error: any) {
    console.error('❌ Flask API call failed:', error.message)
    throw error
  }
}

/**
 * GET /api/reco/games
 * Get AI-powered game recommendations for a user
 * 
 * SUPPORTS TWO MODES:
 * 1. Direct Flask API call (DEFAULT - FASTER, no file I/O)
 * 2. Legacy Python script + file (fallback)
 */
router.get('/games', async (req: Request, res: Response) => {
  try {
    const { user_id, query } = req.query
    
    if (!user_id) {
      return res.status(400).json({ 
        success: false,
        error: 'USER_ID_REQUIRED',
        message: 'user_id query parameter is required'
      })
    }
    
    const userId = parseInt(user_id as string)
    const searchQuery = query ? (query as string).trim() : ''
    
    console.log('\n=== RECOMMENDATION REQUEST ===')
    console.log('User ID:', userId)
    console.log('Search Query:', searchQuery || '(none)')
    console.log('Mode:', USE_DIRECT_API ? 'FLASK API (Direct)' : 'Python Script (Legacy)')
    
    // Sync data first (this ensures game.json is up-to-date for AI)
    console.log('Syncing data to game.json...')
    const syncSuccess = await syncDataToGameJson()
    
    if (!syncSuccess) {
      console.log('⚠️  Sync failed, but continuing')
    }
    
    // ============================================================
    // MODE 1: Direct Flask API Call (FASTER - NO FILE I/O)
    // ============================================================
    if (USE_DIRECT_API) {
      try {
        const flaskResponse = await getRecommendationsFromFlaskAPI(userId, searchQuery, 20)
        
        // Transform Flask API response to match frontend expectations
        const recommendations = (flaskResponse.games || []).map((game: any) => ({
          game_id: game.id,
          name: game.name,
          price: game.price,
          image: game.image || '',
          description: game.description || '',
          average_rating: game.rating || 0,
          genres: game.genre || [],
          platforms: game.platform || [],
          publisher_name: game.publisher || '',
          score: game.score || 0, // AI recommendation score (already boosted)
          boost_factor: game.boost_factor || 1.0
        }))
        
        console.log('=== RECOMMENDATION COMPLETED (Flask API) ===\n')
        
        return res.json({
          success: true,
          games: recommendations,
          total: recommendations.length,
          message: 'AI recommendations from Flask API',
          method: 'flask_api'
        })
        
      } catch (flaskError: any) {
        console.error('❌ Flask API failed, falling back to Python script...')
        // Continue to Python script fallback below
      }
    }
    
    // ============================================================
    // MODE 2: Legacy Python Script + File (FALLBACK)
    // ============================================================
    let pythonCommand = `python "${PYTHON_SCRIPT}" --user ${userId} --chart 0`
    if (searchQuery) {
      pythonCommand += ` --query "${searchQuery}"`
    }
    
    console.log(`Running Python script: ${pythonCommand}`)
    
    try {
      // Execute Python script
      const { stdout, stderr } = await execAsync(pythonCommand, { cwd: PREDICT_DIR })
      
      if (stderr) {
        console.warn('Python script stderr:', stderr)
      }
      
      console.log('✅ Python script completed successfully')
      
      // Read recommendations.json file
      if (!fs.existsSync(RECOMMENDATIONS_FILE)) {
        throw new Error('recommendations.json file not found')
      }
      
      const recommendationsData = JSON.parse(
        fs.readFileSync(RECOMMENDATIONS_FILE, 'utf-8')
      )
      
      console.log('✅ Recommendations loaded from file')
      console.log('Recommendations count:', recommendationsData.games?.length || 0)
      
      // Transform recommendations to match frontend expectations
      const recommendations = (recommendationsData.games || []).map((game: any) => ({
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
      
      console.log('=== RECOMMENDATION COMPLETED (Python Script) ===\n')
      
      res.json({
        success: true,
        games: recommendations,
        total: recommendations.length,
        message: 'AI recommendations from Python script',
        method: 'python_script'
      })
      
    } catch (pythonError: any) {
      console.error('❌ Python script error:', pythonError)
      
      // Final fallback: regular games from database
      console.log('Falling back to regular games list...')
      
      const games = await GameModel.findAllWithPublisherAndGenres()
      const limitedGames = games.slice(0, 20)
      
      res.json({
        success: true,
        games: limitedGames,
        total: limitedGames.length,
        message: 'Showing regular games (AI service unavailable)',
        fallback: true,
        method: 'database_fallback'
      })
    }
    
  } catch (error) {
    console.error('❌ Recommendation endpoint error:', error)
    res.status(500).json({ 
      success: false,
      error: 'RECOMMENDATION_ERROR',
      message: 'Failed to get recommendations'
    })
  }
})

/**
 * POST /api/reco/sync
 * Manually trigger data sync to game.json
 */
router.post('/sync', async (_req: Request, res: Response) => {
  try {
    console.log('Manual sync triggered...')
    const success = await syncDataToGameJson()
    
    if (success) {
      res.json({ 
        success: true, 
        message: 'Data synced successfully to game.json' 
      })
    } else {
      res.status(500).json({ 
        success: false,
        error: 'SYNC_FAILED',
        message: 'Failed to sync data to game.json' 
      })
    }
  } catch (error) {
    console.error('Sync endpoint error:', error)
    res.status(500).json({ 
      success: false,
      error: 'SYNC_ERROR',
      message: 'Error during sync operation'
    })
  }
})

export default router


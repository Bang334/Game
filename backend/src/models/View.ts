import { pool } from '../db'

export interface View {
  view_id: number
  user_id: number
  game_id: number
  viewed_at?: string
  view_count?: number
}

export interface ViewWithDetails extends View {
  name: string
  price: number
  image?: string
  description?: string
  average_rating?: number
  publisher_name?: string
  genres?: string[]
  platforms?: string[]
}

export class ViewModel {
  static async create(data: { user_id: number; game_id: number }): Promise<number> {
    const [result] = await pool.execute(
      'INSERT INTO `View` (user_id, game_id) VALUES (?, ?)',
      [data.user_id, data.game_id]
    )
    return (result as any).insertId
  }

  static async findByUserId(userId: number): Promise<View[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM `View` WHERE user_id = ? ORDER BY view_id DESC',
      [userId]
    )
    return rows as View[]
  }

  static async findByUserIdWithDetails(userId: number): Promise<ViewWithDetails[]> {
    const [rows] = await pool.execute(`
      SELECT 
        v.view_id,
        v.user_id,
        v.game_id,
        v.viewed_at,
        v.view_count,
        g.name,
        g.price,
        g.image,
        g.description,
        g.average_rating,
        p.name as publisher_name
      FROM \`View\` v
      JOIN \`Game\` g ON v.game_id = g.game_id
      LEFT JOIN \`Publisher\` p ON g.publisher_id = p.publisher_id
      WHERE v.user_id = ?
      ORDER BY v.viewed_at DESC
    `, [userId])
    
    const views = rows as any[]
    
    // Get genres for each game
    for (const view of views) {
      const [genreRows] = await pool.execute(`
        SELECT g.name 
        FROM \`Genre\` g
        JOIN \`Game_Genre\` gg ON g.genre_id = gg.genre_id
        WHERE gg.game_id = ?
      `, [view.game_id])
      view.genres = (genreRows as any[]).map(row => row.name)
      
      // Get platforms for each game
      const [platformRows] = await pool.execute(`
        SELECT p.name 
        FROM \`Platform\` p
        JOIN \`Game_Platform\` gp ON p.platform_id = gp.platform_id
        WHERE gp.game_id = ?
      `, [view.game_id])
      view.platforms = (platformRows as any[]).map(row => row.name)
    }
    
    return views as ViewWithDetails[]
  }

  static async findByUserAndGame(userId: number, gameId: number): Promise<View | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM `View` WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    )
    const views = rows as View[]
    return views.length > 0 ? views[0]! : null
  }

  static async delete(viewId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM `View` WHERE view_id = ?',
      [viewId]
    )
    return (result as any).affectedRows > 0
  }

  static async deleteByUserAndGame(userId: number, gameId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM `View` WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    )
    return (result as any).affectedRows > 0
  }

  static async addView(userId: number, gameId: number): Promise<number> {
    // Check if view already exists
    const existing = await this.findByUserAndGame(userId, gameId)
    if (existing) {
      // Update the existing view timestamp and increment view count
      await pool.execute(
        'UPDATE `View` SET viewed_at = CURRENT_TIMESTAMP, view_count = view_count + 1 WHERE view_id = ?',
        [existing.view_id]
      )
      return existing.view_id
    }
    
    // Create new view with initial count of 1
    const [result] = await pool.execute(
      'INSERT INTO `View` (user_id, game_id, view_count) VALUES (?, ?, 1)',
      [userId, gameId]
    )
    return (result as any).insertId
  }
}
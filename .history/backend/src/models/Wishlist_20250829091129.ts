import { pool } from '../db'

export interface Wishlist {
  wishlist_id: number
  user_id: number
  game_id: number
}

export interface CreateWishlistData {
  user_id: number
  game_id: number
}

export interface WishlistWithDetails extends Wishlist {
  username: string
  game_name: string
  publisher_name: string
  price: number
  average_rating: number
}

export class WishlistModel {
  // Get all wishlist items
  static async findAll(): Promise<Wishlist[]> {
    const [rows] = await pool.execute('SELECT * FROM Wishlist ORDER BY wishlist_id')
    return rows as Wishlist[]
  }

  // Get wishlist item by ID
  static async findById(wishlistId: number): Promise<Wishlist | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Wishlist WHERE wishlist_id = ?',
      [wishlistId]
    )
    const items = rows as Wishlist[]
    return items.length > 0 ? items[0] : null
  }

  // Get user's wishlist
  static async findByUserId(userId: number): Promise<Wishlist[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM Wishlist WHERE user_id = ? ORDER BY wishlist_id',
      [userId]
    )
    return rows as Wishlist[]
  }

  // Get wishlist items for a specific game
  static async findByGameId(gameId: number): Promise<Wishlist[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM Wishlist WHERE game_id = ? ORDER BY wishlist_id',
      [gameId]
    )
    return rows as Wishlist[]
  }

  // Get user's wishlist with game details
  static async findByUserIdWithDetails(userId: number): Promise<WishlistWithDetails[]> {
    const [rows] = await pool.execute(`
      SELECT w.*, u.username, g.name as game_name, p.name as publisher_name, g.price, g.average_rating
      FROM Wishlist w
      JOIN User u ON w.user_id = u.user_id
      JOIN Game g ON w.game_id = g.game_id
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE w.user_id = ?
      ORDER BY w.wishlist_id
    `, [userId])
    return rows as WishlistWithDetails[]
  }

  // Check if game is in user's wishlist
  static async isInWishlist(userId: number, gameId: number): Promise<boolean> {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM Wishlist WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    )
    return (rows as any)[0].count > 0
  }

  // Add game to wishlist
  static async addToWishlist(data: CreateWishlistData): Promise<number> {
    try {
      const [result] = await pool.execute(
        'INSERT INTO Wishlist (user_id, game_id) VALUES (?, ?)',
        [data.user_id, data.game_id]
      )
      return (result as any).insertId
    } catch (error) {
      throw new Error('Game is already in wishlist or invalid data')
    }
  }

  // Remove game from wishlist
  static async removeFromWishlist(userId: number, gameId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Wishlist WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    )
    return (result as any).affectedRows > 0
  }

  // Remove wishlist item by ID
  static async delete(wishlistId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Wishlist WHERE wishlist_id = ?',
      [wishlistId]
    )
    return (result as any).affectedRows > 0
  }

  // Get wishlist statistics
  static async getWishlistStats(): Promise<{
    total_items: number
    unique_users: number
    unique_games: number
  }> {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT game_id) as unique_games
      FROM Wishlist
    `)
    const result = (rows as any)[0]
    return {
      total_items: result.total_items || 0,
      unique_users: result.unique_users || 0,
      unique_games: result.unique_games || 0
    }
  }

  // Get user wishlist statistics
  static async getUserWishlistStats(userId: number): Promise<{
    total_items: number
    total_value: number
    average_rating: number
  }> {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(w.wishlist_id) as total_items,
        SUM(g.price) as total_value,
        AVG(g.average_rating) as average_rating
      FROM Wishlist w
      JOIN Game g ON w.game_id = g.game_id
      WHERE w.user_id = ?
    `, [userId])
    const result = (rows as any)[0]
    return {
      total_items: result.total_items || 0,
      total_value: result.total_value || 0,
      average_rating: result.average_rating || 0
    }
  }

  // Get most wished games
  static async getMostWishedGames(limit: number = 10): Promise<{
    game_id: number
    game_name: string
    publisher_name: string
    wishlist_count: number
    price: number
    average_rating: number
  }[]> {
    const [rows] = await pool.execute(`
      SELECT 
        g.game_id,
        g.name as game_name,
        p.name as publisher_name,
        COUNT(w.wishlist_id) as wishlist_count,
        g.price,
        g.average_rating
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      LEFT JOIN Wishlist w ON g.game_id = w.game_id
      GROUP BY g.game_id
      ORDER BY wishlist_count DESC, g.average_rating DESC
      LIMIT ?
    `, [limit])
    return rows as {
      game_id: number
      game_name: string
      publisher_name: string
      wishlist_count: number
      price: number
      average_rating: number
    }[]
  }

  // Clear user's wishlist
  static async clearUserWishlist(userId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Wishlist WHERE user_id = ?',
      [userId]
    )
    return (result as any).affectedRows > 0
  }
}

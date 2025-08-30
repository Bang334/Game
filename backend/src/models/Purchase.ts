import { pool } from '../db'

export interface Purchase {
  purchase_id: number
  user_id: number
  game_id: number
  purchase_date: Date
  price: number
}

export interface CreatePurchaseData {
  user_id: number
  game_id: number
  price: number
}

export interface PurchaseWithDetails extends Purchase {
  username: string
  game_name: string
  publisher_name: string
}

export class PurchaseModel {
  // Get all purchases
  static async findAll(): Promise<Purchase[]> {
    const [rows] = await pool.execute('SELECT * FROM Purchase ORDER BY purchase_date DESC')
    return rows as Purchase[]
  }

  // Get purchase by ID
  static async findById(purchaseId: number): Promise<Purchase | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Purchase WHERE purchase_id = ?',
      [purchaseId]
    )
    const purchases = rows as Purchase[]
    return purchases.length > 0 ? purchases[0]! : null
  }

  // Get purchases by user ID
  static async findByUserId(userId: number): Promise<Purchase[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM Purchase WHERE user_id = ? ORDER BY purchase_date DESC',
      [userId]
    )
    return rows as Purchase[]
  }

  // Get purchases by game ID
  static async findByGameId(gameId: number): Promise<Purchase[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM Purchase WHERE game_id = ? ORDER BY purchase_date DESC',
      [gameId]
    )
    return rows as Purchase[]
  }

  // Get purchases with detailed information
  static async findAllWithDetails(): Promise<PurchaseWithDetails[]> {
    const [rows] = await pool.execute(`
      SELECT p.*, u.username, g.name as game_name, pub.name as publisher_name
      FROM Purchase p
      JOIN User u ON p.user_id = u.user_id
      JOIN Game g ON p.game_id = g.game_id
      JOIN Publisher pub ON g.publisher_id = pub.publisher_id
      ORDER BY p.purchase_date DESC
    `)
    return rows as PurchaseWithDetails[]
  }

  // Get user purchases with details
  static async findByUserIdWithDetails(userId: number): Promise<PurchaseWithDetails[]> {
    const [rows] = await pool.execute(`
      SELECT p.*, u.username, g.name as game_name, pub.name as publisher_name
      FROM Purchase p
      JOIN User u ON p.user_id = u.user_id
      JOIN Game g ON p.game_id = g.game_id
      JOIN Publisher pub ON g.publisher_id = pub.publisher_id
      WHERE p.user_id = ?
      ORDER BY p.purchase_date DESC
    `, [userId])
    return rows as PurchaseWithDetails[]
  }

  // Check if user has purchased a specific game
  static async userHasPurchased(userId: number, gameId: number): Promise<boolean> {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM Purchase WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    )
    return (rows as any)[0].count > 0
  }

  // Get purchase statistics
  static async getPurchaseStats(): Promise<{
    total_purchases: number
    total_revenue: number
    average_price: number
  }> {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as total_purchases,
        SUM(price) as total_revenue,
        AVG(price) as average_price
      FROM Purchase
    `)
    const result = (rows as any)[0]
    return {
      total_purchases: result.total_purchases || 0,
      total_revenue: result.total_revenue || 0,
      average_price: result.average_price || 0
    }
  }

  // Get user purchase statistics
  static async getUserPurchaseStats(userId: number): Promise<{
    total_purchases: number
    total_spent: number
    average_price: number
  }> {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as total_purchases,
        SUM(price) as total_spent,
        AVG(price) as average_price
      FROM Purchase
      WHERE user_id = ?
    `, [userId])
    const result = (rows as any)[0]
    return {
      total_purchases: result.total_purchases || 0,
      total_spent: result.total_spent || 0,
      average_price: result.average_price || 0
    }
  }

  // Create new purchase
  static async create(data: CreatePurchaseData): Promise<number> {
    const [result] = await pool.execute(
      'INSERT INTO Purchase (user_id, game_id, price) VALUES (?, ?, ?)',
      [data.user_id, data.game_id, data.price]
    )
    return (result as any).insertId
  }

  // Delete purchase
  static async delete(purchaseId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Purchase WHERE purchase_id = ?',
      [purchaseId]
    )
    return (result as any).affectedRows > 0
  }

  // Get recent purchases (last N days)
  static async findRecentPurchases(days: number = 30): Promise<PurchaseWithDetails[]> {
    const [rows] = await pool.execute(`
      SELECT p.*, u.username, g.name as game_name, pub.name as publisher_name
      FROM Purchase p
      JOIN User u ON p.user_id = u.user_id
      JOIN Game g ON p.game_id = g.game_id
      JOIN Publisher pub ON g.publisher_id = pub.publisher_id
      WHERE p.purchase_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY p.purchase_date DESC
    `, [days])
    return rows as PurchaseWithDetails[]
  }

  // Get top selling games by purchase count
  static async getTopSellingGames(limit: number = 10): Promise<{
    game_id: number
    game_name: string
    publisher_name: string
    purchase_count: number
    total_revenue: number
  }[]> {
    const [rows] = await pool.execute(`
      SELECT 
        g.game_id,
        g.name as game_name,
        p.name as publisher_name,
        COUNT(pur.purchase_id) as purchase_count,
        SUM(pur.price) as total_revenue
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      LEFT JOIN Purchase pur ON g.game_id = pur.game_id
      GROUP BY g.game_id
      ORDER BY purchase_count DESC, total_revenue DESC
      LIMIT ?
    `, [limit])
    return rows as {
      game_id: number
      game_name: string
      publisher_name: string
      purchase_count: number
      total_revenue: number
    }[]
  }
}

import { pool } from '../db'

export interface Purchase {
  purchase_id: number
  user_id: number
  game_id: number
  purchase_date: Date
  payment_method: string
}

export interface CreatePurchaseData {
  user_id: number
  game_id: number
  payment_method?: string
}

export interface PurchaseWithDetails extends Purchase {
  username: string
  game_name: string
  image: string | null
  description: string | null
  publisher_name: string
  price: number
  average_rating: number
  link_download: string | null
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
      SELECT p.*, u.username, g.name as game_name, g.image, g.description, g.price, g.average_rating, g.link_download, pub.name as publisher_name
      FROM \`Purchase\` p
      JOIN \`User\` u ON p.user_id = u.user_id
      JOIN \`Game\` g ON p.game_id = g.game_id
      JOIN \`Publisher\` pub ON g.publisher_id = pub.publisher_id
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
  }> {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as total_purchases
      FROM Purchase
    `)
    const result = (rows as any)[0]
    return {
      total_purchases: result.total_purchases || 0
    }
  }

  // Get user purchase statistics
  static async getUserPurchaseStats(userId: number): Promise<{
    total_purchases: number
  }> {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as total_purchases
      FROM Purchase
      WHERE user_id = ?
    `, [userId])
    const result = (rows as any)[0]
    return {
      total_purchases: result.total_purchases || 0
    }
  }

  // Create new purchase
  static async create(data: CreatePurchaseData): Promise<number> {
    const [result] = await pool.execute(
      'INSERT INTO Purchase (user_id, game_id, payment_method) VALUES (?, ?, ?)',
      [data.user_id, data.game_id, data.payment_method || 'bank_transfer']
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
  }[]> {
    const [rows] = await pool.execute(`
      SELECT 
        g.game_id,
        g.name as game_name,
        p.name as publisher_name,
        COUNT(pur.purchase_id) as purchase_count
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      LEFT JOIN Purchase pur ON g.game_id = pur.game_id
      GROUP BY g.game_id
      ORDER BY purchase_count DESC
      LIMIT ?
    `, [limit])
    return rows as {
      game_id: number
      game_name: string
      publisher_name: string
      purchase_count: number
    }[]
  }
}

import { pool } from '../db'

export interface Review {
  review_id: number
  user_id: number
  game_id: number
  rating: number
  comment: string | null
  review_date: Date
}

export interface CreateReviewData {
  user_id: number
  game_id: number
  rating: number
  comment?: string
}

export interface UpdateReviewData {
  rating?: number
  comment?: string
}

export interface ReviewWithDetails extends Review {
  username: string
  game_name: string
  publisher_name: string
}

export class ReviewModel {
  // Get all reviews
  static async findAll(): Promise<Review[]> {
    const [rows] = await pool.execute('SELECT * FROM Review ORDER BY review_date DESC')
    return rows as Review[]
  }

  // Get review by ID
  static async findById(reviewId: number): Promise<Review | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Review WHERE review_id = ?',
      [reviewId]
    )
    const reviews = rows as Review[]
    return reviews.length > 0 ? reviews[0] : null
  }

  // Get reviews by user ID
  static async findByUserId(userId: number): Promise<Review[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM Review WHERE user_id = ? ORDER BY review_date DESC',
      [userId]
    )
    return rows as Review[]
  }

  // Get reviews by game ID
  static async findByGameId(gameId: number): Promise<Review[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM Review WHERE game_id = ? ORDER BY review_date DESC',
      [gameId]
    )
    return rows as Review[]
  }

  // Get user's review for a specific game
  static async findByUserAndGame(userId: number, gameId: number): Promise<Review | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Review WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    )
    const reviews = rows as Review[]
    return reviews.length > 0 ? reviews[0] : null
  }

  // Get reviews with detailed information
  static async findAllWithDetails(): Promise<ReviewWithDetails[]> {
    const [rows] = await pool.execute(`
      SELECT r.*, u.username, g.name as game_name, p.name as publisher_name
      FROM Review r
      JOIN User u ON r.user_id = u.user_id
      JOIN Game g ON r.game_id = g.game_id
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      ORDER BY r.review_date DESC
    `)
    return rows as ReviewWithDetails[]
  }

  // Get game reviews with details
  static async findByGameIdWithDetails(gameId: number): Promise<ReviewWithDetails[]> {
    const [rows] = await pool.execute(`
      SELECT r.*, u.username, g.name as game_name, p.name as publisher_name
      FROM Review r
      JOIN User u ON r.user_id = u.user_id
      JOIN Game g ON r.game_id = g.game_id
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE r.game_id = ?
      ORDER BY r.review_date DESC
    `, [gameId])
    return rows as ReviewWithDetails[]
  }

  // Get user reviews with details
  static async findByUserIdWithDetails(userId: number): Promise<ReviewWithDetails[]> {
    const [rows] = await pool.execute(`
      SELECT r.*, u.username, g.name as game_name, p.name as publisher_name
      FROM Review r
      JOIN User u ON r.user_id = u.user_id
      JOIN Game g ON r.game_id = g.game_id
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE r.user_id = ?
      ORDER BY r.review_date DESC
    `, [userId])
    return rows as ReviewWithDetails[]
  }

  // Check if user has reviewed a specific game
  static async userHasReviewed(userId: number, gameId: number): Promise<boolean> {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM Review WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    )
    return (rows as any)[0].count > 0
  }

  // Get average rating for a game
  static async getAverageRating(gameId: number): Promise<number> {
    const [rows] = await pool.execute(
      'SELECT AVG(rating) as avg_rating FROM Review WHERE game_id = ?',
      [gameId]
    )
    const result = (rows as any)[0]
    return result.avg_rating || 0
  }

  // Get rating distribution for a game
  static async getRatingDistribution(gameId: number): Promise<{
    rating: number
    count: number
  }[]> {
    const [rows] = await pool.execute(`
      SELECT rating, COUNT(*) as count
      FROM Review
      WHERE game_id = ?
      GROUP BY rating
      ORDER BY rating DESC
    `, [gameId])
    return rows as { rating: number; count: number }[]
  }

  // Create new review
  static async create(data: CreateReviewData): Promise<number> {
    const [result] = await pool.execute(
      'INSERT INTO Review (user_id, game_id, rating, comment) VALUES (?, ?, ?, ?)',
      [data.user_id, data.game_id, data.rating, data.comment || null]
    )
    return (result as any).insertId
  }

  // Update review
  static async update(reviewId: number, data: UpdateReviewData): Promise<boolean> {
    const fields: string[] = []
    const values: any[] = []

    if (data.rating !== undefined) {
      fields.push('rating = ?')
      values.push(data.rating)
    }
    if (data.comment !== undefined) {
      fields.push('comment = ?')
      values.push(data.comment)
    }

    if (fields.length === 0) return false

    values.push(reviewId)
    const [result] = await pool.execute(
      `UPDATE Review SET ${fields.join(', ')} WHERE review_id = ?`,
      values
    )
    return (result as any).affectedRows > 0
  }

  // Delete review
  static async delete(reviewId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Review WHERE review_id = ?',
      [reviewId]
    )
    return (result as any).affectedRows > 0
  }

  // Delete user's review for a specific game
  static async deleteByUserAndGame(userId: number, gameId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Review WHERE user_id = ? AND game_id = ?',
      [userId, gameId]
    )
    return (result as any).affectedRows > 0
  }

  // Get review statistics
  static async getReviewStats(): Promise<{
    total_reviews: number
    average_rating: number
    unique_users: number
    unique_games: number
  }> {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT game_id) as unique_games
      FROM Review
    `)
    const result = (rows as any)[0]
    return {
      total_reviews: result.total_reviews || 0,
      average_rating: result.average_rating || 0,
      unique_users: result.unique_users || 0,
      unique_games: result.unique_games || 0
    }
  }

  // Get user review statistics
  static async getUserReviewStats(userId: number): Promise<{
    total_reviews: number
    average_rating: number
    highest_rating: number
    lowest_rating: number
  }> {
    const [rows] = await pool.execute(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        MAX(rating) as highest_rating,
        MIN(rating) as lowest_rating
      FROM Review
      WHERE user_id = ?
    `, [userId])
    const result = (rows as any)[0]
    return {
      total_reviews: result.total_reviews || 0,
      average_rating: result.average_rating || 0,
      highest_rating: result.highest_rating || 0,
      lowest_rating: result.lowest_rating || 0
    }
  }

  // Get recent reviews (last N days)
  static async findRecentReviews(days: number = 30): Promise<ReviewWithDetails[]> {
    const [rows] = await pool.execute(`
      SELECT r.*, u.username, g.name as game_name, p.name as publisher_name
      FROM Review r
      JOIN User u ON r.user_id = u.user_id
      JOIN Game g ON r.game_id = g.game_id
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE r.review_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY r.review_date DESC
    `, [days])
    return rows as ReviewWithDetails[]
  }

  // Get top rated games by average rating
  static async getTopRatedGames(limit: number = 10): Promise<{
    game_id: number
    game_name: string
    publisher_name: string
    average_rating: number
    review_count: number
  }[]> {
    const [rows] = await pool.execute(`
      SELECT 
        g.game_id,
        g.name as game_name,
        p.name as publisher_name,
        AVG(r.rating) as average_rating,
        COUNT(r.review_id) as review_count
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      LEFT JOIN Review r ON g.game_id = r.game_id
      GROUP BY g.game_id
      HAVING review_count > 0
      ORDER BY average_rating DESC, review_count DESC
      LIMIT ?
    `, [limit])
    return rows as {
      game_id: number
      game_name: string
      publisher_name: string
      average_rating: number
      review_count: number
    }[]
  }
}

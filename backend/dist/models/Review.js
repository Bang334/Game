"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewModel = void 0;
const db_1 = require("../db");
class ReviewModel {
    // Get all reviews
    static async findAll() {
        const [rows] = await db_1.pool.execute('SELECT * FROM Review ORDER BY review_date DESC');
        return rows;
    }
    // Get review by ID
    static async findById(reviewId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Review WHERE review_id = ?', [reviewId]);
        const reviews = rows;
        return reviews.length > 0 ? reviews[0] : null;
    }
    // Get reviews by user ID
    static async findByUserId(userId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Review WHERE user_id = ? ORDER BY review_date DESC', [userId]);
        return rows;
    }
    // Get reviews by game ID
    static async findByGameId(gameId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Review WHERE game_id = ? ORDER BY review_date DESC', [gameId]);
        return rows;
    }
    // Get user's review for a specific game
    static async findByUserAndGame(userId, gameId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Review WHERE user_id = ? AND game_id = ?', [userId, gameId]);
        const reviews = rows;
        return reviews.length > 0 ? reviews[0] : null;
    }
    // Get reviews with detailed information
    static async findAllWithDetails() {
        const [rows] = await db_1.pool.execute(`
      SELECT r.*, u.username, g.name as game_name, p.name as publisher_name
      FROM Review r
      JOIN User u ON r.user_id = u.user_id
      JOIN Game g ON r.game_id = g.game_id
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      ORDER BY r.review_date DESC
    `);
        return rows;
    }
    // Get game reviews with details
    static async findByGameIdWithDetails(gameId) {
        const [rows] = await db_1.pool.execute(`
      SELECT r.*, u.username, g.name as game_name, p.name as publisher_name
      FROM Review r
      JOIN User u ON r.user_id = u.user_id
      JOIN Game g ON r.game_id = g.game_id
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE r.game_id = ?
      ORDER BY r.review_date DESC
    `, [gameId]);
        return rows;
    }
    // Get user reviews with details
    static async findByUserIdWithDetails(userId) {
        const [rows] = await db_1.pool.execute(`
      SELECT r.*, u.username, g.name as game_name, p.name as publisher_name
      FROM Review r
      JOIN User u ON r.user_id = u.user_id
      JOIN Game g ON r.game_id = g.game_id
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE r.user_id = ?
      ORDER BY r.review_date DESC
    `, [userId]);
        return rows;
    }
    // Check if user has reviewed a specific game
    static async userHasReviewed(userId, gameId) {
        const [rows] = await db_1.pool.execute('SELECT COUNT(*) as count FROM Review WHERE user_id = ? AND game_id = ?', [userId, gameId]);
        return rows[0].count > 0;
    }
    // Get average rating for a game
    static async getAverageRating(gameId) {
        const [rows] = await db_1.pool.execute('SELECT AVG(rating) as avg_rating FROM Review WHERE game_id = ?', [gameId]);
        const result = rows[0];
        return result.avg_rating || 0;
    }
    // Get rating distribution for a game
    static async getRatingDistribution(gameId) {
        const [rows] = await db_1.pool.execute(`
      SELECT rating, COUNT(*) as count
      FROM Review
      WHERE game_id = ?
      GROUP BY rating
      ORDER BY rating DESC
    `, [gameId]);
        return rows;
    }
    // Create new review
    static async create(data) {
        const [result] = await db_1.pool.execute('INSERT INTO Review (user_id, game_id, rating, comment) VALUES (?, ?, ?, ?)', [data.user_id, data.game_id, data.rating, data.comment || null]);
        return result.insertId;
    }
    // Create or update review (UPSERT)
    static async createOrUpdate(data) {
        const [result] = await db_1.pool.execute(`INSERT INTO Review (user_id, game_id, rating, comment) 
       VALUES (?, ?, ?, ?) 
       ON DUPLICATE KEY UPDATE 
       rating = VALUES(rating), 
       comment = VALUES(comment),
       review_date = CURRENT_TIMESTAMP`, [data.user_id, data.game_id, data.rating, data.comment || null]);
        const insertId = result.insertId;
        const affectedRows = result.affectedRows;
        // If affectedRows is 1, it's a new insert
        // If affectedRows is 2, it's an update
        const isNew = affectedRows === 1;
        return {
            review_id: insertId || await this.findByUserAndGame(data.user_id, data.game_id).then(r => r?.review_id || 0),
            isNew
        };
    }
    // Update review
    static async update(reviewId, data) {
        const fields = [];
        const values = [];
        if (data.rating !== undefined) {
            fields.push('rating = ?');
            values.push(data.rating);
        }
        if (data.comment !== undefined) {
            fields.push('comment = ?');
            values.push(data.comment);
        }
        if (fields.length === 0)
            return false;
        values.push(reviewId);
        const [result] = await db_1.pool.execute(`UPDATE Review SET ${fields.join(', ')} WHERE review_id = ?`, values);
        return result.affectedRows > 0;
    }
    // Delete review
    static async delete(reviewId) {
        const [result] = await db_1.pool.execute('DELETE FROM Review WHERE review_id = ?', [reviewId]);
        return result.affectedRows > 0;
    }
    // Delete user's review for a specific game
    static async deleteByUserAndGame(userId, gameId) {
        const [result] = await db_1.pool.execute('DELETE FROM Review WHERE user_id = ? AND game_id = ?', [userId, gameId]);
        return result.affectedRows > 0;
    }
    // Get review statistics
    static async getReviewStats() {
        const [rows] = await db_1.pool.execute(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT game_id) as unique_games
      FROM Review
    `);
        const result = rows[0];
        return {
            total_reviews: result.total_reviews || 0,
            average_rating: result.average_rating || 0,
            unique_users: result.unique_users || 0,
            unique_games: result.unique_games || 0
        };
    }
    // Get user review statistics
    static async getUserReviewStats(userId) {
        const [rows] = await db_1.pool.execute(`
      SELECT 
        COUNT(*) as total_reviews,
        AVG(rating) as average_rating,
        MAX(rating) as highest_rating,
        MIN(rating) as lowest_rating
      FROM Review
      WHERE user_id = ?
    `, [userId]);
        const result = rows[0];
        return {
            total_reviews: result.total_reviews || 0,
            average_rating: result.average_rating || 0,
            highest_rating: result.highest_rating || 0,
            lowest_rating: result.lowest_rating || 0
        };
    }
    // Get recent reviews (last N days)
    static async findRecentReviews(days = 30) {
        const [rows] = await db_1.pool.execute(`
      SELECT r.*, u.username, g.name as game_name, p.name as publisher_name
      FROM Review r
      JOIN User u ON r.user_id = u.user_id
      JOIN Game g ON r.game_id = g.game_id
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE r.review_date >= DATE_SUB(NOW(), INTERVAL ? DAY)
      ORDER BY r.review_date DESC
    `, [days]);
        return rows;
    }
    // Get top rated games by average rating
    static async getTopRatedGames(limit = 10) {
        const [rows] = await db_1.pool.execute(`
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
    `, [limit]);
        return rows;
    }
}
exports.ReviewModel = ReviewModel;
//# sourceMappingURL=Review.js.map
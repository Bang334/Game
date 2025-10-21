"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const models_1 = require("../models");
const db_1 = require("../db");
class ReviewController {
    /**
     * Get user's reviews
     */
    static async getUserReviews(req, res) {
        try {
            const userId = req.user.user_id;
            const reviews = await models_1.ReviewModel.findByUserIdWithDetails(userId);
            res.json({ reviews });
        }
        catch (error) {
            console.error('Error in getUserReviews:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Get reviews for a game
     */
    static async getGameReviews(req, res) {
        try {
            const gameId = parseInt(req.params.id || '0');
            const reviews = await models_1.ReviewModel.findByGameIdWithDetails(gameId);
            res.json({ reviews });
        }
        catch (error) {
            console.error('Error in getGameReviews:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Create or update review for a game
     */
    static async createOrUpdateReview(req, res) {
        try {
            const userId = req.user.user_id;
            const gameId = parseInt(req.params.id || '0');
            const { rating, comment } = req.body;
            if (!rating || rating < 1 || rating > 5) {
                return res.status(400).json({ error: 'INVALID_RATING' });
            }
            // Check if user has purchased the game
            const hasPurchased = await models_1.PurchaseModel.userHasPurchased(userId, gameId);
            if (!hasPurchased) {
                return res.status(403).json({ error: 'MUST_PURCHASE_FIRST' });
            }
            // Create or update review using UPSERT
            const result = await models_1.ReviewModel.createOrUpdate({
                user_id: userId,
                game_id: gameId,
                rating,
                comment
            });
            // Update game's average rating
            const newAverageRating = await models_1.ReviewModel.getAverageRating(gameId);
            await models_1.GameModel.updateRating(gameId, newAverageRating);
            if (result.isNew) {
                res.status(201).json({
                    created: true,
                    review_id: result.review_id,
                    message: 'Review created successfully'
                });
            }
            else {
                res.json({
                    updated: true,
                    review_id: result.review_id,
                    message: 'Review updated successfully'
                });
            }
        }
        catch (error) {
            console.error('Error in createOrUpdateReview:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Update an existing review
     */
    static async updateReview(req, res) {
        try {
            const userId = req.user.user_id;
            const reviewId = parseInt(req.params.id || '0');
            const { rating, comment } = req.body;
            if (rating && (rating < 1 || rating > 5)) {
                return res.status(400).json({ error: 'INVALID_RATING' });
            }
            // Check if review exists and belongs to user
            const existingReview = await models_1.ReviewModel.findById(reviewId);
            if (!existingReview || existingReview.user_id !== userId) {
                return res.status(404).json({ error: 'REVIEW_NOT_FOUND' });
            }
            const success = await models_1.ReviewModel.update(reviewId, { rating, comment });
            if (!success) {
                return res.status(400).json({ error: 'UPDATE_FAILED' });
            }
            // Update game's average rating
            const newAverageRating = await models_1.ReviewModel.getAverageRating(existingReview.game_id);
            await models_1.GameModel.updateRating(existingReview.game_id, newAverageRating);
            res.json({ updated: true });
        }
        catch (error) {
            console.error('Error in updateReview:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Delete a review
     */
    static async deleteReview(req, res) {
        try {
            const userId = req.user.user_id;
            const reviewId = parseInt(req.params.id || '0');
            // Check if review exists and belongs to user
            const existingReview = await models_1.ReviewModel.findById(reviewId);
            if (!existingReview || existingReview.user_id !== userId) {
                return res.status(404).json({ error: 'REVIEW_NOT_FOUND' });
            }
            const success = await models_1.ReviewModel.delete(reviewId);
            if (!success) {
                return res.status(400).json({ error: 'DELETE_FAILED' });
            }
            // Update game's average rating
            const newAverageRating = await models_1.ReviewModel.getAverageRating(existingReview.game_id);
            await models_1.GameModel.updateRating(existingReview.game_id, newAverageRating);
            res.json({ deleted: true });
        }
        catch (error) {
            console.error('Error in deleteReview:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Get user's rating for a specific game
     */
    static async getUserRatingForGame(req, res) {
        try {
            const userId = req.user.user_id;
            const gameId = parseInt(req.params.gameId || '0');
            const rating = await models_1.ReviewModel.findByUserAndGame(userId, gameId);
            res.json({ rating });
        }
        catch (error) {
            console.error('Error in getUserRatingForGame:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Create or update rating (same as review but different endpoint)
     */
    static async createOrUpdateRating(req, res) {
        try {
            const userId = req.user.user_id;
            const { game_id, rating, comment } = req.body;
            if (!game_id || !rating || rating < 1 || rating > 5) {
                return res.status(400).json({ error: 'INVALID_RATING_DATA' });
            }
            // Check if user has purchased the game
            const hasPurchased = await models_1.PurchaseModel.userHasPurchased(userId, game_id);
            if (!hasPurchased) {
                return res.status(403).json({ error: 'MUST_PURCHASE_FIRST' });
            }
            // Create or update review using UPSERT
            const result = await models_1.ReviewModel.createOrUpdate({
                user_id: userId,
                game_id,
                rating,
                comment
            });
            // Update game's average rating
            const newAverageRating = await models_1.ReviewModel.getAverageRating(game_id);
            await models_1.GameModel.updateRating(game_id, newAverageRating);
            if (result.isNew) {
                res.status(201).json({
                    success: true,
                    review_id: result.review_id,
                    message: 'Rating created successfully'
                });
            }
            else {
                res.json({
                    success: true,
                    review_id: result.review_id,
                    message: 'Rating updated successfully'
                });
            }
        }
        catch (error) {
            console.error('Error in createOrUpdateRating:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Get all reviews (Admin only)
     */
    static async getAllReviews(req, res) {
        try {
            const [rows] = await db_1.pool.execute(`
        SELECT r.review_id, r.user_id, r.game_id, r.rating, r.comment,
               u.username, u.email,
               g.name as game_name, g.image as game_image
        FROM review r
        JOIN user u ON r.user_id = u.user_id
        JOIN game g ON r.game_id = g.game_id
        ORDER BY r.review_id DESC
      `);
            // Transform flat data to nested structure expected by frontend
            const reviews = rows.map(row => ({
                review_id: row.review_id,
                user_id: row.user_id,
                game_id: row.game_id,
                rating: row.rating,
                comment: row.comment,
                created_at: new Date().toISOString(),
                user: {
                    username: row.username,
                    email: row.email
                },
                game: {
                    title: row.game_name,
                    image_url: row.game_image,
                    game_id: row.game_id
                }
            }));
            res.json({ reviews });
        }
        catch (error) {
            console.error('Error in getAllReviews:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
}
exports.ReviewController = ReviewController;
//# sourceMappingURL=reviewController.js.map
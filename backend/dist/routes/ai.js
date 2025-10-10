"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const promise_1 = __importDefault(require("mysql2/promise"));
const router = express_1.default.Router();
// MySQL connection pool
const pool = promise_1.default.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'quanlymuonphonghoc',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});
/**
 * POST /api/ai/interaction
 * Log user interaction (view, like, purchase)
 */
router.post('/interaction', async (req, res) => {
    try {
        const { user_id, game_id, interaction_type, rating, session_id } = req.body;
        if (!user_id || !game_id || !interaction_type) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_PARAMETERS',
                message: 'user_id, game_id, and interaction_type are required'
            });
        }
        // Validate interaction type
        const validTypes = ['view', 'like', 'purchase'];
        if (!validTypes.includes(interaction_type)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_INTERACTION_TYPE',
                message: `interaction_type must be one of: ${validTypes.join(', ')}`
            });
        }
        const db = getDb();
        // Insert or update interaction
        const query = `
      INSERT OR REPLACE INTO user_interactions (user_id, game_id, interaction_type, rating, session_id, timestamp)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `;
        db.run(query, [user_id, game_id, interaction_type, rating || null, session_id || null], function (err) {
            if (err) {
                console.error('Error logging interaction:', err);
                db.close();
                return res.status(500).json({
                    success: false,
                    error: 'DATABASE_ERROR',
                    message: 'Failed to log interaction'
                });
            }
            console.log(`✅ Logged interaction: user ${user_id} - ${interaction_type} - game ${game_id}`);
            db.close();
            res.json({
                success: true,
                message: 'Interaction logged successfully',
                interaction: {
                    user_id,
                    game_id,
                    interaction_type,
                    id: this.lastID
                }
            });
        });
    }
    catch (error) {
        console.error('Error in /interaction endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Internal server error'
        });
    }
});
/**
 * GET /api/ai/interactions/:userId
 * Get user's interaction history
 */
router.get('/interactions/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId || '0');
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_USER_ID',
                message: 'user_id must be a number'
            });
        }
        const db = getDb();
        const query = `
      SELECT 
        id,
        game_id,
        interaction_type,
        rating,
        timestamp,
        session_id
      FROM user_interactions
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT 100
    `;
        db.all(query, [userId], (err, rows) => {
            if (err) {
                console.error('Error fetching interactions:', err);
                db.close();
                return res.status(500).json({
                    success: false,
                    error: 'DATABASE_ERROR',
                    message: 'Failed to fetch interactions'
                });
            }
            db.close();
            res.json({
                success: true,
                interactions: rows,
                count: rows.length
            });
        });
    }
    catch (error) {
        console.error('Error in /interactions/:userId endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Internal server error'
        });
    }
});
/**
 * GET /api/ai/stats
 * Get overall interaction statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const db = getDb();
        // Get total interactions by type
        const statsQuery = `
      SELECT 
        interaction_type,
        COUNT(*) as count
      FROM user_interactions
      GROUP BY interaction_type
    `;
        db.all(statsQuery, [], (err, typeStats) => {
            if (err) {
                console.error('Error fetching stats:', err);
                db.close();
                return res.status(500).json({
                    success: false,
                    error: 'DATABASE_ERROR'
                });
            }
            // Get unique users and games count
            const countsQuery = `
        SELECT 
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT game_id) as unique_games,
          COUNT(*) as total_interactions
        FROM user_interactions
      `;
            db.get(countsQuery, [], (err, counts) => {
                db.close();
                if (err) {
                    console.error('Error fetching counts:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'DATABASE_ERROR'
                    });
                }
                res.json({
                    success: true,
                    stats: {
                        by_type: typeStats,
                        unique_users: counts?.unique_users || 0,
                        unique_games: counts?.unique_games || 0,
                        total_interactions: counts?.total_interactions || 0
                    }
                });
            });
        });
    }
    catch (error) {
        console.error('Error in /stats endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR'
        });
    }
});
/**
 * GET /api/ai/behavior/:userId
 * Get user's behavior patterns and analytics
 */
router.get('/behavior/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId || '0');
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_USER_ID',
                message: 'user_id must be a number'
            });
        }
        const db = getDb();
        // Get behavior patterns
        const behaviorQuery = `
      SELECT 
        preferred_genres,
        avg_price_range,
        prefers_new_games,
        engagement_score,
        last_analyzed,
        pattern_data
      FROM user_behavior_patterns
      WHERE user_id = ?
    `;
        db.get(behaviorQuery, [userId], (err, behavior) => {
            if (err) {
                console.error('Error fetching behavior patterns:', err);
                db.close();
                return res.status(500).json({
                    success: false,
                    error: 'DATABASE_ERROR',
                    message: 'Failed to fetch behavior patterns'
                });
            }
            // Get recent interactions for additional analytics
            const recentInteractionsQuery = `
        SELECT 
          interaction_type,
          COUNT(*) as count,
          MAX(timestamp) as last_interaction
        FROM user_interactions
        WHERE user_id = ? AND timestamp >= datetime('now', '-30 days')
        GROUP BY interaction_type
      `;
            db.all(recentInteractionsQuery, [userId], (err, recentStats) => {
                db.close();
                if (err) {
                    console.error('Error fetching recent interactions:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'DATABASE_ERROR'
                    });
                }
                // Parse behavior data
                let behaviorData = null;
                if (behavior) {
                    try {
                        behaviorData = {
                            preferred_genres: JSON.parse(behavior.preferred_genres || '{}'),
                            avg_price_range: behavior.avg_price_range,
                            prefers_new_games: behavior.prefers_new_games === 1,
                            engagement_score: behavior.engagement_score,
                            last_analyzed: behavior.last_analyzed,
                            full_patterns: JSON.parse(behavior.pattern_data || '{}')
                        };
                    }
                    catch (parseError) {
                        console.error('Error parsing behavior data:', parseError);
                    }
                }
                res.json({
                    success: true,
                    user_id: userId,
                    behavior_patterns: behaviorData,
                    recent_activity: recentStats,
                    has_behavior_data: !!behavior
                });
            });
        });
    }
    catch (error) {
        console.error('Error in /behavior/:userId endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Internal server error'
        });
    }
});
/**
 * GET /api/ai/analytics
 * Get overall system analytics
 */
router.get('/analytics', async (req, res) => {
    try {
        const db = getDb();
        // Get comprehensive analytics
        const analyticsQuery = `
      SELECT 
        'total_users' as metric,
        COUNT(DISTINCT user_id) as value
      FROM user_interactions
      
      UNION ALL
      
      SELECT 
        'total_games' as metric,
        COUNT(DISTINCT game_id) as value
      FROM user_interactions
      
      UNION ALL
      
      SELECT 
        'total_interactions' as metric,
        COUNT(*) as value
      FROM user_interactions
      
      UNION ALL
      
      SELECT 
        'users_with_behavior_data' as metric,
        COUNT(*) as value
      FROM user_behavior_patterns
      
      UNION ALL
      
      SELECT 
        'avg_engagement_score' as metric,
        ROUND(AVG(engagement_score), 3) as value
      FROM user_behavior_patterns
    `;
        db.all(analyticsQuery, [], (err, metrics) => {
            if (err) {
                console.error('Error fetching analytics:', err);
                db.close();
                return res.status(500).json({
                    success: false,
                    error: 'DATABASE_ERROR'
                });
            }
            // Get interaction trends
            const trendsQuery = `
        SELECT 
          DATE(timestamp) as date,
          interaction_type,
          COUNT(*) as count
        FROM user_interactions
        WHERE timestamp >= datetime('now', '-7 days')
        GROUP BY DATE(timestamp), interaction_type
        ORDER BY date DESC
      `;
            db.all(trendsQuery, [], (err, trends) => {
                db.close();
                if (err) {
                    console.error('Error fetching trends:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'DATABASE_ERROR'
                    });
                }
                // Format metrics
                const formattedMetrics = {};
                metrics.forEach(metric => {
                    formattedMetrics[metric.metric] = metric.value;
                });
                res.json({
                    success: true,
                    analytics: formattedMetrics,
                    trends: trends,
                    generated_at: new Date().toISOString()
                });
            });
        });
    }
    catch (error) {
        console.error('Error in /analytics endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR'
        });
    }
});
/**
 * DELETE /api/ai/interactions/:userId
 * Clear user's interaction history (for testing/privacy)
 */
router.delete('/interactions/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId || '0');
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_USER_ID'
            });
        }
        const db = getDb();
        db.run('DELETE FROM user_interactions WHERE user_id = ?', [userId], function (err) {
            db.close();
            if (err) {
                console.error('Error deleting interactions:', err);
                return res.status(500).json({
                    success: false,
                    error: 'DATABASE_ERROR'
                });
            }
            console.log(`🗑️  Deleted ${this.changes} interactions for user ${userId}`);
            res.json({
                success: true,
                message: `Deleted ${this.changes} interactions`,
                deleted_count: this.changes
            });
        });
    }
    catch (error) {
        console.error('Error in DELETE /interactions/:userId:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR'
        });
    }
});
exports.default = router;
//# sourceMappingURL=ai.js.map
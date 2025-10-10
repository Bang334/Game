"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_1 = require("../db");
const dynamicWeightService_1 = require("../services/dynamicWeightService");
const router = express_1.default.Router();
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
        // Validate interaction_type
        const validTypes = ['purchase', 'review', 'view', 'wishlist', 'like'];
        if (!validTypes.includes(interaction_type)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_INTERACTION_TYPE',
                message: `interaction_type must be one of: ${validTypes.join(', ')}`
            });
        }
        // Prepare metadata
        const metadata = {
            rating: rating || null,
            session_id: session_id || null,
            timestamp: new Date().toISOString()
        };
        // Insert interaction
        await db_1.pool.execute(`
      INSERT INTO user_interactions (user_id, game_id, interaction_type, metadata)
      VALUES (?, ?, ?, ?)
    `, [user_id, game_id, interaction_type, JSON.stringify(metadata)]);
        console.log(`📊 Logged interaction: User ${user_id} ${interaction_type} Game ${game_id}`);
        res.json({
            success: true,
            message: 'Interaction logged successfully',
            interaction: {
                user_id,
                game_id,
                interaction_type,
                metadata
            }
        });
    }
    catch (error) {
        console.error('Error logging interaction:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Failed to log interaction'
        });
    }
});
/**
 * GET /api/ai/top-users
 * Get top 5 users with most interactions
 */
router.get('/top-users', async (req, res) => {
    try {
        console.log('🔍 Fetching top users from MySQL...');
        // Get top users by interaction count
        const [topUsers] = await db_1.pool.execute(`
      SELECT 
        user_id,
        COUNT(*) as interaction_count,
        COUNT(CASE WHEN interaction_type = 'purchase' THEN 1 END) as purchase_count,
        COUNT(CASE WHEN interaction_type = 'review' THEN 1 END) as review_count,
        COUNT(CASE WHEN interaction_type = 'view' THEN 1 END) as view_count,
        COUNT(CASE WHEN interaction_type = 'wishlist' THEN 1 END) as wishlist_count,
        MAX(timestamp) as last_interaction
      FROM user_interactions
      GROUP BY user_id
      ORDER BY interaction_count DESC
      LIMIT 5
    `);
        console.log('📊 Top users found:', topUsers.length);
        console.log('👥 Top users data:', JSON.stringify(topUsers, null, 2));
        // Get behavior data and dynamic weights for each top user
        const usersWithBehavior = await Promise.all(topUsers.map(async (user) => {
            try {
                const [behaviorResult] = await db_1.pool.execute(`
          SELECT
            preferred_genres,
            avg_price_range,
            prefers_new_games,
            engagement_score,
            last_analyzed,
            pattern_data
          FROM user_behavior_patterns
          WHERE user_id = ?
        `, [user.user_id]);
                const behavior = behaviorResult[0];
                console.log(`🧠 Behavior for user ${user.user_id}:`, behavior);
                let behaviorData = null;
                let fullPatterns = null;
                if (behavior) {
                    try {
                        // Handle preferred_genres - it might already be an object or a JSON string
                        let preferredGenres = {};
                        if (typeof behavior.preferred_genres === 'string') {
                            preferredGenres = JSON.parse(behavior.preferred_genres || '{}');
                        }
                        else if (typeof behavior.preferred_genres === 'object') {
                            preferredGenres = behavior.preferred_genres || {};
                        }
                        // Parse pattern_data for full weight information
                        if (behavior.pattern_data) {
                            if (typeof behavior.pattern_data === 'string') {
                                fullPatterns = JSON.parse(behavior.pattern_data);
                            }
                            else {
                                fullPatterns = behavior.pattern_data;
                            }
                        }
                        behaviorData = {
                            preferred_genres: preferredGenres,
                            avg_price_range: behavior.avg_price_range,
                            prefers_new_games: behavior.prefers_new_games === 1,
                            engagement_score: behavior.engagement_score,
                            last_analyzed: behavior.last_analyzed,
                            full_patterns: fullPatterns
                        };
                    }
                    catch (parseError) {
                        console.error(`❌ Error parsing behavior for user ${user.user_id}:`, parseError);
                    }
                }
                // Calculate dynamic weights using the service
                try {
                    console.log(`⚖️ Calculating dynamic weights for user ${user.user_id}...`);
                    // Get user's recent interactions for weight calculation
                    const [interactions] = await db_1.pool.execute(`
            SELECT
              ui.interaction_type,
              ui.game_id,
              ui.timestamp,
              g.price,
              g.release_date,
              g.genre,
              g.publisher,
              g.platform
            FROM user_interactions ui
            LEFT JOIN games g ON ui.game_id = g.id
            WHERE ui.user_id = ?
              AND ui.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY ui.timestamp DESC
          `, [user.user_id]);
                    if (interactions && interactions.length > 0) {
                        // Calculate dynamic weights using the service
                        const dynamicWeights = await dynamicWeightService_1.DynamicWeightService.analyzeUserBehavior(user.user_id);
                        // Add calculated weights to full_patterns if dynamicWeights exists
                        if (dynamicWeights && !fullPatterns) {
                            fullPatterns = {};
                        }
                        if (dynamicWeights) {
                            fullPatterns.price_preferences = {
                                min_price: dynamicWeights.price_preferences.min_price,
                                max_price: dynamicWeights.price_preferences.max_price,
                                avg_price: dynamicWeights.price_preferences.avg_price,
                                price_weight: dynamicWeights.price_preferences.price_weight
                            };
                            fullPatterns.release_date_preferences = {
                                preferred_years: dynamicWeights.release_date_preferences.preferred_years,
                                release_date_weight: dynamicWeights.release_date_preferences.release_date_weight
                            };
                            fullPatterns.genre_preferences = {
                                preferred_genres: dynamicWeights.genre_preferences.preferred_genres,
                                genre_weights: dynamicWeights.genre_preferences.genre_weights
                            };
                            fullPatterns.publisher_preferences = {
                                preferred_publishers: dynamicWeights.publisher_preferences.preferred_publishers,
                                publisher_weight: dynamicWeights.publisher_preferences.publisher_weight
                            };
                            fullPatterns.platform_preferences = {
                                preferred_platforms: dynamicWeights.platform_preferences.preferred_platforms,
                                platform_weight: dynamicWeights.platform_preferences.platform_weight
                            };
                            console.log(`✅ Calculated dynamic weights for user ${user.user_id}:`, fullPatterns);
                        }
                    }
                }
                catch (weightError) {
                    console.error(`❌ Error calculating dynamic weights for user ${user.user_id}:`, weightError);
                }
                return { ...user, behavior_patterns: behaviorData };
            }
            catch (error) {
                console.error(`❌ Error fetching behavior for user ${user.user_id}:`, error);
                return { ...user, behavior_patterns: null };
            }
        }));
        console.log('✅ Top users with behavior data:', usersWithBehavior.length);
        res.json({
            success: true,
            top_users: usersWithBehavior,
            total_found: usersWithBehavior.length
        });
    }
    catch (error) {
        console.error('❌ Error in top-users endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Failed to fetch top users'
        });
    }
});
/**
 * GET /api/ai/analytics
 * Get overall system analytics
 */
router.get('/analytics', async (req, res) => {
    try {
        console.log('📊 Fetching analytics from MySQL...');
        // Get comprehensive analytics
        const [usersResult] = await db_1.pool.execute('SELECT COUNT(*) as total_users FROM user');
        const [gamesResult] = await db_1.pool.execute('SELECT COUNT(*) as total_games FROM game');
        const [interactionsResult] = await db_1.pool.execute('SELECT COUNT(*) as total_interactions FROM user_interactions');
        const [behaviorResult] = await db_1.pool.execute('SELECT COUNT(*) as users_with_behavior_data FROM user_behavior_patterns');
        const [avgEngagementResult] = await db_1.pool.execute('SELECT ROUND(AVG(engagement_score), 3) as avg_engagement_score FROM user_behavior_patterns');
        // Get recent activity trends (last 7 days)
        const [trendsResult] = await db_1.pool.execute(`
      SELECT 
        DATE(timestamp) as date,
        interaction_type,
        COUNT(*) as count
      FROM user_interactions
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(timestamp), interaction_type
      ORDER BY date DESC
    `);
        const analytics = {
            total_users: usersResult[0]?.total_users || 0,
            total_games: gamesResult[0]?.total_games || 0,
            total_interactions: interactionsResult[0]?.total_interactions || 0,
            users_with_behavior_data: behaviorResult[0]?.users_with_behavior_data || 0,
            avg_engagement_score: avgEngagementResult[0]?.avg_engagement_score || 0
        };
        console.log('📈 Analytics data:', analytics);
        res.json({
            success: true,
            analytics: analytics,
            trends: trendsResult,
            generated_at: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Failed to fetch analytics data'
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
        console.log(`🧠 Fetching behavior for user ${userId}...`);
        // Get behavior patterns
        const [behaviorResult] = await db_1.pool.execute(`
      SELECT 
        preferred_genres,
        avg_price_range,
        prefers_new_games,
        engagement_score,
        last_analyzed,
        pattern_data
      FROM user_behavior_patterns
      WHERE user_id = ?
    `, [userId]);
        const behavior = behaviorResult[0];
        console.log(`🧠 Behavior data for user ${userId}:`, behavior);
        // Get recent interactions for additional analytics
        const [recentInteractionsResult] = await db_1.pool.execute(`
      SELECT 
        interaction_type,
        COUNT(*) as count,
        MAX(timestamp) as last_interaction
      FROM user_interactions
      WHERE user_id = ? AND timestamp >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY interaction_type
    `, [userId]);
        console.log(`📊 Recent interactions for user ${userId}:`, recentInteractionsResult);
        // Parse behavior data
        let behaviorData = null;
        if (behavior) {
            try {
                // Handle preferred_genres - it might already be an object or a JSON string
                let preferredGenres = {};
                if (typeof behavior.preferred_genres === 'string') {
                    preferredGenres = JSON.parse(behavior.preferred_genres || '{}');
                }
                else if (typeof behavior.preferred_genres === 'object') {
                    preferredGenres = behavior.preferred_genres || {};
                }
                // Handle pattern_data - it might already be an object or a JSON string
                let patternData = {};
                if (typeof behavior.pattern_data === 'string') {
                    patternData = JSON.parse(behavior.pattern_data || '{}');
                }
                else if (typeof behavior.pattern_data === 'object') {
                    patternData = behavior.pattern_data || {};
                }
                behaviorData = {
                    preferred_genres: preferredGenres,
                    avg_price_range: behavior.avg_price_range,
                    prefers_new_games: behavior.prefers_new_games === 1,
                    engagement_score: behavior.engagement_score,
                    last_analyzed: behavior.last_analyzed,
                    full_patterns: patternData
                };
            }
            catch (parseError) {
                console.error('❌ Error parsing behavior data:', parseError);
            }
        }
        res.json({
            success: true,
            user_id: userId,
            behavior_patterns: behaviorData,
            recent_activity: recentInteractionsResult,
            has_behavior_data: !!behavior
        });
    }
    catch (error) {
        console.error('❌ Error fetching user behavior:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Failed to fetch user behavior'
        });
    }
});
/**
 * GET /api/ai/analyze-behavior/:userId
 * Phân tích hành vi người dùng và tính trọng số động
 */
router.get('/analyze-behavior/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId || '0');
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        console.log(`🔍 Analyzing behavior for user ${userId}...`);
        // Phân tích hành vi người dùng
        const behaviorPattern = await dynamicWeightService_1.DynamicWeightService.analyzeUserBehavior(userId);
        if (!behaviorPattern) {
            return res.status(404).json({
                success: false,
                message: 'No behavior data found for user in last 7 days'
            });
        }
        // Lưu pattern vào database
        await dynamicWeightService_1.DynamicWeightService.saveBehaviorPattern(behaviorPattern);
        res.json({
            success: true,
            user_id: userId,
            behavior_pattern: behaviorPattern,
            analysis_date: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Error analyzing user behavior:', error);
        res.status(500).json({
            success: false,
            message: 'Error analyzing user behavior',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/ai/calculate-dynamic-score
 * Tính điểm động cho game dựa trên hành vi người dùng
 */
router.post('/calculate-dynamic-score', async (req, res) => {
    try {
        const { user_id, game_id, base_score } = req.body;
        if (!user_id || !game_id || base_score === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: user_id, game_id, base_score'
            });
        }
        console.log(`🎯 Calculating dynamic score for user ${user_id}, game ${game_id}...`);
        // Lấy thông tin game
        const [gameRows] = await db_1.pool.query(`
      SELECT * FROM game WHERE id = ?
    `, [game_id]);
        if (gameRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Game not found'
            });
        }
        const game = gameRows[0];
        // Tính điểm động
        const dynamicScore = await dynamicWeightService_1.DynamicWeightService.calculateDynamicGameScore(user_id, game, base_score);
        res.json({
            success: true,
            user_id,
            game_id,
            game_name: game.name,
            base_score,
            dynamic_score: dynamicScore,
            score_multiplier: dynamicScore / base_score,
            calculated_at: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Error calculating dynamic score:', error);
        res.status(500).json({
            success: false,
            message: 'Error calculating dynamic score',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * GET /api/ai/behavior-insights/:userId
 * Lấy insights chi tiết về hành vi người dùng
 */
router.get('/behavior-insights/:userId', async (req, res) => {
    try {
        const userId = parseInt(req.params.userId || '0');
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }
        console.log(`📊 Getting behavior insights for user ${userId}...`);
        // Phân tích hành vi
        const behaviorPattern = await dynamicWeightService_1.DynamicWeightService.analyzeUserBehavior(userId);
        if (!behaviorPattern) {
            return res.status(404).json({
                success: false,
                message: 'No behavior data found for user in last 7 days'
            });
        }
        // Tạo insights
        const insights = {
            user_id: userId,
            total_interactions: behaviorPattern.total_interactions,
            price_insights: {
                preferred_range: `${behaviorPattern.price_preferences.min_price.toLocaleString()} - ${behaviorPattern.price_preferences.max_price.toLocaleString()} VND`,
                average_price: behaviorPattern.price_preferences.avg_price.toLocaleString() + ' VND',
                price_focus_level: behaviorPattern.price_preferences.price_weight > 2.0 ? 'High' : behaviorPattern.price_preferences.price_weight > 1.5 ? 'Medium' : 'Low',
                recommendation: behaviorPattern.price_preferences.price_weight > 2.0
                    ? 'User has strong price preferences - prioritize games in their price range'
                    : 'User is flexible with pricing - price is not a major factor'
            },
            release_date_insights: {
                preferred_years: behaviorPattern.release_date_preferences.preferred_years,
                recency_focus: behaviorPattern.release_date_preferences.release_date_weight > 2.0 ? 'High' : 'Low',
                recommendation: behaviorPattern.release_date_preferences.release_date_weight > 2.0
                    ? 'User prefers recent games - prioritize newer releases'
                    : 'User is open to older games - include classic titles'
            },
            genre_insights: {
                top_genres: behaviorPattern.genre_preferences.preferred_genres,
                genre_diversity: Object.keys(behaviorPattern.genre_preferences.genre_weights).length,
                recommendation: Object.keys(behaviorPattern.genre_preferences.genre_weights).length > 3
                    ? 'User has diverse genre preferences - include variety'
                    : 'User has focused genre preferences - prioritize top genres'
            },
            publisher_insights: {
                preferred_publishers: behaviorPattern.publisher_preferences.preferred_publishers,
                publisher_loyalty: behaviorPattern.publisher_preferences.publisher_weight > 2.0 ? 'High' : 'Low',
                recommendation: behaviorPattern.publisher_preferences.publisher_weight > 2.0
                    ? 'User shows publisher loyalty - prioritize games from preferred publishers'
                    : 'User is publisher-agnostic - focus on game quality over publisher'
            },
            platform_insights: {
                preferred_platforms: behaviorPattern.platform_preferences.preferred_platforms,
                platform_focus: behaviorPattern.platform_preferences.platform_weight > 2.0 ? 'High' : 'Low',
                recommendation: behaviorPattern.platform_preferences.platform_weight > 2.0
                    ? 'User has platform preferences - prioritize games for their preferred platforms'
                    : 'User is platform-flexible - include games for all platforms'
            },
            overall_recommendation: generateOverallRecommendation(behaviorPattern)
        };
        res.json({
            success: true,
            insights,
            analyzed_at: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('❌ Error getting behavior insights:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting behavior insights',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * Tạo khuyến nghị tổng thể dựa trên hành vi
 */
function generateOverallRecommendation(pattern) {
    const recommendations = [];
    if (pattern.price_preferences.price_weight > 2.0) {
        recommendations.push('Focus on games in their preferred price range');
    }
    if (pattern.release_date_preferences.release_date_weight > 2.0) {
        recommendations.push('Prioritize recent game releases');
    }
    if (Object.keys(pattern.genre_preferences.genre_weights).length <= 2) {
        recommendations.push('Concentrate on their top 2-3 favorite genres');
    }
    if (pattern.publisher_preferences.publisher_weight > 2.0) {
        recommendations.push('Include games from their preferred publishers');
    }
    if (pattern.platform_preferences.platform_weight > 2.0) {
        recommendations.push('Focus on games for their preferred platforms');
    }
    if (recommendations.length === 0) {
        return 'User has diverse preferences - provide a balanced mix of recommendations';
    }
    return recommendations.join(', ') + '.';
}
/**
 * GET /api/ai/system-config
 * Lấy cấu hình hệ thống
 */
router.get('/system-config', async (req, res) => {
    try {
        const [rows] = await db_1.pool.query('SELECT * FROM system_config');
        // Convert to key-value object
        const config = {};
        for (const row of rows) {
            config[row.config_key] = {
                value: row.config_value,
                description: row.description,
                updated_at: row.updated_at
            };
        }
        res.json({
            success: true,
            config
        });
    }
    catch (error) {
        console.error('❌ Error fetching system config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system config',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * PUT /api/ai/system-config/:key
 * Cập nhật cấu hình hệ thống
 */
router.put('/system-config/:key', async (req, res) => {
    try {
        const { key } = req.params;
        const { value } = req.body;
        if (!value) {
            return res.status(400).json({
                success: false,
                message: 'value is required'
            });
        }
        // Update config
        await db_1.pool.query('UPDATE system_config SET config_value = ? WHERE config_key = ?', [value, key]);
        console.log(`✅ Updated system config: ${key} = ${value}`);
        res.json({
            success: true,
            message: `Config ${key} updated successfully`,
            config_key: key,
            config_value: value
        });
    }
    catch (error) {
        console.error('❌ Error updating system config:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update system config',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
/**
 * POST /api/ai/toggle-dynamic-multiplier
 * Bật/tắt hệ thống Dynamic Multiplier
 */
router.post('/toggle-dynamic-multiplier', async (req, res) => {
    try {
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'enabled must be a boolean'
            });
        }
        const value = enabled ? 'true' : 'false';
        await db_1.pool.query('UPDATE system_config SET config_value = ? WHERE config_key = ?', [value, 'dynamic_multiplier_enabled']);
        console.log(`🔄 Dynamic Multiplier ${enabled ? 'ENABLED' : 'DISABLED'}`);
        res.json({
            success: true,
            message: `Dynamic Multiplier ${enabled ? 'enabled' : 'disabled'}`,
            enabled
        });
    }
    catch (error) {
        console.error('❌ Error toggling dynamic multiplier:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle dynamic multiplier',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=ai-mysql.js.map
import express, { Request, Response } from 'express';
import { pool } from '../db';

const router = express.Router();

/**
 * POST /api/ai/interaction
 * Log user interaction (view, like, purchase)
 */
router.post('/interaction', async (_req: Request, res: Response) => {
  // Analytics system has been removed - just return success
  res.json({
    success: true,
    message: 'Interaction logging disabled (analytics system removed)'
  });
});

/**
 * GET /api/ai/top-users
 * Get top 5 users with most interactions (DISABLED)
 */
router.get('/top-users', async (_req: Request, res: Response) => {
  try {
    console.log('🔍 Fetching top users from MySQL...');
    
    // Get top users by interaction count
    const [topUsers] = await pool.execute(`
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
    
    console.log('📊 Top users found:', (topUsers as any[]).length);
    console.log('👥 Top users data:', JSON.stringify(topUsers, null, 2));
    
    // Get behavior data and dynamic weights for each top user
    const usersWithBehavior = await Promise.all((topUsers as any[]).map(async (user) => {
      try {
        const [behaviorResult] = await pool.execute(`
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

        const behavior = (behaviorResult as any[])[0];
        console.log(`🧠 Behavior for user ${user.user_id}:`, behavior);

        let behaviorData = null;
        let fullPatterns = null;

        if (behavior) {
          try {
            // Handle preferred_genres - it might already be an object or a JSON string
            let preferredGenres = {};
            if (typeof behavior.preferred_genres === 'string') {
              preferredGenres = JSON.parse(behavior.preferred_genres || '{}');
            } else if (typeof behavior.preferred_genres === 'object') {
              preferredGenres = behavior.preferred_genres || {};
            }

            // Parse pattern_data for full weight information
            if (behavior.pattern_data) {
              if (typeof behavior.pattern_data === 'string') {
                fullPatterns = JSON.parse(behavior.pattern_data);
              } else {
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
          } catch (parseError) {
            console.error(`❌ Error parsing behavior for user ${user.user_id}:`, parseError);
          }
        }

        
        return { ...user, behavior_patterns: behaviorData };
      } catch (error) {
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
    
  } catch (error) {
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
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    console.log('📊 Fetching analytics from MySQL...');
    
    // Get comprehensive analytics
    const [usersResult] = await pool.execute('SELECT COUNT(*) as total_users FROM user');
    const [gamesResult] = await pool.execute('SELECT COUNT(*) as total_games FROM game');
    const [interactionsResult] = await pool.execute('SELECT COUNT(*) as total_interactions FROM user_interactions');
    const [behaviorResult] = await pool.execute('SELECT COUNT(*) as users_with_behavior_data FROM user_behavior_patterns');
    const [avgEngagementResult] = await pool.execute('SELECT ROUND(AVG(engagement_score), 3) as avg_engagement_score FROM user_behavior_patterns');
    
    // Get recent activity trends (last 7 days)
    const [trendsResult] = await pool.execute(`
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
      total_users: (usersResult as any[])[0]?.total_users || 0,
      total_games: (gamesResult as any[])[0]?.total_games || 0,
      total_interactions: (interactionsResult as any[])[0]?.total_interactions || 0,
      users_with_behavior_data: (behaviorResult as any[])[0]?.users_with_behavior_data || 0,
      avg_engagement_score: (avgEngagementResult as any[])[0]?.avg_engagement_score || 0
    };
    
    console.log('📈 Analytics data:', analytics);
    
    res.json({
      success: true,
      analytics: analytics,
      trends: trendsResult as any[],
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
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
router.get('/behavior/:userId', async (req: Request, res: Response) => {
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
    const [behaviorResult] = await pool.execute(`
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
    
    const behavior = (behaviorResult as any[])[0];
    console.log(`🧠 Behavior data for user ${userId}:`, behavior);
    
    // Get recent interactions for additional analytics
    const [recentInteractionsResult] = await pool.execute(`
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
        } else if (typeof behavior.preferred_genres === 'object') {
          preferredGenres = behavior.preferred_genres || {};
        }
        
        // Handle pattern_data - it might already be an object or a JSON string
        let patternData = {};
        if (typeof behavior.pattern_data === 'string') {
          patternData = JSON.parse(behavior.pattern_data || '{}');
        } else if (typeof behavior.pattern_data === 'object') {
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
      } catch (parseError) {
        console.error('❌ Error parsing behavior data:', parseError);
      }
    }
    
    res.json({
      success: true,
      user_id: userId,
      behavior_patterns: behaviorData,
      recent_activity: recentInteractionsResult as any[],
      has_behavior_data: !!behavior
    });
    
  } catch (error) {
    console.error('❌ Error fetching user behavior:', error);
    res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Failed to fetch user behavior'
    });
  }
});

export default router;

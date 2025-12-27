"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
// SQLite database path
const DB_PATH = path_1.default.join(__dirname, '../../../predict/user_interactions.db');
// Get SQLite database connection
const getDb = () => {
    return new sqlite3_1.default.Database(DB_PATH, (err) => {
        if (err) {
            console.error('❌ Error connecting to SQLite database:', err);
        }
    });
};
/**
 * POST /api/interactions
 * Log user interaction (view, like, purchase) to SQLite
 */
router.post('/', async (req, res) => {
    try {
        const { user_id, game_id, interaction_type, rating } = req.body;
        if (!user_id || !game_id || !interaction_type) {
            return res.status(400).json({
                success: false,
                error: 'MISSING_PARAMETERS',
                message: 'user_id, game_id, and interaction_type are required'
            });
        }
        // Validate interaction type
        const validTypes = ['view', 'favorite', 'purchase'];
        if (!validTypes.includes(interaction_type)) {
            return res.status(400).json({
                success: false,
                error: 'INVALID_INTERACTION_TYPE',
                message: `interaction_type must be one of: ${validTypes.join(', ')}`
            });
        }
        const db = getDb();
        // Insert interaction with current timestamp
        const query = `
      INSERT INTO user_interactions (user_id, game_id, interaction_type, rating, timestamp)
      VALUES (?, ?, ?, ?, datetime('now'))
    `;
        db.run(query, [user_id, game_id, interaction_type, rating || null], function (err) {
            if (err) {
                console.error('❌ Error logging interaction:', err);
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
                    rating: rating || null,
                    id: this.lastID,
                    timestamp: new Date().toISOString()
                }
            });
        });
    }
    catch (error) {
        console.error('❌ Error in /interactions endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Internal server error'
        });
    }
});
/**
 * GET /api/interactions/:userId
 * Get user's interaction history from SQLite
 */
router.get('/:userId', async (req, res) => {
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
        timestamp
      FROM user_interactions
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT 100
    `;
        db.all(query, [userId], (err, rows) => {
            if (err) {
                console.error('❌ Error fetching interactions:', err);
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
        console.error('❌ Error in GET /interactions/:userId endpoint:', error);
        res.status(500).json({
            success: false,
            error: 'SERVER_ERROR',
            message: 'Internal server error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=interactionRoutes.js.map
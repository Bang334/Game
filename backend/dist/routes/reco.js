"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const db_1 = require("../db");
const models_1 = require("../models");
const router = (0, express_1.Router)();
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me';
const PREDICT_DIR = path_1.default.join(__dirname, '../../../predict');
const PYTHON_SCRIPT = path_1.default.join(PREDICT_DIR, 'game_recommendation_system.py');
const RECOMMENDATIONS_FILE = path_1.default.join(PREDICT_DIR, 'recommendations.json');
/**
 * Sync data from MySQL database to game.json for AI recommendation system
 */
async function syncDataToGameJson() {
    try {
        console.log('\n=== SYNCING DATA TO GAME.JSON ===');
        // Fetch all games with full details
        const [gamesRows] = await db_1.pool.query(`
      SELECT 
        g.game_id as id,
        g.name,
        g.description,
        g.price,
        g.release_date,
        g.image,
        g.downloads,
        g.mode,
        g.multiplayer,
        g.capacity,
        g.age_rating,
        g.link_download,
        g.average_rating as rating,
        pub.name as publisher
      FROM game g
      LEFT JOIN publisher pub ON g.publisher_id = pub.publisher_id
    `);
        const games = gamesRows;
        // Fetch genres for each game
        for (const game of games) {
            const [genresRows] = await db_1.pool.query(`
        SELECT gen.name
        FROM game_genre gg
        JOIN genre gen ON gg.genre_id = gen.genre_id
        WHERE gg.game_id = ?
      `, [game.id]);
            game.genre = genresRows.map((g) => g.name);
            // Fetch platforms
            const [platformsRows] = await db_1.pool.query(`
        SELECT p.name
        FROM game_platform gp
        JOIN platform p ON gp.platform_id = p.platform_id
        WHERE gp.game_id = ?
      `, [game.id]);
            game.platform = platformsRows.map((p) => p.name);
            // Fetch languages
            const [languagesRows] = await db_1.pool.query(`
        SELECT l.name
        FROM game_language gl
        JOIN language l ON gl.language_id = l.language_id
        WHERE gl.game_id = ?
      `, [game.id]);
            game.language = languagesRows.map((l) => l.name);
            // Fetch specifications (MIN type)
            const [specsRows] = await db_1.pool.query(`
        SELECT cpu, gpu, ram
        FROM specification
        WHERE game_id = ? AND type = 'MIN'
        LIMIT 1
      `, [game.id]);
            if (specsRows.length > 0) {
                const spec = specsRows[0];
                game.min_spec = {
                    cpu: spec.cpu || '',
                    gpu: spec.gpu || '',
                    ram: spec.ram || '0GB'
                };
            }
            else {
                game.min_spec = { cpu: '', gpu: '', ram: '0GB' };
            }
            // Fetch recommended specs (REC type)
            const [recSpecsRows] = await db_1.pool.query(`
        SELECT cpu, gpu, ram
        FROM specification
        WHERE game_id = ? AND type = 'REC'
        LIMIT 1
      `, [game.id]);
            if (recSpecsRows.length > 0) {
                const spec = recSpecsRows[0];
                game.rec_spec = {
                    cpu: spec.cpu || '',
                    gpu: spec.gpu || '',
                    ram: spec.ram || '0GB'
                };
            }
            else {
                game.rec_spec = { cpu: '', gpu: '', ram: '0GB' };
            }
            // Use values from database or set defaults
            game.multiplayer = game.multiplayer || false;
            game.capacity = game.capacity || 0;
            game.age_rating = game.age_rating || 'Everyone';
            game.mode = game.mode || 'Single Player';
            game.link_download = game.link_download || '';
        }
        // Fetch all users with their interactions
        const [usersRows] = await db_1.pool.query(`
      SELECT user_id as id, username as name, email, age, gender
      FROM user
    `);
        const users = usersRows;
        // Fetch favorite games (from wishlist)
        for (const user of users) {
            const [wishlistRows] = await db_1.pool.query(`
        SELECT game_id
        FROM wishlist
        WHERE user_id = ?
      `, [user.id]);
            user.favorite_games = wishlistRows.map((w) => w.game_id);
            // Fetch purchased games with ratings
            const [purchasedRows] = await db_1.pool.query(`
        SELECT p.game_id, COALESCE(r.rating, 3) as rating
        FROM purchase p
        LEFT JOIN review r ON p.user_id = r.user_id AND p.game_id = r.game_id
        WHERE p.user_id = ?
      `, [user.id]);
            // Convert to object format: {"game_id": rating}
            user.purchased_games = {};
            for (const purchase of purchasedRows) {
                user.purchased_games[purchase.game_id] = purchase.rating;
            }
            // Fetch view history (use SUM of view_count from View table)
            const [viewsRows] = await db_1.pool.query(`
        SELECT game_id, SUM(view_count) as view_count
        FROM view
        WHERE user_id = ?
        GROUP BY game_id
      `, [user.id]);
            user.view_history = {};
            for (const view of viewsRows) {
                user.view_history[view.game_id] = view.view_count || 1;
            }
        }
        // Prepare final data structure
        const gameData = {
            games: games,
            users: users
        };
        // Write to game.json
        const gameJsonPath = path_1.default.join(PREDICT_DIR, 'game.json');
        fs_1.default.writeFileSync(gameJsonPath, JSON.stringify(gameData, null, 2), 'utf-8');
        console.log(`✅ Synced ${games.length} games and ${users.length} users to game.json`);
        console.log(`📁 File location: ${gameJsonPath}`);
        console.log('=== SYNC COMPLETED ===\n');
        return true;
    }
    catch (error) {
        console.error('❌ Error syncing data to game.json:', error);
        return false;
    }
}
/**
 * GET /api/reco/games
 * Get AI-powered game recommendations for a user
 */
router.get('/games', async (req, res) => {
    try {
        const { user_id, query, days } = req.query;
        if (!user_id) {
            return res.status(400).json({
                success: false,
                error: 'USER_ID_REQUIRED',
                message: 'user_id query parameter is required'
            });
        }
        const userId = parseInt(user_id);
        const searchQuery = query ? query.trim() : '';
        const recentDays = days ? parseInt(days) : 7; // Default: 7 days
        console.log('\n=== RECOMMENDATION REQUEST ===');
        console.log('User ID:', userId);
        console.log('Search Query:', searchQuery || '(none)');
        console.log('Recent Days:', recentDays);
        // Sync data first (this ensures game.json is up-to-date)
        console.log('Syncing data to game.json...');
        const syncSuccess = await syncDataToGameJson();
        if (!syncSuccess) {
            console.log('⚠️  Sync failed, but continuing with existing game.json');
        }
        // Build Python command with optional query parameter and recent_days
        let pythonCommand = `python "${PYTHON_SCRIPT}" --user ${userId} --chart 0 --days ${recentDays}`;
        if (searchQuery) {
            pythonCommand += ` --query "${searchQuery}"`;
        }
        console.log(`Running Python script: ${pythonCommand}`);
        try {
            // Execute Python script
            const { stdout, stderr } = await execAsync(pythonCommand, { cwd: PREDICT_DIR });
            if (stderr) {
                console.warn('Python script stderr:', stderr);
            }
            console.log('✅ Python script completed successfully');
            console.log('Script output:', stdout);
            // Read recommendations.json file
            if (!fs_1.default.existsSync(RECOMMENDATIONS_FILE)) {
                throw new Error('recommendations.json file not found');
            }
            const recommendationsData = JSON.parse(fs_1.default.readFileSync(RECOMMENDATIONS_FILE, 'utf-8'));
            console.log('✅ Recommendations loaded from file');
            console.log('Recommendations count:', recommendationsData.games?.length || 0);
            // Transform recommendations to match frontend expectations
            const recommendations = (recommendationsData.games || []).map((game) => ({
                game_id: game.id,
                name: game.name,
                price: game.price,
                image: game.image || '',
                description: game.description || '',
                average_rating: game.rating || 0,
                genres: game.genre || [],
                platforms: game.platform || [],
                publisher_name: game.publisher || '',
                score: game.score || 0 // AI recommendation score
            }));
            console.log('=== RECOMMENDATION COMPLETED ===\n');
            res.json({
                success: true,
                games: recommendations,
                total: recommendations.length,
                message: 'AI recommendations generated successfully'
            });
        }
        catch (pythonError) {
            console.error('❌ Python script error:', pythonError);
            // If Python script fails, fallback to regular games
            console.log('Falling back to regular games list...');
            const games = await models_1.GameModel.findAllWithPublisherAndGenres();
            const limitedGames = games.slice(0, 20);
            res.json({
                success: true,
                games: limitedGames,
                total: limitedGames.length,
                message: 'Showing regular games (AI service unavailable)',
                fallback: true
            });
        }
    }
    catch (error) {
        console.error('❌ Recommendation endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'RECOMMENDATION_ERROR',
            message: 'Failed to get recommendations'
        });
    }
});
/**
 * POST /api/reco/sync
 * Manually trigger data sync to game.json
 */
router.post('/sync', async (_req, res) => {
    try {
        console.log('Manual sync triggered...');
        const success = await syncDataToGameJson();
        if (success) {
            res.json({
                success: true,
                message: 'Data synced successfully to game.json'
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'SYNC_FAILED',
                message: 'Failed to sync data to game.json'
            });
        }
    }
    catch (error) {
        console.error('Sync endpoint error:', error);
        res.status(500).json({
            success: false,
            error: 'SYNC_ERROR',
            message: 'Error during sync operation'
        });
    }
});
exports.default = router;
//# sourceMappingURL=reco.js.map
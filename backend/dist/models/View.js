"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewModel = void 0;
const db_1 = require("../db");
class ViewModel {
    static async create(data) {
        const [result] = await db_1.pool.execute('INSERT INTO `View` (user_id, game_id) VALUES (?, ?)', [data.user_id, data.game_id]);
        return result.insertId;
    }
    static async findByUserId(userId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM `View` WHERE user_id = ? ORDER BY view_id DESC', [userId]);
        return rows;
    }
    static async findByUserIdWithDetails(userId) {
        const [rows] = await db_1.pool.execute(`
      SELECT 
        v.view_id,
        v.user_id,
        v.game_id,
        v.viewed_at,
        v.view_count,
        g.name,
        g.price,
        g.image,
        g.description,
        g.average_rating,
        p.name as publisher_name
      FROM \`View\` v
      JOIN \`Game\` g ON v.game_id = g.game_id
      LEFT JOIN \`Publisher\` p ON g.publisher_id = p.publisher_id
      WHERE v.user_id = ?
      ORDER BY v.viewed_at DESC
    `, [userId]);
        const views = rows;
        // Get genres for each game
        for (const view of views) {
            const [genreRows] = await db_1.pool.execute(`
        SELECT g.name 
        FROM \`Genre\` g
        JOIN \`Game_Genre\` gg ON g.genre_id = gg.genre_id
        WHERE gg.game_id = ?
      `, [view.game_id]);
            view.genres = genreRows.map(row => row.name);
            // Get platforms for each game
            const [platformRows] = await db_1.pool.execute(`
        SELECT p.name 
        FROM \`Platform\` p
        JOIN \`Game_Platform\` gp ON p.platform_id = gp.platform_id
        WHERE gp.game_id = ?
      `, [view.game_id]);
            view.platforms = platformRows.map(row => row.name);
        }
        return views;
    }
    static async findByUserAndGame(userId, gameId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM `View` WHERE user_id = ? AND game_id = ?', [userId, gameId]);
        const views = rows;
        return views.length > 0 ? views[0] : null;
    }
    static async delete(viewId) {
        const [result] = await db_1.pool.execute('DELETE FROM `View` WHERE view_id = ?', [viewId]);
        return result.affectedRows > 0;
    }
    static async deleteByUserAndGame(userId, gameId) {
        const [result] = await db_1.pool.execute('DELETE FROM `View` WHERE user_id = ? AND game_id = ?', [userId, gameId]);
        return result.affectedRows > 0;
    }
    static async addView(userId, gameId) {
        // Check if view already exists
        const existing = await this.findByUserAndGame(userId, gameId);
        if (existing) {
            // Update the existing view timestamp and increment view count
            await db_1.pool.execute('UPDATE `View` SET viewed_at = CURRENT_TIMESTAMP, view_count = view_count + 1 WHERE view_id = ?', [existing.view_id]);
            return existing.view_id;
        }
        // Create new view with initial count of 1
        const [result] = await db_1.pool.execute('INSERT INTO `View` (user_id, game_id, view_count) VALUES (?, ?, 1)', [userId, gameId]);
        return result.insertId;
    }
}
exports.ViewModel = ViewModel;
//# sourceMappingURL=View.js.map
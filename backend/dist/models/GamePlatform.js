"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GamePlatformModel = void 0;
const db_1 = require("../db");
class GamePlatformModel {
    // Get all platforms for a specific game
    static async findByGameId(gameId) {
        const [rows] = await db_1.pool.execute('SELECT platform_id FROM Game_Platform WHERE game_id = ?', [gameId]);
        return rows.map((row) => row.platform_id);
    }
    // Get all games for a specific platform
    static async findByPlatformId(platformId) {
        const [rows] = await db_1.pool.execute('SELECT game_id FROM Game_Platform WHERE platform_id = ?', [platformId]);
        return rows.map((row) => row.game_id);
    }
    // Add platform to game
    static async addPlatformToGame(gameId, platformId) {
        try {
            await db_1.pool.execute('INSERT INTO Game_Platform (game_id, platform_id) VALUES (?, ?)', [gameId, platformId]);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    // Remove platform from game
    static async removePlatformFromGame(gameId, platformId) {
        const [result] = await db_1.pool.execute('DELETE FROM Game_Platform WHERE game_id = ? AND platform_id = ?', [gameId, platformId]);
        return result.affectedRows > 0;
    }
    // Set platforms for a game (replace all existing platforms)
    static async setPlatformsForGame(gameId, platformIds) {
        const connection = await db_1.pool.getConnection();
        try {
            await connection.beginTransaction();
            // Remove all existing platforms for this game
            await connection.execute('DELETE FROM Game_Platform WHERE game_id = ?', [gameId]);
            // Add new platforms
            if (platformIds.length > 0) {
                const values = platformIds.map(() => '(?, ?)').join(', ');
                const params = platformIds.flatMap(platformId => [gameId, platformId]);
                await connection.execute(`INSERT INTO Game_Platform (game_id, platform_id) VALUES ${values}`, params);
            }
            await connection.commit();
            return true;
        }
        catch (error) {
            await connection.rollback();
            return false;
        }
        finally {
            connection.release();
        }
    }
    // Check if game has specific platform
    static async gameHasPlatform(gameId, platformId) {
        const [rows] = await db_1.pool.execute('SELECT COUNT(*) as count FROM Game_Platform WHERE game_id = ? AND platform_id = ?', [gameId, platformId]);
        return rows[0].count > 0;
    }
    // Get all game-platform relationships
    static async findAll() {
        const [rows] = await db_1.pool.execute('SELECT * FROM Game_Platform');
        return rows;
    }
}
exports.GamePlatformModel = GamePlatformModel;
//# sourceMappingURL=GamePlatform.js.map
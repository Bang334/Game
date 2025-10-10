"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameLanguageModel = void 0;
const db_1 = require("../db");
class GameLanguageModel {
    // Get all languages for a specific game
    static async findByGameId(gameId) {
        const [rows] = await db_1.pool.execute('SELECT language_id FROM Game_Language WHERE game_id = ?', [gameId]);
        return rows.map((row) => row.language_id);
    }
    // Get all games for a specific language
    static async findByLanguageId(languageId) {
        const [rows] = await db_1.pool.execute('SELECT game_id FROM Game_Language WHERE language_id = ?', [languageId]);
        return rows.map((row) => row.game_id);
    }
    // Add language to game
    static async addLanguageToGame(gameId, languageId) {
        try {
            await db_1.pool.execute('INSERT INTO Game_Language (game_id, language_id) VALUES (?, ?)', [gameId, languageId]);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    // Remove language from game
    static async removeLanguageFromGame(gameId, languageId) {
        const [result] = await db_1.pool.execute('DELETE FROM Game_Language WHERE game_id = ? AND language_id = ?', [gameId, languageId]);
        return result.affectedRows > 0;
    }
    // Set languages for a game (replace all existing languages)
    static async setLanguagesForGame(gameId, languageIds) {
        const connection = await db_1.pool.getConnection();
        try {
            await connection.beginTransaction();
            // Remove all existing languages for this game
            await connection.execute('DELETE FROM Game_Language WHERE game_id = ?', [gameId]);
            // Add new languages
            if (languageIds.length > 0) {
                const values = languageIds.map(() => '(?, ?)').join(', ');
                const params = languageIds.flatMap(languageId => [gameId, languageId]);
                await connection.execute(`INSERT INTO Game_Language (game_id, language_id) VALUES ${values}`, params);
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
    // Check if game has specific language
    static async gameHasLanguage(gameId, languageId) {
        const [rows] = await db_1.pool.execute('SELECT COUNT(*) as count FROM Game_Language WHERE game_id = ? AND language_id = ?', [gameId, languageId]);
        return rows[0].count > 0;
    }
    // Get all game-language relationships
    static async findAll() {
        const [rows] = await db_1.pool.execute('SELECT * FROM Game_Language');
        return rows;
    }
}
exports.GameLanguageModel = GameLanguageModel;
//# sourceMappingURL=GameLanguage.js.map
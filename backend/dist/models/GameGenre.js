"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameGenreModel = void 0;
const db_1 = require("../db");
class GameGenreModel {
    // Get all genres for a specific game
    static async findByGameId(gameId) {
        const [rows] = await db_1.pool.execute('SELECT genre_id FROM Game_Genre WHERE game_id = ?', [gameId]);
        return rows.map((row) => row.genre_id);
    }
    // Get all games for a specific genre
    static async findByGenreId(genreId) {
        const [rows] = await db_1.pool.execute('SELECT game_id FROM Game_Genre WHERE genre_id = ?', [genreId]);
        return rows.map((row) => row.game_id);
    }
    // Add genre to game
    static async addGenreToGame(gameId, genreId) {
        try {
            await db_1.pool.execute('INSERT INTO Game_Genre (game_id, genre_id) VALUES (?, ?)', [gameId, genreId]);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    // Remove genre from game
    static async removeGenreFromGame(gameId, genreId) {
        const [result] = await db_1.pool.execute('DELETE FROM Game_Genre WHERE game_id = ? AND genre_id = ?', [gameId, genreId]);
        return result.affectedRows > 0;
    }
    // Set genres for a game (replace all existing genres)
    static async setGenresForGame(gameId, genreIds) {
        const connection = await db_1.pool.getConnection();
        try {
            await connection.beginTransaction();
            // Remove all existing genres for this game
            await connection.execute('DELETE FROM Game_Genre WHERE game_id = ?', [gameId]);
            // Add new genres
            if (genreIds.length > 0) {
                const values = genreIds.map(() => '(?, ?)').join(', ');
                const params = genreIds.flatMap(genreId => [gameId, genreId]);
                await connection.execute(`INSERT INTO Game_Genre (game_id, genre_id) VALUES ${values}`, params);
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
    // Check if game has specific genre
    static async gameHasGenre(gameId, genreId) {
        const [rows] = await db_1.pool.execute('SELECT COUNT(*) as count FROM Game_Genre WHERE game_id = ? AND genre_id = ?', [gameId, genreId]);
        return rows[0].count > 0;
    }
    // Get all game-genre relationships
    static async findAll() {
        const [rows] = await db_1.pool.execute('SELECT * FROM Game_Genre');
        return rows;
    }
}
exports.GameGenreModel = GameGenreModel;
//# sourceMappingURL=GameGenre.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenreModel = void 0;
const db_1 = require("../db");
class GenreModel {
    // Get all genres
    static async findAll() {
        const [rows] = await db_1.pool.execute('SELECT * FROM Genre ORDER BY name');
        return rows;
    }
    // Get genre by ID
    static async findById(genreId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Genre WHERE genre_id = ?', [genreId]);
        const genres = rows;
        return genres.length > 0 ? genres[0] : null;
    }
    // Get genre by name
    static async findByName(name) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Genre WHERE name = ?', [name]);
        const genres = rows;
        return genres.length > 0 ? genres[0] : null;
    }
    // Search genres by name (partial match)
    static async searchByName(searchTerm) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Genre WHERE name LIKE ? ORDER BY name', [`%${searchTerm}%`]);
        return rows;
    }
    // Create new genre
    static async create(data) {
        const [result] = await db_1.pool.execute('INSERT INTO Genre (name) VALUES (?)', [data.name]);
        return result.insertId;
    }
    // Update genre
    static async update(genreId, data) {
        const [result] = await db_1.pool.execute('UPDATE Genre SET name = ? WHERE genre_id = ?', [data.name, genreId]);
        return result.affectedRows > 0;
    }
    // Delete genre
    static async delete(genreId) {
        const [result] = await db_1.pool.execute('DELETE FROM Genre WHERE genre_id = ?', [genreId]);
        return result.affectedRows > 0;
    }
    // Get genre with game count
    static async findWithGameCount() {
        const [rows] = await db_1.pool.execute(`
      SELECT g.*, COUNT(gg.game_id) as game_count
      FROM Genre g
      LEFT JOIN Game_Genre gg ON g.genre_id = gg.genre_id
      GROUP BY g.genre_id
      ORDER BY g.name
    `);
        return rows;
    }
}
exports.GenreModel = GenreModel;
//# sourceMappingURL=Genre.js.map
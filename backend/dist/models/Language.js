"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageModel = void 0;
const db_1 = require("../db");
class LanguageModel {
    // Get all languages
    static async findAll() {
        const [rows] = await db_1.pool.execute('SELECT * FROM Language ORDER BY name');
        return rows;
    }
    // Get language by ID
    static async findById(languageId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Language WHERE language_id = ?', [languageId]);
        const languages = rows;
        return languages.length > 0 ? languages[0] : null;
    }
    // Get language by name
    static async findByName(name) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Language WHERE name = ?', [name]);
        const languages = rows;
        return languages.length > 0 ? languages[0] : null;
    }
    // Search languages by name (partial match)
    static async searchByName(searchTerm) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Language WHERE name LIKE ? ORDER BY name', [`%${searchTerm}%`]);
        return rows;
    }
    // Create new language
    static async create(data) {
        const [result] = await db_1.pool.execute('INSERT INTO Language (name) VALUES (?)', [data.name]);
        return result.insertId;
    }
    // Update language
    static async update(languageId, data) {
        const [result] = await db_1.pool.execute('UPDATE Language SET name = ? WHERE language_id = ?', [data.name, languageId]);
        return result.affectedRows > 0;
    }
    // Delete language
    static async delete(languageId) {
        const [result] = await db_1.pool.execute('DELETE FROM Language WHERE language_id = ?', [languageId]);
        return result.affectedRows > 0;
    }
    // Get language with game count
    static async findWithGameCount() {
        const [rows] = await db_1.pool.execute(`
      SELECT l.*, COUNT(gl.game_id) as game_count
      FROM Language l
      LEFT JOIN Game_Language gl ON l.language_id = gl.language_id
      GROUP BY l.language_id
      ORDER BY l.name
    `);
        return rows;
    }
}
exports.LanguageModel = LanguageModel;
//# sourceMappingURL=Language.js.map
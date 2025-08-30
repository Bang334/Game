"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformModel = void 0;
const db_1 = require("../db");
class PlatformModel {
    // Get all platforms
    static async findAll() {
        const [rows] = await db_1.pool.execute('SELECT * FROM Platform ORDER BY name');
        return rows;
    }
    // Get platform by ID
    static async findById(platformId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Platform WHERE platform_id = ?', [platformId]);
        const platforms = rows;
        return platforms.length > 0 ? platforms[0] : null;
    }
    // Get platform by name
    static async findByName(name) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Platform WHERE name = ?', [name]);
        const platforms = rows;
        return platforms.length > 0 ? platforms[0] : null;
    }
    // Search platforms by name (partial match)
    static async searchByName(searchTerm) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Platform WHERE name LIKE ? ORDER BY name', [`%${searchTerm}%`]);
        return rows;
    }
    // Create new platform
    static async create(data) {
        const [result] = await db_1.pool.execute('INSERT INTO Platform (name) VALUES (?)', [data.name]);
        return result.insertId;
    }
    // Update platform
    static async update(platformId, data) {
        const [result] = await db_1.pool.execute('UPDATE Platform SET name = ? WHERE platform_id = ?', [data.name, platformId]);
        return result.affectedRows > 0;
    }
    // Delete platform
    static async delete(platformId) {
        const [result] = await db_1.pool.execute('DELETE FROM Platform WHERE platform_id = ?', [platformId]);
        return result.affectedRows > 0;
    }
    // Get platform with game count
    static async findWithGameCount() {
        const [rows] = await db_1.pool.execute(`
      SELECT p.*, COUNT(gp.game_id) as game_count
      FROM Platform p
      LEFT JOIN Game_Platform gp ON p.platform_id = gp.platform_id
      GROUP BY p.platform_id
      ORDER BY p.name
    `);
        return rows;
    }
}
exports.PlatformModel = PlatformModel;
//# sourceMappingURL=Platform.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublisherModel = void 0;
const db_1 = require("../db");
class PublisherModel {
    // Get all publishers
    static async findAll() {
        const [rows] = await db_1.pool.execute('SELECT * FROM Publisher ORDER BY name');
        return rows;
    }
    // Get publisher by ID
    static async findById(publisherId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Publisher WHERE publisher_id = ?', [publisherId]);
        const publishers = rows;
        return publishers.length > 0 ? publishers[0] : null;
    }
    // Get publisher by name
    static async findByName(name) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Publisher WHERE name = ?', [name]);
        const publishers = rows;
        return publishers.length > 0 ? publishers[0] : null;
    }
    // Search publishers by name (partial match)
    static async searchByName(searchTerm) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Publisher WHERE name LIKE ? ORDER BY name', [`%${searchTerm}%`]);
        return rows;
    }
    // Create new publisher
    static async create(data) {
        const [result] = await db_1.pool.execute('INSERT INTO Publisher (name) VALUES (?)', [data.name]);
        return result.insertId;
    }
    // Update publisher
    static async update(publisherId, data) {
        const [result] = await db_1.pool.execute('UPDATE Publisher SET name = ? WHERE publisher_id = ?', [data.name, publisherId]);
        return result.affectedRows > 0;
    }
    // Delete publisher
    static async delete(publisherId) {
        const [result] = await db_1.pool.execute('DELETE FROM Publisher WHERE publisher_id = ?', [publisherId]);
        return result.affectedRows > 0;
    }
    // Get publisher with game count
    static async findWithGameCount() {
        const [rows] = await db_1.pool.execute(`
      SELECT p.*, COUNT(g.game_id) as game_count
      FROM Publisher p
      LEFT JOIN Game g ON p.publisher_id = g.publisher_id
      GROUP BY p.publisher_id
      ORDER BY p.name
    `);
        return rows;
    }
}
exports.PublisherModel = PublisherModel;
//# sourceMappingURL=Publisher.js.map
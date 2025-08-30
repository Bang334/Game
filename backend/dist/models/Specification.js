"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SpecificationModel = void 0;
const db_1 = require("../db");
class SpecificationModel {
    // Get all specifications
    static async findAll() {
        const [rows] = await db_1.pool.execute('SELECT * FROM Specification ORDER BY game_id, type');
        return rows;
    }
    // Get specification by ID
    static async findById(specId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Specification WHERE spec_id = ?', [specId]);
        const specs = rows;
        return specs.length > 0 ? specs[0] : null;
    }
    // Get specifications for a specific game
    static async findByGameId(gameId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Specification WHERE game_id = ? ORDER BY type', [gameId]);
        return rows;
    }
    // Get minimum specifications for a game
    static async findMinSpecsByGameId(gameId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Specification WHERE game_id = ? AND type = "MIN"', [gameId]);
        const specs = rows;
        return specs.length > 0 ? specs[0] : null;
    }
    // Get recommended specifications for a game
    static async findRecSpecsByGameId(gameId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Specification WHERE game_id = ? AND type = "REC"', [gameId]);
        const specs = rows;
        return specs.length > 0 ? specs[0] : null;
    }
    // Create new specification
    static async create(data) {
        const [result] = await db_1.pool.execute(`
      INSERT INTO Specification (game_id, type, cpu, ram, gpu, storage)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
            data.game_id,
            data.type,
            data.cpu || null,
            data.ram || null,
            data.gpu || null,
            data.storage || null
        ]);
        return result.insertId;
    }
    // Update specification
    static async update(specId, data) {
        const fields = [];
        const values = [];
        if (data.cpu !== undefined) {
            fields.push('cpu = ?');
            values.push(data.cpu);
        }
        if (data.ram !== undefined) {
            fields.push('ram = ?');
            values.push(data.ram);
        }
        if (data.gpu !== undefined) {
            fields.push('gpu = ?');
            values.push(data.gpu);
        }
        if (data.storage !== undefined) {
            fields.push('storage = ?');
            values.push(data.storage);
        }
        if (fields.length === 0)
            return false;
        values.push(specId);
        const [result] = await db_1.pool.execute(`UPDATE Specification SET ${fields.join(', ')} WHERE spec_id = ?`, values);
        return result.affectedRows > 0;
    }
    // Delete specification
    static async delete(specId) {
        const [result] = await db_1.pool.execute('DELETE FROM Specification WHERE spec_id = ?', [specId]);
        return result.affectedRows > 0;
    }
    // Delete all specifications for a game
    static async deleteByGameId(gameId) {
        const [result] = await db_1.pool.execute('DELETE FROM Specification WHERE game_id = ?', [gameId]);
        return result.affectedRows > 0;
    }
    // Upsert specifications for a game (create or update)
    static async upsertSpecsForGame(gameId, minSpecs, recSpecs) {
        const connection = await db_1.pool.getConnection();
        try {
            await connection.beginTransaction();
            // Delete existing specifications for this game
            await connection.execute('DELETE FROM Specification WHERE game_id = ?', [gameId]);
            // Insert minimum specifications if provided
            if (minSpecs) {
                await connection.execute(`
          INSERT INTO Specification (game_id, type, cpu, ram, gpu, storage)
          VALUES (?, 'MIN', ?, ?, ?, ?)
        `, [
                    gameId,
                    minSpecs.cpu || null,
                    minSpecs.ram || null,
                    minSpecs.gpu || null,
                    minSpecs.storage || null
                ]);
            }
            // Insert recommended specifications if provided
            if (recSpecs) {
                await connection.execute(`
          INSERT INTO Specification (game_id, type, cpu, ram, gpu, storage)
          VALUES (?, 'REC', ?, ?, ?, ?)
        `, [
                    gameId,
                    recSpecs.cpu || null,
                    recSpecs.ram || null,
                    recSpecs.gpu || null,
                    recSpecs.storage || null
                ]);
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
}
exports.SpecificationModel = SpecificationModel;
//# sourceMappingURL=Specification.js.map
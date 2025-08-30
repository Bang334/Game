"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleModel = void 0;
const db_1 = require("../db");
class RoleModel {
    // Get all roles
    static async findAll() {
        const [rows] = await db_1.pool.execute('SELECT * FROM Role ORDER BY role_id');
        return rows;
    }
    // Get role by ID
    static async findById(roleId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Role WHERE role_id = ?', [roleId]);
        const roles = rows;
        return roles.length > 0 ? roles[0] : null;
    }
    // Get role by name
    static async findByName(name) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Role WHERE name = ?', [name]);
        const roles = rows;
        return roles.length > 0 ? roles[0] : null;
    }
    // Create new role
    static async create(data) {
        const [result] = await db_1.pool.execute('INSERT INTO Role (name) VALUES (?)', [data.name]);
        return result.insertId;
    }
    // Update role
    static async update(roleId, data) {
        const [result] = await db_1.pool.execute('UPDATE Role SET name = ? WHERE role_id = ?', [data.name, roleId]);
        return result.affectedRows > 0;
    }
    // Delete role
    static async delete(roleId) {
        const [result] = await db_1.pool.execute('DELETE FROM Role WHERE role_id = ?', [roleId]);
        return result.affectedRows > 0;
    }
}
exports.RoleModel = RoleModel;
//# sourceMappingURL=Role.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const db_1 = require("../db");
class UserModel {
    // Get all users
    static async findAll() {
        const [rows] = await db_1.pool.execute('SELECT * FROM User ORDER BY user_id');
        return rows;
    }
    // Get user by ID
    static async findById(userId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM User WHERE user_id = ?', [userId]);
        const users = rows;
        return users.length > 0 ? users[0] : null;
    }
    // Get user by email
    static async findByEmail(email) {
        const [rows] = await db_1.pool.execute('SELECT * FROM User WHERE email = ?', [email]);
        const users = rows;
        return users.length > 0 ? users[0] : null;
    }
    // Get user by username
    static async findByUsername(username) {
        const [rows] = await db_1.pool.execute('SELECT * FROM User WHERE username = ?', [username]);
        const users = rows;
        return users.length > 0 ? users[0] : null;
    }
    // Get user with role information
    static async findByIdWithRole(userId) {
        const [rows] = await db_1.pool.execute(`
      SELECT u.*, r.name as role_name 
      FROM User u 
      JOIN Role r ON u.role_id = r.role_id 
      WHERE u.user_id = ?
    `, [userId]);
        const users = rows;
        return users.length > 0 ? users[0] : null;
    }
    // Get all users with role information
    static async findAllWithRole() {
        const [rows] = await db_1.pool.execute(`
      SELECT u.*, r.name as role_name 
      FROM User u 
      JOIN Role r ON u.role_id = r.role_id 
      ORDER BY u.user_id
    `);
        return rows;
    }
    // Create new user
    static async create(data) {
        const [result] = await db_1.pool.execute('INSERT INTO User (username, email, password, age, gender, balance, role_id) VALUES (?, ?, ?, ?, ?, ?, ?)', [data.username, data.email, data.password, data.age || null, data.gender || null, data.balance || 0, data.role_id]);
        return result.insertId;
    }
    // Update user
    static async update(userId, data) {
        const fields = [];
        const values = [];
        if (data.username !== undefined) {
            fields.push('username = ?');
            values.push(data.username);
        }
        if (data.email !== undefined) {
            fields.push('email = ?');
            values.push(data.email);
        }
        if (data.password !== undefined) {
            fields.push('password = ?');
            values.push(data.password);
        }
        if (data.age !== undefined) {
            fields.push('age = ?');
            values.push(data.age);
        }
        if (data.gender !== undefined) {
            fields.push('gender = ?');
            values.push(data.gender);
        }
        if (data.balance !== undefined) {
            fields.push('balance = ?');
            values.push(data.balance);
        }
        if (data.role_id !== undefined) {
            fields.push('role_id = ?');
            values.push(data.role_id);
        }
        if (fields.length === 0)
            return false;
        values.push(userId);
        const [result] = await db_1.pool.execute(`UPDATE User SET ${fields.join(', ')} WHERE user_id = ?`, values);
        return result.affectedRows > 0;
    }
    // Update user balance
    static async updateBalance(userId, newBalance) {
        const [result] = await db_1.pool.execute('UPDATE User SET balance = ? WHERE user_id = ?', [newBalance, userId]);
        return result.affectedRows > 0;
    }
    // Delete user
    static async delete(userId) {
        const [result] = await db_1.pool.execute('DELETE FROM User WHERE user_id = ?', [userId]);
        return result.affectedRows > 0;
    }
    // Check if email exists
    static async emailExists(email, excludeUserId) {
        let query = 'SELECT COUNT(*) as count FROM User WHERE email = ?';
        let params = [email];
        if (excludeUserId) {
            query += ' AND user_id != ?';
            params.push(excludeUserId);
        }
        const [rows] = await db_1.pool.execute(query, params);
        return rows[0].count > 0;
    }
    // Check if username exists
    static async usernameExists(username, excludeUserId) {
        let query = 'SELECT COUNT(*) as count FROM User WHERE username = ?';
        let params = [username];
        if (excludeUserId) {
            query += ' AND user_id != ?';
            params.push(excludeUserId);
        }
        const [rows] = await db_1.pool.execute(query, params);
        return rows[0].count > 0;
    }
}
exports.UserModel = UserModel;
//# sourceMappingURL=User.js.map
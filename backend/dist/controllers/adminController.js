"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const db_1 = require("../db");
class AdminController {
    /**
     * Get all users (Admin only)
     */
    static async getAllUsers(req, res) {
        try {
            const [rows] = await db_1.pool.execute(`
        SELECT u.user_id, u.username, u.email, u.balance, u.age, u.gender, u.role_id,
               r.name as role_name
        FROM user u
        JOIN role r ON u.role_id = r.role_id
        ORDER BY u.user_id DESC
      `);
            res.json({ users: rows });
        }
        catch (error) {
            console.error('Error in getAllUsers:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
}
exports.AdminController = AdminController;
//# sourceMappingURL=adminController.js.map
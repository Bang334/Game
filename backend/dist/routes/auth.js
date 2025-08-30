"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me';
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'MISSING_FIELDS' });
    try {
        const [rows] = await db_1.pool.query(`SELECT u.user_id, u.email, u.password, r.name as role
       FROM users u
       JOIN roles r ON r.role_id = u.role_id
       WHERE u.email = ? LIMIT 1`, [email]);
        const list = rows;
        if (!list || list.length === 0)
            return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        const user = list[0];
        if (user.password !== password)
            return res.status(401).json({ error: 'INVALID_CREDENTIALS' });
        const token = jsonwebtoken_1.default.sign({ sub: user.user_id, role: user.role, email: user.email }, JWT_SECRET, {
            expiresIn: '2h',
        });
        res.json({ token, role: user.role });
    }
    catch (e) {
        res.status(500).json({ error: 'DB_ERROR' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const models_1 = require("../models");
class UserController {
    /**
     * Get user profile
     */
    static async getProfile(req, res) {
        try {
            const userId = req.user.user_id;
            const user = await models_1.UserModel.findByIdWithRole(userId);
            if (!user) {
                return res.status(404).json({ error: 'USER_NOT_FOUND' });
            }
            res.json({ user });
        }
        catch (error) {
            console.error('Error in getProfile:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Update user profile
     */
    static async updateProfile(req, res) {
        try {
            const userId = req.user.user_id;
            const { username, email, password, age, gender } = req.body;
            // Check if email is being changed and if it already exists
            if (email) {
                const emailExists = await models_1.UserModel.emailExists(email, userId);
                if (emailExists) {
                    return res.status(400).json({ error: 'EMAIL_ALREADY_EXISTS' });
                }
            }
            // Check if username is being changed and if it already exists
            if (username) {
                const usernameExists = await models_1.UserModel.usernameExists(username, userId);
                if (usernameExists) {
                    return res.status(400).json({ error: 'USERNAME_ALREADY_EXISTS' });
                }
            }
            // Update user
            const updateData = {};
            if (username !== undefined)
                updateData.username = username;
            if (email !== undefined)
                updateData.email = email;
            if (password !== undefined) {
                // Store password as plain text
                updateData.password = password;
            }
            if (age !== undefined)
                updateData.age = age;
            if (gender !== undefined)
                updateData.gender = gender;
            const success = await models_1.UserModel.update(userId, updateData);
            if (success) {
                const updatedUser = await models_1.UserModel.findByIdWithRole(userId);
                res.json({ success: true, user: updatedUser });
            }
            else {
                res.status(400).json({ error: 'UPDATE_FAILED' });
            }
        }
        catch (error) {
            console.error('Error in updateProfile:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Get all users (Admin only)
     */
    static async getAllUsers(req, res) {
        try {
            const users = await models_1.UserModel.findAll();
            res.json({ users });
        }
        catch (error) {
            console.error('Error in getAllUsers:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
}
exports.UserController = UserController;
//# sourceMappingURL=userController.js.map
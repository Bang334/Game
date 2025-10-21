"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceController = void 0;
const models_1 = require("../models");
const db_1 = require("../db");
class BalanceController {
    /**
     * Get user's balance transactions
     */
    static async getUserTransactions(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return res.status(401).json({ error: 'UNAUTHORIZED' });
            }
            const limit = parseInt(req.query.limit) || 50;
            const transactions = await models_1.BalanceTransactionModel.findByUserId(userId, limit);
            const stats = await models_1.BalanceTransactionModel.getStatsByUserId(userId);
            res.json({
                transactions,
                stats
            });
        }
        catch (error) {
            console.error('Error in getUserTransactions:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Request deposit
     */
    static async requestDeposit(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return res.status(401).json({ error: 'UNAUTHORIZED' });
            }
            const { amount, description } = req.body;
            if (!amount || amount <= 0) {
                return res.status(400).json({ error: 'INVALID_AMOUNT' });
            }
            // Get current balance
            const user = await models_1.UserModel.findById(userId);
            if (!user) {
                return res.status(404).json({ error: 'USER_NOT_FOUND' });
            }
            // Create pending deposit transaction
            const transactionId = await models_1.BalanceTransactionModel.create({
                user_id: userId,
                amount: amount,
                balance_before: user.balance,
                balance_after: user.balance + amount,
                transaction_type: 'DEPOSIT',
                status: 'PENDING',
                description: description || `Yêu cầu nạp ${new Intl.NumberFormat('vi-VN').format(amount)} VNĐ`
            });
            res.status(201).json({
                success: true,
                transaction_id: transactionId,
                message: 'Yêu cầu nạp tiền đã được gửi, vui lòng chờ admin duyệt'
            });
        }
        catch (error) {
            console.error('Error in requestDeposit:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Get user's pending deposits
     */
    static async getUserPendingDeposits(req, res) {
        try {
            const userId = req.user?.user_id;
            if (!userId) {
                return res.status(401).json({ error: 'UNAUTHORIZED' });
            }
            const pendingDeposits = await models_1.BalanceTransactionModel.getUserPendingDeposits(userId);
            res.json({ pendingDeposits });
        }
        catch (error) {
            console.error('Error in getUserPendingDeposits:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Get all deposit requests (Admin only)
     */
    static async getAllDepositRequests(req, res) {
        try {
            const { status, start_date, end_date, search } = req.query;
            // Build WHERE conditions
            let whereConditions = ['bt.transaction_type = "DEPOSIT"'];
            let queryParams = [];
            // Filter by status
            if (status && status !== 'ALL') {
                whereConditions.push('bt.status = ?');
                queryParams.push(status);
            }
            // Filter by date range
            if (start_date) {
                whereConditions.push('DATE(bt.created_at) >= ?');
                queryParams.push(start_date);
            }
            if (end_date) {
                whereConditions.push('DATE(bt.created_at) <= ?');
                queryParams.push(end_date);
            }
            // Search by username or email
            if (search) {
                whereConditions.push('(u.username LIKE ? OR u.email LIKE ?)');
                queryParams.push(`%${search}%`, `%${search}%`);
            }
            // Filter out undefined values
            queryParams = queryParams.filter(param => param !== undefined && param !== null);
            const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
            // Get all deposits without pagination
            const [rows] = await db_1.pool.execute(`
        SELECT 
          bt.transaction_id,
          bt.user_id,
          bt.amount,
          bt.status,
          bt.created_at,
          bt.reviewed_at,
          bt.reviewed_by,
          bt.description,
          u.username,
          u.email,
          reviewer.username as reviewer_name
        FROM balance_transaction bt
        JOIN user u ON bt.user_id = u.user_id
        LEFT JOIN user reviewer ON bt.reviewed_by = reviewer.user_id
        ${whereClause}
        ORDER BY bt.created_at DESC
      `, queryParams);
            const deposits = rows.map(row => ({
                transaction_id: row.transaction_id,
                user_id: row.user_id,
                amount: row.amount,
                status: row.status,
                created_at: row.created_at,
                reviewed_at: row.reviewed_at,
                reviewed_by: row.reviewed_by,
                rejection_reason: row.status === 'REJECTED' ? row.description : null,
                user: {
                    username: row.username,
                    email: row.email
                },
                reviewer: row.reviewer_name
            }));
            res.json({
                deposits,
                total: deposits.length
            });
        }
        catch (error) {
            console.error('Error in getAllDepositRequests:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Approve deposit request (Admin only)
     */
    static async approveDeposit(req, res) {
        try {
            const transactionId = parseInt(req.params.id);
            const adminUserId = req.user.user_id;
            // Get transaction details
            const transaction = await models_1.BalanceTransactionModel.findById(transactionId);
            if (!transaction) {
                return res.status(404).json({ error: 'TRANSACTION_NOT_FOUND' });
            }
            if (transaction.status !== 'PENDING' || transaction.transaction_type !== 'DEPOSIT') {
                return res.status(400).json({ error: 'INVALID_TRANSACTION_STATUS' });
            }
            // Get user
            const user = await models_1.UserModel.findById(transaction.user_id);
            if (!user) {
                return res.status(404).json({ error: 'USER_NOT_FOUND' });
            }
            // Update user balance
            const newBalance = user.balance + transaction.amount;
            await models_1.UserModel.update(user.user_id, { balance: newBalance });
            // Update transaction with new balance_after
            await db_1.pool.execute(`UPDATE balance_transaction 
         SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW(), balance_after = ?
         WHERE transaction_id = ? AND transaction_type = 'DEPOSIT' AND status = 'PENDING'`, [adminUserId, newBalance, transactionId]);
            res.json({
                success: true,
                message: 'Đã duyệt yêu cầu nạp tiền',
                new_balance: newBalance
            });
        }
        catch (error) {
            console.error('Error in approveDeposit:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Reject deposit request (Admin only)
     */
    static async rejectDeposit(req, res) {
        try {
            const transactionId = parseInt(req.params.id);
            const adminUserId = req.user.user_id;
            const { reason } = req.body;
            // Get transaction details
            const transaction = await models_1.BalanceTransactionModel.findById(transactionId);
            if (!transaction) {
                return res.status(404).json({ error: 'TRANSACTION_NOT_FOUND' });
            }
            if (transaction.status !== 'PENDING' || transaction.transaction_type !== 'DEPOSIT') {
                return res.status(400).json({ error: 'INVALID_TRANSACTION_STATUS' });
            }
            // Reject the transaction
            await models_1.BalanceTransactionModel.rejectDeposit(transactionId, adminUserId, reason);
            res.json({
                success: true,
                message: 'Đã từ chối yêu cầu nạp tiền'
            });
        }
        catch (error) {
            console.error('Error in rejectDeposit:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
}
exports.BalanceController = BalanceController;
//# sourceMappingURL=balanceController.js.map
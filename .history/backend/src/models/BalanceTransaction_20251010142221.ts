import { pool } from '../db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface BalanceTransaction {
  transaction_id: number
  user_id: number
  amount: number
  balance_before: number
  balance_after: number
  transaction_type: 'DEPOSIT' | 'PURCHASE' | 'REFUND' | 'ADMIN_ADJUST'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  description: string | null
  related_game_id: number | null
  reviewed_by: number | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export interface BalanceTransactionWithGame extends BalanceTransaction {
  game_name?: string
  game_image?: string
  username?: string
  user_email?: string
  reviewer_name?: string
}

export const BalanceTransactionModel = {
  async create(data: {
    user_id: number
    amount: number
    balance_before: number
    balance_after: number
    transaction_type: 'DEPOSIT' | 'PURCHASE' | 'REFUND' | 'ADMIN_ADJUST'
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
    description?: string
    related_game_id?: number
  }): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO balance_transaction 
       (user_id, amount, balance_before, balance_after, transaction_type, status, description, related_game_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.amount,
        data.balance_before,
        data.balance_after,
        data.transaction_type,
        data.status || 'PENDING',
        data.description || null,
        data.related_game_id || null
      ]
    )
    return result.insertId
  },

  async findByUserId(userId: number, limit: number = 50): Promise<BalanceTransactionWithGame[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        bt.*,
        g.name as game_name,
        g.image as game_image,
        u.username as reviewer_name
       FROM balance_transaction bt
       LEFT JOIN game g ON bt.related_game_id = g.game_id
       LEFT JOIN user u ON bt.reviewed_by = u.user_id
       WHERE bt.user_id = ? AND bt.status = 'APPROVED'
       ORDER BY bt.created_at DESC
       LIMIT ?`,
      [userId, limit]
    )
    return rows as BalanceTransactionWithGame[]
  },

  async findById(transactionId: number): Promise<BalanceTransaction | null> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT * FROM balance_transaction WHERE transaction_id = ? LIMIT 1`,
      [transactionId]
    )
    return rows.length > 0 ? (rows[0] as BalanceTransaction) : null
  },

  async getStatsByUserId(userId: number): Promise<{
    total_deposits: number
    total_purchases: number
    transaction_count: number
  }> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        SUM(CASE WHEN transaction_type = 'DEPOSIT' AND status = 'APPROVED' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN transaction_type = 'PURCHASE' AND status = 'APPROVED' THEN ABS(amount) ELSE 0 END) as total_purchases,
        COUNT(*) as transaction_count
       FROM balance_transaction
       WHERE user_id = ? AND status = 'APPROVED'`,
      [userId]
    )
    return rows[0] as any
  },

  async findPendingDeposits(limit: number = 50): Promise<BalanceTransactionWithGame[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        bt.*,
        u.username,
        u.email as user_email
       FROM balance_transaction bt
       JOIN user u ON bt.user_id = u.user_id
       WHERE bt.transaction_type = 'DEPOSIT' AND bt.status = 'PENDING'
       ORDER BY bt.created_at ASC
       LIMIT ?`,
      [limit]
    )
    return rows as BalanceTransactionWithGame[]
  },

  async approveDeposit(transactionId: number, adminUserId: number): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE balance_transaction 
       SET status = 'APPROVED', reviewed_by = ?, reviewed_at = NOW()
       WHERE transaction_id = ? AND transaction_type = 'DEPOSIT' AND status = 'PENDING'`,
      [adminUserId, transactionId]
    )
    return result.affectedRows > 0
  },

  async rejectDeposit(transactionId: number, adminUserId: number, reason?: string): Promise<boolean> {
    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE balance_transaction 
       SET status = 'REJECTED', reviewed_by = ?, reviewed_at = NOW(), 
           description = CONCAT(COALESCE(description, ''), ' - Từ chối: ', ?)
       WHERE transaction_id = ? AND transaction_type = 'DEPOSIT' AND status = 'PENDING'`,
      [adminUserId, reason || 'Không có lý do', transactionId]
    )
    return result.affectedRows > 0
  },

  async getUserPendingDeposits(userId: number): Promise<BalanceTransactionWithGame[]> {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT bt.*
       FROM balance_transaction bt
       WHERE bt.user_id = ? AND bt.transaction_type = 'DEPOSIT' AND bt.status = 'PENDING'
       ORDER BY bt.created_at DESC`,
      [userId]
    )
    return rows as BalanceTransactionWithGame[]
  }
}


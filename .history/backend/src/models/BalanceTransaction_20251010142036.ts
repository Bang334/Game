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
  transfer_proof_image: string | null
  transfer_amount: number | null
  transfer_reference: string | null
  reviewed_by: number | null
  reviewed_at: string | null
  reject_reason: string | null
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
    description?: string
    related_game_id?: number
  }): Promise<number> {
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO balance_transaction 
       (user_id, amount, balance_before, balance_after, transaction_type, description, related_game_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        data.user_id,
        data.amount,
        data.balance_before,
        data.balance_after,
        data.transaction_type,
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
        g.image as game_image
       FROM balance_transaction bt
       LEFT JOIN game g ON bt.related_game_id = g.game_id
       WHERE bt.user_id = ?
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
        SUM(CASE WHEN transaction_type = 'DEPOSIT' THEN amount ELSE 0 END) as total_deposits,
        SUM(CASE WHEN transaction_type = 'PURCHASE' THEN ABS(amount) ELSE 0 END) as total_purchases,
        COUNT(*) as transaction_count
       FROM balance_transaction
       WHERE user_id = ?`,
      [userId]
    )
    return rows[0] as any
  }
}


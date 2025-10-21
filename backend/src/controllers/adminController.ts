import { Request, Response } from 'express'
import { pool } from '../db'

export class AdminController {
  /**
   * Get all users (Admin only)
   */
  static async getAllUsers(req: Request, res: Response) {
    try {
      const [rows] = await pool.execute(`
        SELECT u.user_id, u.username, u.email, u.balance, u.age, u.gender, u.role_id,
               r.name as role_name
        FROM user u
        JOIN role r ON u.role_id = r.role_id
        ORDER BY u.user_id DESC
      `)
      res.json({ users: rows })
    } catch (error) {
      console.error('Error in getAllUsers:', error)
      res.status(500).json({ error: 'DB_ERROR' })
    }
  }
}




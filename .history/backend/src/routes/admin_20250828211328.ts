import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me'

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'UNAUTHORIZED' })
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded?.role !== 'ADMIN') return res.status(403).json({ error: 'FORBIDDEN' })
    ;(req as any).user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED' })
  }
}

const router = Router()

router.get('/games', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT id, title, price FROM games ORDER BY id DESC LIMIT 100')
    res.json({ games: rows })
  } catch {
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.post('/games', requireAdmin, async (req: Request, res: Response) => {
  const { title, price } = req.body
  try {
    const [result] = await pool.query('INSERT INTO games (title, price) VALUES (?, ?)', [title, price])
    res.status(201).json({ created: true, id: (result as any).insertId })
  } catch {
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.get('/users', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.username, u.email, u.age, u.balance, r.name as role
       FROM users u JOIN roles r ON r.role_id = u.role_id
       ORDER BY u.user_id DESC LIMIT 200`
    )
    res.json({ users: rows })
  } catch {
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

export default router


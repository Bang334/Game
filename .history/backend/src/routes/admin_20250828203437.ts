import { Router, Request, Response } from 'express'
import { pool } from '../db'

const router = Router()

router.get('/games', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT id, title, price FROM games ORDER BY id DESC LIMIT 100')
    res.json({ games: rows })
  } catch {
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.post('/games', async (req: Request, res: Response) => {
  const { title, price } = req.body
  try {
    const [result] = await pool.query('INSERT INTO games (title, price) VALUES (?, ?)', [title, price])
    res.status(201).json({ created: true, id: (result as any).insertId })
  } catch {
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

export default router


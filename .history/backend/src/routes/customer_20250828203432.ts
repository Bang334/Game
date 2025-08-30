import { Router, Request, Response } from 'express'
import { pool } from '../db'

const router = Router()

router.get('/games', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT id, title, price FROM games ORDER BY id DESC LIMIT 50')
    res.json({ games: rows })
  } catch (err) {
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.get('/games/:id', async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT id, title, price FROM games WHERE id = ?', [req.params.id])
    const list = rows as any[]
    if (!list || list.length === 0) return res.status(404).json({ error: 'NOT_FOUND' })
    res.json(list[0])
  } catch (err) {
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

export default router


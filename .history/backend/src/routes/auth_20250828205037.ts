import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me'

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) return res.status(400).json({ error: 'MISSING_FIELDS' })
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.email, u.password, r.name as role
       FROM users u
       JOIN roles r ON r.role_id = u.role_id
       WHERE u.email = ? LIMIT 1`,
      [email]
    )
    const list = rows as any[]
    if (!list || list.length === 0) return res.status(401).json({ error: 'INVALID_CREDENTIALS' })
    const user = list[0]
    if (user.password !== password) return res.status(401).json({ error: 'INVALID_CREDENTIALS' })

    const token = jwt.sign({ sub: user.user_id, role: user.role, email: user.email }, JWT_SECRET, {
      expiresIn: '2h',
    })
    res.json({ token, role: user.role })
  } catch (e) {
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

export default router


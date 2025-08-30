import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

const router = Router()

const DEMO_USER = { id: 1, email: 'admin@example.com', password: 'admin123', role: 'admin' as const }
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me'

router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (email !== DEMO_USER.email || password !== DEMO_USER.password) {
    return res.status(401).json({ error: 'INVALID_CREDENTIALS' })
  }

  const token = jwt.sign({ sub: DEMO_USER.id, role: DEMO_USER.role, email: DEMO_USER.email }, JWT_SECRET, {
    expiresIn: '2h',
  })
  res.json({ token })
})

export default router


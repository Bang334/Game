import { Router } from 'express'

const router = Router()

router.get('/games', (_req, res) => {
  res.json({ games: [], message: 'List games for admin' })
})

router.post('/games', (req, res) => {
  res.status(201).json({ created: true, game: req.body })
})

export default router


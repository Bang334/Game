import { Router } from 'express'

const router = Router()

router.get('/games', (_req, res) => {
  res.json({ games: [], message: 'List games for customers' })
})

router.get('/games/:id', (req, res) => {
  res.json({ id: req.params.id, title: 'Example Game' })
})

export default router


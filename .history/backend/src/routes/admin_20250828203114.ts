import { Router, Request, Response } from 'express'

const router = Router()

router.get('/games', (_req: Request, res: Response) => {
  res.json({ games: [], message: 'List games for admin' })
})

router.post('/games', (req: Request, res: Response) => {
  res.status(201).json({ created: true, game: req.body })
})

export default router


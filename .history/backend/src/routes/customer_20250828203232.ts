import { Router, Request, Response } from 'express'

const router = Router()

router.get('/games', (_req: Request, res: Response) => {
  res.json({ games: [], message: 'List games for customers' })
})

router.get('/games/:id', (req: Request, res: Response) => {
  res.json({ id: req.params.id, title: 'Example Game' })
})

export default router


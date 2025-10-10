import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import adminRouter from './routes/admin'
import customerRouter from './routes/customer'
import authRouter from './routes/auth'
import recoRouter from './routes/reco'
import { pingDatabase } from './db'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', async (_req, res) => {
  try {
    await pingDatabase()
    res.json({ ok: true, db: 'up' })
  } catch {
    res.status(500).json({ ok: false, db: 'down' })
  }
})

// Serve static demo UI (e.g., http://localhost:3001/reco.html)
app.use(express.static(path.join(__dirname, '..', 'public')))

app.use('/api/admin', adminRouter)
app.use('/api/customer', customerRouter)
app.use('/api/auth', authRouter)
app.use('/api/reco', recoRouter)
app.use('/api/ai', aiRouter)

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})


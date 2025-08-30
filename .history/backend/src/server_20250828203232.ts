import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import adminRouter from './routes/admin'
import customerRouter from './routes/customer'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/admin', adminRouter)
app.use('/api/customer', customerRouter)

const port = Number(process.env.PORT ?? 3001)
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})


import { Router, Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db'
import { BalanceTransactionModel, UserModel } from '../models'

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me'

const router = Router()

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization || ''
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'NO_TOKEN' })
  }
  const token = auth.slice(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: 'FORBIDDEN' })
    }
    (req as any).user = decoded
    next()
  } catch (e) {
    console.error('Token verification error:', e)
    return res.status(401).json({ error: 'INVALID_TOKEN' })
  }
}

// Get all users
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(`
      SELECT u.user_id, u.username, u.email, u.balance, u.age, u.gender, u.role_id,
             r.name as role_name
      FROM user u
      JOIN role r ON u.role_id = r.role_id
      ORDER BY u.user_id DESC
    `)
    res.json({ users: rows })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Get all purchases
router.get('/purchases', requireAdmin, async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(`
      SELECT p.purchase_id, p.user_id, p.game_id, p.purchase_date, p.payment_method,
             u.username, u.email,
             g.name as game_title, g.price as game_price, g.image as game_image
      FROM purchase p
      JOIN user u ON p.user_id = u.user_id
      JOIN game g ON p.game_id = g.game_id
      ORDER BY p.purchase_date DESC
    `)
    
    // Transform flat data to nested structure expected by frontend
    const purchases = (rows as any[]).map(row => ({
      purchase_id: row.purchase_id,
      user_id: row.user_id,
      game_id: row.game_id,
      purchase_date: row.purchase_date,
      amount: row.game_price,
      payment_method: row.payment_method || 'bank_transfer',
      status: 'completed',
      user: {
        username: row.username,
        email: row.email
      },
      game: {
        title: row.game_title,
        image_url: row.game_image,
        price: row.game_price
      }
    }))
    
    res.json({ purchases })
  } catch (error) {
    console.error('Error fetching purchases:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Get all pending deposit requests
router.get('/deposit-requests', requireAdmin, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50
    const pendingDeposits = await BalanceTransactionModel.findPendingDeposits(limit)
    
    res.json({ deposits: pendingDeposits })
  } catch (error) {
    console.error('Error fetching deposit requests:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Approve deposit request
router.post('/deposit-requests/:id/approve', requireAdmin, async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id!)
    const adminUserId = (req as any).user.user_id
    
    // Get transaction details
    const transaction = await BalanceTransactionModel.findById(transactionId)
    if (!transaction) {
      return res.status(404).json({ error: 'TRANSACTION_NOT_FOUND' })
    }
    
    if (transaction.status !== 'PENDING' || transaction.transaction_type !== 'DEPOSIT') {
      return res.status(400).json({ error: 'INVALID_TRANSACTION_STATUS' })
    }
    
    // Get user
    const user = await UserModel.findById(transaction.user_id)
    if (!user) {
      return res.status(404).json({ error: 'USER_NOT_FOUND' })
    }
    
    // Update user balance
    const newBalance = user.balance + transaction.amount
    await UserModel.update(user.user_id, { balance: newBalance })
    
    // Update transaction balance_after to actual new balance
    await BalanceTransactionModel.approveDeposit(transactionId, adminUserId)
    
    res.json({ 
      success: true,
      message: 'Đã duyệt yêu cầu nạp tiền',
      new_balance: newBalance
    })
  } catch (error) {
    console.error('Error approving deposit:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Reject deposit request
router.post('/deposit-requests/:id/reject', requireAdmin, async (req: Request, res: Response) => {
  try {
    const transactionId = parseInt(req.params.id!)
    const adminUserId = (req as any).user.user_id
    const { reason } = req.body
    
    // Get transaction details
    const transaction = await BalanceTransactionModel.findById(transactionId)
    if (!transaction) {
      return res.status(404).json({ error: 'TRANSACTION_NOT_FOUND' })
    }
    
    if (transaction.status !== 'PENDING' || transaction.transaction_type !== 'DEPOSIT') {
      return res.status(400).json({ error: 'INVALID_TRANSACTION_STATUS' })
    }
    
    // Reject the transaction
    await BalanceTransactionModel.rejectDeposit(transactionId, adminUserId, reason)
    
    res.json({ 
      success: true,
      message: 'Đã từ chối yêu cầu nạp tiền'
    })
  } catch (error) {
    console.error('Error rejecting deposit:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

// Get all reviews
router.get('/reviews', requireAdmin, async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.execute(`
      SELECT r.review_id, r.user_id, r.game_id, r.rating, r.comment, r.created_at,
             u.username, u.email,
             g.name as game_name, g.image as game_image
      FROM review r
      JOIN user u ON r.user_id = u.user_id
      JOIN game g ON r.game_id = g.game_id
      ORDER BY r.created_at DESC
    `)
    
    // Transform flat data to nested structure expected by frontend
    const reviews = (rows as any[]).map(row => ({
      review_id: row.review_id,
      user_id: row.user_id,
      game_id: row.game_id,
      rating: row.rating,
      comment: row.comment,
      created_at: row.created_at,
      user: {
        username: row.username,
        email: row.email
      },
      game: {
        name: row.game_name,
        image: row.game_image
      }
    }))
    
    res.json({ reviews })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

export default router

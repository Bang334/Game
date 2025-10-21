import { Request, Response } from 'express'
import { PurchaseModel, UserModel, GameModel, BalanceTransactionModel } from '../models'
import { pool } from '../db'

export class PurchaseController {
  /**
   * Get user's purchases
   */
  static async getUserPurchases(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id
      
      if (!userId) {
        return res.status(401).json({ error: 'UNAUTHORIZED' })
      }
      
      const purchasesData = await PurchaseModel.findByUserIdWithDetails(userId)
      
      // Map to frontend expected format
      const purchases = purchasesData.map(purchase => ({
        purchase_id: purchase.purchase_id,
        game_id: purchase.game_id,
        name: purchase.game_name,
        price: purchase.price,
        image: purchase.image,
        description: purchase.description,
        average_rating: purchase.average_rating,
        genres: [],
        purchase_date: purchase.purchase_date,
        link_download: purchase.link_download,
        user_rating: 0
      }))
      
      res.json({ purchases })
    } catch (error) {
      console.error('Error in getUserPurchases:', error)
      res.status(500).json({ error: 'DB_ERROR' })
    }
  }

  /**
   * Create a new purchase
   */
  static async createPurchase(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.user_id
      
      if (!userId) {
        return res.status(401).json({ error: 'UNAUTHORIZED' })
      }
      
      const { game_id } = req.body
      
      if (!game_id) {
        return res.status(400).json({ error: 'GAME_ID_REQUIRED' })
      }
      
      // Check if game exists
      const game = await GameModel.findById(game_id)
      if (!game) {
        return res.status(404).json({ error: 'GAME_NOT_FOUND' })
      }
      
      // Check if user already purchased this game
      const hasPurchased = await PurchaseModel.userHasPurchased(userId, game_id)
      if (hasPurchased) {
        return res.status(400).json({ error: 'ALREADY_PURCHASED' })
      }
      
      // Check if user has enough balance
      const user = await UserModel.findById(userId)
      if (!user) {
        return res.status(404).json({ error: 'USER_NOT_FOUND' })
      }
      
      if (user.balance < game.price) {
        return res.status(400).json({ error: 'INSUFFICIENT_BALANCE' })
      }
      
      // Create purchase
      const purchaseId = await PurchaseModel.create({ 
        user_id: userId, 
        game_id, 
        payment_method: 'bank_transfer' 
      })
      
      // Deduct balance
      const newBalance = user.balance - game.price
      await UserModel.update(userId, { balance: newBalance })
      
      // Record balance transaction (auto-approved for purchases)
      await BalanceTransactionModel.create({
        user_id: userId,
        amount: -game.price,
        balance_before: user.balance,
        balance_after: newBalance,
        transaction_type: 'PURCHASE',
        status: 'APPROVED',
        description: `Mua game: ${game.name}`,
        related_game_id: game_id
      })
      
      // Increment game downloads
      await GameModel.incrementDownloads(game_id)
      
      res.status(201).json({ 
        success: true, 
        purchase_id: purchaseId,
        new_balance: newBalance,
        message: 'Game purchased successfully'
      })
    } catch (error) {
      console.error('Error in createPurchase:', error)
      res.status(500).json({ error: 'DB_ERROR' })
    }
  }

  /**
   * Get all purchases (Admin only)
   */
  static async getAllPurchases(req: Request, res: Response) {
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
      console.error('Error in getAllPurchases:', error)
      res.status(500).json({ error: 'DB_ERROR' })
    }
  }
}




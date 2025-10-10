import { Router, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { pool } from '../db'
import { UserModel, RoleModel } from '../models'

const router = Router()

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_change_me'

router.post('/register', async (req: Request, res: Response) => {
  const { username, email, password, age, gender } = req.body as { 
    username?: string
    email?: string
    password?: string
    age?: number
    gender?: string
  }
  
  // Validate required fields
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'MISSING_FIELDS' })
  }
  
  try {
    // Check if email already exists
    const existingUser = await UserModel.findByEmail(email)
    if (existingUser) {
      return res.status(400).json({ error: 'EMAIL_ALREADY_EXISTS' })
    }
    
    // Check if username already exists
    const existingUsername = await UserModel.findByUsername(username)
    if (existingUsername) {
      return res.status(400).json({ error: 'USERNAME_ALREADY_EXISTS' })
    }
    
    // Get customer role ID (default role for new users)
    let customerRole = await RoleModel.findByName('CUSTOMER')
    if (!customerRole) {
      // If CUSTOMER role doesn't exist, create it or use default ID
      customerRole = await RoleModel.findByName('USER')
      if (!customerRole) {
        // Create default customer role
        const roleId = await RoleModel.create({ name: 'CUSTOMER' })
        customerRole = { role_id: roleId, name: 'CUSTOMER' }
      }
    }
    
    // Create user with plain password
    const userData: any = {
      username,
      email,
      password: password, // Store password as plain text
      role_id: customerRole.role_id
    }
    
    if (age !== undefined) userData.age = age
    if (gender !== undefined) userData.gender = gender
    
    const userId = await UserModel.create(userData)
    
    // Generate token
    const token = jwt.sign(
      { sub: userId, role: customerRole.name, email }, 
      JWT_SECRET, 
      { expiresIn: '2h' }
    )
    
    res.status(201).json({ 
      success: true, 
      user_id: userId,
      token,
      role: customerRole.name
    })
  } catch (error) {
    console.error('Error registering user:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string }
  if (!email || !password) return res.status(400).json({ error: 'MISSING_FIELDS' })
  try {
    const [rows] = await pool.query(
      `SELECT u.user_id, u.username, u.email, u.password, r.name as role
       FROM user u
       JOIN role r ON r.role_id = u.role_id
       WHERE u.email = ? LIMIT 1`,
      [email]
    )
    const list = rows as any[]
    if (!list || list.length === 0) return res.status(401).json({ error: 'INVALID_CREDENTIALS' })
    const user = list[0]
    
    // Compare password directly (no bcrypt)
    const isPasswordValid = password === user.password
    if (!isPasswordValid) return res.status(401).json({ error: 'INVALID_CREDENTIALS' })

    const token = jwt.sign({ sub: user.user_id, role: user.role, email: user.email }, JWT_SECRET, {
      expiresIn: '2h',
    })
    
    // Return user data along with token
    res.json({ 
      token, 
      user_id: user.user_id,
      username: user.username,
      email: user.email,
      role: user.role
    })
  } catch (e) {
    console.error('Login error:', e)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})

export default router


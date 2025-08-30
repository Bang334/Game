import { pool } from '../db'

export interface User {
  user_id: number
  username: string
  email: string
  password: string
  age: number | null
  balance: number
  role_id: number
}

export interface CreateUserData {
  username: string
  email: string
  password: string
  age?: number
  balance?: number
  role_id: number
}

export interface UpdateUserData {
  username?: string
  email?: string
  password?: string
  age?: number
  balance?: number
  role_id?: number
}

export interface UserWithRole extends User {
  role_name: string
}

export class UserModel {
  // Get all users
  static async findAll(): Promise<User[]> {
    const [rows] = await pool.execute('SELECT * FROM User ORDER BY user_id')
    return rows as User[]
  }

  // Get user by ID
  static async findById(userId: number): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM User WHERE user_id = ?',
      [userId]
    )
    const users = rows as User[]
    return users.length > 0 ? users[0]! : null
  }

  // Get user by email
  static async findByEmail(email: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM User WHERE email = ?',
      [email]
    )
    const users = rows as User[]
    return users.length > 0 ? users[0]! : null
  }

  // Get user by username
  static async findByUsername(username: string): Promise<User | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM User WHERE username = ?',
      [username]
    )
    const users = rows as User[]
    return users.length > 0 ? users[0]! : null
  }

  // Get user with role information
  static async findByIdWithRole(userId: number): Promise<UserWithRole | null> {
    const [rows] = await pool.execute(`
      SELECT u.*, r.name as role_name 
      FROM User u 
      JOIN Role r ON u.role_id = r.role_id 
      WHERE u.user_id = ?
    `, [userId])
    const users = rows as UserWithRole[]
    return users.length > 0 ? users[0]! : null
  }

  // Get all users with role information
  static async findAllWithRole(): Promise<UserWithRole[]> {
    const [rows] = await pool.execute(`
      SELECT u.*, r.name as role_name 
      FROM User u 
      JOIN Role r ON u.role_id = r.role_id 
      ORDER BY u.user_id
    `)
    return rows as UserWithRole[]
  }

  // Create new user
  static async create(data: CreateUserData): Promise<number> {
    const [result] = await pool.execute(
      'INSERT INTO User (username, email, password, age, balance, role_id) VALUES (?, ?, ?, ?, ?, ?)',
      [data.username, data.email, data.password, data.age || null, data.balance || 0, data.role_id]
    )
    return (result as any).insertId
  }

  // Update user
  static async update(userId: number, data: UpdateUserData): Promise<boolean> {
    const fields: string[] = []
    const values: any[] = []

    if (data.username !== undefined) {
      fields.push('username = ?')
      values.push(data.username)
    }
    if (data.email !== undefined) {
      fields.push('email = ?')
      values.push(data.email)
    }
    if (data.password !== undefined) {
      fields.push('password = ?')
      values.push(data.password)
    }
    if (data.age !== undefined) {
      fields.push('age = ?')
      values.push(data.age)
    }
    if (data.balance !== undefined) {
      fields.push('balance = ?')
      values.push(data.balance)
    }
    if (data.role_id !== undefined) {
      fields.push('role_id = ?')
      values.push(data.role_id)
    }

    if (fields.length === 0) return false

    values.push(userId)
    const [result] = await pool.execute(
      `UPDATE User SET ${fields.join(', ')} WHERE user_id = ?`,
      values
    )
    return (result as any).affectedRows > 0
  }

  // Update user balance
  static async updateBalance(userId: number, newBalance: number): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE User SET balance = ? WHERE user_id = ?',
      [newBalance, userId]
    )
    return (result as any).affectedRows > 0
  }

  // Delete user
  static async delete(userId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM User WHERE user_id = ?',
      [userId]
    )
    return (result as any).affectedRows > 0
  }

  // Check if email exists
  static async emailExists(email: string, excludeUserId?: number): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM User WHERE email = ?'
    let params: (string | number)[] = [email]
    
    if (excludeUserId) {
      query += ' AND user_id != ?'
      params.push(excludeUserId)
    }
    
    const [rows] = await pool.execute(query, params)
    return (rows as any)[0].count > 0
  }

  // Check if username exists
  static async usernameExists(username: string, excludeUserId?: number): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM User WHERE username = ?'
    let params = [username]
    
    if (excludeUserId) {
      query += ' AND user_id != ?'
      params.push(excludeUserId)
    }
    
    const [rows] = await pool.execute(query, params)
    return (rows as any)[0].count > 0
  }
}

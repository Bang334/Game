import { pool } from '../db'

export interface Role {
  role_id: number
  name: string
}

export interface CreateRoleData {
  name: string
}

export interface UpdateRoleData {
  name?: string
}

export class RoleModel {
  // Get all roles
  static async findAll(): Promise<Role[]> {
    const [rows] = await pool.execute('SELECT * FROM Role ORDER BY role_id')
    return rows as Role[]
  }

  // Get role by ID
  static async findById(roleId: number): Promise<Role | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Role WHERE role_id = ?',
      [roleId]
    )
    const roles = rows as Role[]
    return roles.length > 0 ? roles[0]! : null
  }

  // Get role by name
  static async findByName(name: string): Promise<Role | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Role WHERE name = ?',
      [name]
    )
    const roles = rows as Role[]
    return roles.length > 0 ? roles[0]! : null
  }

  // Create new role
  static async create(data: CreateRoleData): Promise<number> {
    const [result] = await pool.execute(
      'INSERT INTO Role (name) VALUES (?)',
      [data.name]
    )
    return (result as any).insertId
  }

  // Update role
  static async update(roleId: number, data: UpdateRoleData): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE Role SET name = ? WHERE role_id = ?',
      [data.name, roleId]
    )
    return (result as any).affectedRows > 0
  }

  // Delete role
  static async delete(roleId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Role WHERE role_id = ?',
      [roleId]
    )
    return (result as any).affectedRows > 0
  }
}

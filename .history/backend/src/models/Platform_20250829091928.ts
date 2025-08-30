import { pool } from '../db'

export interface Platform {
  platform_id: number
  name: string
}

export interface CreatePlatformData {
  name: string
}

export interface UpdatePlatformData {
  name?: string
}

export class PlatformModel {
  // Get all platforms
  static async findAll(): Promise<Platform[]> {
    const [rows] = await pool.execute('SELECT * FROM Platform ORDER BY name')
    return rows as Platform[]
  }

  // Get platform by ID
  static async findById(platformId: number): Promise<Platform | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Platform WHERE platform_id = ?',
      [platformId]
    )
    const platforms = rows as Platform[]
    return platforms.length > 0 ? platforms[0]! : null
  }

  // Get platform by name
  static async findByName(name: string): Promise<Platform | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Platform WHERE name = ?',
      [name]
    )
    const platforms = rows as Platform[]
    return platforms.length > 0 ? platforms[0] : null
  }

  // Search platforms by name (partial match)
  static async searchByName(searchTerm: string): Promise<Platform[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM Platform WHERE name LIKE ? ORDER BY name',
      [`%${searchTerm}%`]
    )
    return rows as Platform[]
  }

  // Create new platform
  static async create(data: CreatePlatformData): Promise<number> {
    const [result] = await pool.execute(
      'INSERT INTO Platform (name) VALUES (?)',
      [data.name]
    )
    return (result as any).insertId
  }

  // Update platform
  static async update(platformId: number, data: UpdatePlatformData): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE Platform SET name = ? WHERE platform_id = ?',
      [data.name, platformId]
    )
    return (result as any).affectedRows > 0
  }

  // Delete platform
  static async delete(platformId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Platform WHERE platform_id = ?',
      [platformId]
    )
    return (result as any).affectedRows > 0
  }

  // Get platform with game count
  static async findWithGameCount(): Promise<(Platform & { game_count: number })[]> {
    const [rows] = await pool.execute(`
      SELECT p.*, COUNT(gp.game_id) as game_count
      FROM Platform p
      LEFT JOIN Game_Platform gp ON p.platform_id = gp.platform_id
      GROUP BY p.platform_id
      ORDER BY p.name
    `)
    return rows as (Platform & { game_count: number })[]
  }
}

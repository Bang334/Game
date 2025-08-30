import { pool } from '../db'

export interface Publisher {
  publisher_id: number
  name: string
}

export interface CreatePublisherData {
  name: string
}

export interface UpdatePublisherData {
  name?: string
}

export class PublisherModel {
  // Get all publishers
  static async findAll(): Promise<Publisher[]> {
    const [rows] = await pool.execute('SELECT * FROM Publisher ORDER BY name')
    return rows as Publisher[]
  }

  // Get publisher by ID
  static async findById(publisherId: number): Promise<Publisher | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Publisher WHERE publisher_id = ?',
      [publisherId]
    )
    const publishers = rows as Publisher[]
    return publishers.length > 0 ? publishers[0]! : null
  }

  // Get publisher by name
  static async findByName(name: string): Promise<Publisher | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Publisher WHERE name = ?',
      [name]
    )
    const publishers = rows as Publisher[]
    return publishers.length > 0 ? publishers[0] : null
  }

  // Search publishers by name (partial match)
  static async searchByName(searchTerm: string): Promise<Publisher[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM Publisher WHERE name LIKE ? ORDER BY name',
      [`%${searchTerm}%`]
    )
    return rows as Publisher[]
  }

  // Create new publisher
  static async create(data: CreatePublisherData): Promise<number> {
    const [result] = await pool.execute(
      'INSERT INTO Publisher (name) VALUES (?)',
      [data.name]
    )
    return (result as any).insertId
  }

  // Update publisher
  static async update(publisherId: number, data: UpdatePublisherData): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE Publisher SET name = ? WHERE publisher_id = ?',
      [data.name, publisherId]
    )
    return (result as any).affectedRows > 0
  }

  // Delete publisher
  static async delete(publisherId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Publisher WHERE publisher_id = ?',
      [publisherId]
    )
    return (result as any).affectedRows > 0
  }

  // Get publisher with game count
  static async findWithGameCount(): Promise<(Publisher & { game_count: number })[]> {
    const [rows] = await pool.execute(`
      SELECT p.*, COUNT(g.game_id) as game_count
      FROM Publisher p
      LEFT JOIN Game g ON p.publisher_id = g.publisher_id
      GROUP BY p.publisher_id
      ORDER BY p.name
    `)
    return rows as (Publisher & { game_count: number })[]
  }
}

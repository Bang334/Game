import { pool } from '../db'

export interface Language {
  language_id: number
  name: string
}

export interface CreateLanguageData {
  name: string
}

export interface UpdateLanguageData {
  name?: string
}

export class LanguageModel {
  // Get all languages
  static async findAll(): Promise<Language[]> {
    const [rows] = await pool.execute('SELECT * FROM Language ORDER BY name')
    return rows as Language[]
  }

  // Get language by ID
  static async findById(languageId: number): Promise<Language | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Language WHERE language_id = ?',
      [languageId]
    )
    const languages = rows as Language[]
    return languages.length > 0 ? languages[0]! : null
  }

  // Get language by name
  static async findByName(name: string): Promise<Language | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Language WHERE name = ?',
      [name]
    )
    const languages = rows as Language[]
    return languages.length > 0 ? languages[0]! : null
  }

  // Search languages by name (partial match)
  static async searchByName(searchTerm: string): Promise<Language[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM Language WHERE name LIKE ? ORDER BY name',
      [`%${searchTerm}%`]
    )
    return rows as Language[]
  }

  // Create new language
  static async create(data: CreateLanguageData): Promise<number> {
    const [result] = await pool.execute(
      'INSERT INTO Language (name) VALUES (?)',
      [data.name]
    )
    return (result as any).insertId
  }

  // Update language
  static async update(languageId: number, data: UpdateLanguageData): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE Language SET name = ? WHERE language_id = ?',
      [data.name, languageId]
    )
    return (result as any).affectedRows > 0
  }

  // Delete language
  static async delete(languageId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Language WHERE language_id = ?',
      [languageId]
    )
    return (result as any).affectedRows > 0
  }

  // Get language with game count
  static async findWithGameCount(): Promise<(Language & { game_count: number })[]> {
    const [rows] = await pool.execute(`
      SELECT l.*, COUNT(gl.game_id) as game_count
      FROM Language l
      LEFT JOIN Game_Language gl ON l.language_id = gl.language_id
      GROUP BY l.language_id
      ORDER BY l.name
    `)
    return rows as (Language & { game_count: number })[]
  }
}

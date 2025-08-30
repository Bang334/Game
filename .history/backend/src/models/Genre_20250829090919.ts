import { pool } from '../db'

export interface Genre {
  genre_id: number
  name: string
}

export interface CreateGenreData {
  name: string
}

export interface UpdateGenreData {
  name?: string
}

export class GenreModel {
  // Get all genres
  static async findAll(): Promise<Genre[]> {
    const [rows] = await pool.execute('SELECT * FROM Genre ORDER BY name')
    return rows as Genre[]
  }

  // Get genre by ID
  static async findById(genreId: number): Promise<Genre | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Genre WHERE genre_id = ?',
      [genreId]
    )
    const genres = rows as Genre[]
    return genres.length > 0 ? genres[0] : null
  }

  // Get genre by name
  static async findByName(name: string): Promise<Genre | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Genre WHERE name = ?',
      [name]
    )
    const genres = rows as Genre[]
    return genres.length > 0 ? genres[0] : null
  }

  // Search genres by name (partial match)
  static async searchByName(searchTerm: string): Promise<Genre[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM Genre WHERE name LIKE ? ORDER BY name',
      [`%${searchTerm}%`]
    )
    return rows as Genre[]
  }

  // Create new genre
  static async create(data: CreateGenreData): Promise<number> {
    const [result] = await pool.execute(
      'INSERT INTO Genre (name) VALUES (?)',
      [data.name]
    )
    return (result as any).insertId
  }

  // Update genre
  static async update(genreId: number, data: UpdateGenreData): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE Genre SET name = ? WHERE genre_id = ?',
      [data.name, genreId]
    )
    return (result as any).affectedRows > 0
  }

  // Delete genre
  static async delete(genreId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Genre WHERE genre_id = ?',
      [genreId]
    )
    return (result as any).affectedRows > 0
  }

  // Get genre with game count
  static async findWithGameCount(): Promise<(Genre & { game_count: number })[]> {
    const [rows] = await pool.execute(`
      SELECT g.*, COUNT(gg.game_id) as game_count
      FROM Genre g
      LEFT JOIN Game_Genre gg ON g.genre_id = gg.genre_id
      GROUP BY g.genre_id
      ORDER BY g.name
    `)
    return rows as (Genre & { game_count: number })[]
  }
}

import { pool } from '../db'

export interface GameGenre {
  game_id: number
  genre_id: number
}

export class GameGenreModel {
  // Get all genres for a specific game
  static async findByGameId(gameId: number): Promise<number[]> {
    const [rows] = await pool.execute(
      'SELECT genre_id FROM Game_Genre WHERE game_id = ?',
      [gameId]
    )
    return (rows as any[]).map((row: any) => row.genre_id)
  }

  // Get all games for a specific genre
  static async findByGenreId(genreId: number): Promise<number[]> {
    const [rows] = await pool.execute(
      'SELECT game_id FROM Game_Genre WHERE genre_id = ?',
      [genreId]
    )
    return (rows as any[]).map((row: any) => row.game_id)
  }

  // Add genre to game
  static async addGenreToGame(gameId: number, genreId: number): Promise<boolean> {
    try {
      await pool.execute(
        'INSERT INTO Game_Genre (game_id, genre_id) VALUES (?, ?)',
        [gameId, genreId]
      )
      return true
    } catch (error) {
      return false
    }
  }

  // Remove genre from game
  static async removeGenreFromGame(gameId: number, genreId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Game_Genre WHERE game_id = ? AND genre_id = ?',
      [gameId, genreId]
    )
    return (result as any).affectedRows > 0
  }

  // Set genres for a game (replace all existing genres)
  static async setGenresForGame(gameId: number, genreIds: number[]): Promise<boolean> {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Remove all existing genres for this game
      await connection.execute(
        'DELETE FROM Game_Genre WHERE game_id = ?',
        [gameId]
      )

      // Add new genres
      if (genreIds.length > 0) {
        const values = genreIds.map(() => '(?, ?)').join(', ')
        const params = genreIds.flatMap(genreId => [gameId, genreId])
        await connection.execute(
          `INSERT INTO Game_Genre (game_id, genre_id) VALUES ${values}`,
          params
        )
      }

      await connection.commit()
      return true
    } catch (error) {
      await connection.rollback()
      return false
    } finally {
      connection.release()
    }
  }

  // Check if game has specific genre
  static async gameHasGenre(gameId: number, genreId: number): Promise<boolean> {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM Game_Genre WHERE game_id = ? AND genre_id = ?',
      [gameId, genreId]
    )
    return (rows as any)[0].count > 0
  }

  // Get all game-genre relationships
  static async findAll(): Promise<GameGenre[]> {
    const [rows] = await pool.execute('SELECT * FROM Game_Genre')
    return rows as GameGenre[]
  }
}

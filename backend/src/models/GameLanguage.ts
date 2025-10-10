import { pool } from '../db'

export interface GameLanguage {
  game_id: number
  language_id: number
}

export class GameLanguageModel {
  // Get all languages for a specific game
  static async findByGameId(gameId: number): Promise<number[]> {
    const [rows] = await pool.execute(
      'SELECT language_id FROM Game_Language WHERE game_id = ?',
      [gameId]
    )
    return (rows as any[]).map((row: any) => row.language_id)
  }

  // Get all games for a specific language
  static async findByLanguageId(languageId: number): Promise<number[]> {
    const [rows] = await pool.execute(
      'SELECT game_id FROM Game_Language WHERE language_id = ?',
      [languageId]
    )
    return (rows as any[]).map((row: any) => row.game_id)
  }

  // Add language to game
  static async addLanguageToGame(gameId: number, languageId: number): Promise<boolean> {
    try {
      await pool.execute(
        'INSERT INTO Game_Language (game_id, language_id) VALUES (?, ?)',
        [gameId, languageId]
      )
      return true
    } catch (error) {
      return false
    }
  }

  // Remove language from game
  static async removeLanguageFromGame(gameId: number, languageId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Game_Language WHERE game_id = ? AND language_id = ?',
      [gameId, languageId]
    )
    return (result as any).affectedRows > 0
  }

  // Set languages for a game (replace all existing languages)
  static async setLanguagesForGame(gameId: number, languageIds: number[]): Promise<boolean> {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Remove all existing languages for this game
      await connection.execute(
        'DELETE FROM Game_Language WHERE game_id = ?',
        [gameId]
      )

      // Add new languages
      if (languageIds.length > 0) {
        const values = languageIds.map(() => '(?, ?)').join(', ')
        const params = languageIds.flatMap(languageId => [gameId, languageId])
        await connection.execute(
          `INSERT INTO Game_Language (game_id, language_id) VALUES ${values}`,
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

  // Check if game has specific language
  static async gameHasLanguage(gameId: number, languageId: number): Promise<boolean> {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM Game_Language WHERE game_id = ? AND language_id = ?',
      [gameId, languageId]
    )
    return (rows as any)[0].count > 0
  }

  // Get all game-language relationships
  static async findAll(): Promise<GameLanguage[]> {
    const [rows] = await pool.execute('SELECT * FROM Game_Language')
    return rows as GameLanguage[]
  }
}

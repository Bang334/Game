import { pool } from '../db'

export interface GamePlatform {
  game_id: number
  platform_id: number
}

export class GamePlatformModel {
  // Get all platforms for a specific game
  static async findByGameId(gameId: number): Promise<number[]> {
    const [rows] = await pool.execute(
      'SELECT platform_id FROM Game_Platform WHERE game_id = ?',
      [gameId]
    )
    return (rows as any[]).map((row: any) => row.platform_id)
  }

  // Get all games for a specific platform
  static async findByPlatformId(platformId: number): Promise<number[]> {
    const [rows] = await pool.execute(
      'SELECT game_id FROM Game_Platform WHERE platform_id = ?',
      [platformId]
    )
    return (rows as any[]).map((row: any) => row.game_id)
  }

  // Add platform to game
  static async addPlatformToGame(gameId: number, platformId: number): Promise<boolean> {
    try {
      await pool.execute(
        'INSERT INTO Game_Platform (game_id, platform_id) VALUES (?, ?)',
        [gameId, platformId]
      )
      return true
    } catch (error) {
      return false
    }
  }

  // Remove platform from game
  static async removePlatformFromGame(gameId: number, platformId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Game_Platform WHERE game_id = ? AND platform_id = ?',
      [gameId, platformId]
    )
    return (result as any).affectedRows > 0
  }

  // Set platforms for a game (replace all existing platforms)
  static async setPlatformsForGame(gameId: number, platformIds: number[]): Promise<boolean> {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Remove all existing platforms for this game
      await connection.execute(
        'DELETE FROM Game_Platform WHERE game_id = ?',
        [gameId]
      )

      // Add new platforms
      if (platformIds.length > 0) {
        const values = platformIds.map(() => '(?, ?)').join(', ')
        const params = platformIds.flatMap(platformId => [gameId, platformId])
        await connection.execute(
          `INSERT INTO Game_Platform (game_id, platform_id) VALUES ${values}`,
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

  // Check if game has specific platform
  static async gameHasPlatform(gameId: number, platformId: number): Promise<boolean> {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM Game_Platform WHERE game_id = ? AND platform_id = ?',
      [gameId, platformId]
    )
    return (rows as any)[0].count > 0
  }

  // Get all game-platform relationships
  static async findAll(): Promise<GamePlatform[]> {
    const [rows] = await pool.execute('SELECT * FROM Game_Platform')
    return rows as GamePlatform[]
  }
}

import { pool } from '../db'

export interface Specification {
  spec_id: number
  game_id: number
  type: 'MIN' | 'REC'
  cpu: string | null
  ram: string | null
  gpu: string | null
}

export interface CreateSpecificationData {
  game_id: number
  type: 'MIN' | 'REC'
  cpu?: string
  ram?: string
  gpu?: string
}

export interface UpdateSpecificationData {
  cpu?: string
  ram?: string
  gpu?: string
}

export class SpecificationModel {
  // Get all specifications
  static async findAll(): Promise<Specification[]> {
    const [rows] = await pool.execute('SELECT * FROM Specification ORDER BY game_id, type')
    return rows as Specification[]
  }

  // Get specification by ID
  static async findById(specId: number): Promise<Specification | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Specification WHERE spec_id = ?',
      [specId]
    )
    const specs = rows as Specification[]
    return specs.length > 0 ? specs[0]! : null
  }

  // Get specifications for a specific game
  static async findByGameId(gameId: number): Promise<Specification[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM Specification WHERE game_id = ? ORDER BY type',
      [gameId]
    )
    return rows as Specification[]
  }

  // Get minimum specifications for a game
  static async findMinSpecsByGameId(gameId: number): Promise<Specification | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Specification WHERE game_id = ? AND type = "MIN"',
      [gameId]
    )
    const specs = rows as Specification[]
    return specs.length > 0 ? specs[0]! : null
  }

  // Get recommended specifications for a game
  static async findRecSpecsByGameId(gameId: number): Promise<Specification | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Specification WHERE game_id = ? AND type = "REC"',
      [gameId]
    )
    const specs = rows as Specification[]
    return specs.length > 0 ? specs[0]! : null
  }

  // Create new specification
  static async create(data: CreateSpecificationData): Promise<number> {
    const [result] = await pool.execute(`
      INSERT INTO Specification (game_id, type, cpu, ram, gpu)
      VALUES (?, ?, ?, ?, ?)
    `, [
      data.game_id,
      data.type,
      data.cpu || null,
      data.ram || null,
      data.gpu || null
    ])
    return (result as any).insertId
  }

  // Update specification
  static async update(specId: number, data: UpdateSpecificationData): Promise<boolean> {
    const fields: string[] = []
    const values: any[] = []

    if (data.cpu !== undefined) {
      fields.push('cpu = ?')
      values.push(data.cpu)
    }
    if (data.ram !== undefined) {
      fields.push('ram = ?')
      values.push(data.ram)
    }
    if (data.gpu !== undefined) {
      fields.push('gpu = ?')
      values.push(data.gpu)
    }

    if (fields.length === 0) return false

    values.push(specId)
    const [result] = await pool.execute(
      `UPDATE Specification SET ${fields.join(', ')} WHERE spec_id = ?`,
      values
    )
    return (result as any).affectedRows > 0
  }

  // Delete specification
  static async delete(specId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Specification WHERE spec_id = ?',
      [specId]
    )
    return (result as any).affectedRows > 0
  }

  // Delete all specifications for a game
  static async deleteByGameId(gameId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Specification WHERE game_id = ?',
      [gameId]
    )
    return (result as any).affectedRows > 0
  }

  // Upsert specifications for a game (create or update)
  static async upsertSpecsForGame(
    gameId: number, 
    minSpecs: Omit<CreateSpecificationData, 'game_id' | 'type'> | null,
    recSpecs: Omit<CreateSpecificationData, 'game_id' | 'type'> | null
  ): Promise<boolean> {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()

      // Delete existing specifications for this game
      await connection.execute(
        'DELETE FROM Specification WHERE game_id = ?',
        [gameId]
      )

      // Insert minimum specifications if provided
      if (minSpecs) {
        await connection.execute(`
          INSERT INTO Specification (game_id, type, cpu, ram, gpu)
          VALUES (?, 'MIN', ?, ?, ?)
        `, [
          gameId,
          minSpecs.cpu || null,
          minSpecs.ram || null,
          minSpecs.gpu || null
        ])
      }

      // Insert recommended specifications if provided
      if (recSpecs) {
        await connection.execute(`
          INSERT INTO Specification (game_id, type, cpu, ram, gpu)
          VALUES (?, 'REC', ?, ?, ?)
        `, [
          gameId,
          recSpecs.cpu || null,
          recSpecs.ram || null,
          recSpecs.gpu || null
        ])
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
}

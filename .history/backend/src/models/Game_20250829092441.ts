import { pool } from '../db'

export interface Game {
  game_id: number
  name: string
  release_year: number | null
  publisher_id: number
  mode: string | null
  price: number
  multiplayer: boolean
  capacity: number | null
  age_rating: string | null
  average_rating: number
  total_sales: number
  total_revenue: number
}

export interface CreateGameData {
  name: string
  release_year?: number
  publisher_id: number
  mode?: string
  price: number
  multiplayer?: boolean
  capacity?: number
  age_rating?: string
  average_rating?: number
  total_sales?: number
  total_revenue?: number
}

export interface UpdateGameData {
  name?: string
  release_year?: number
  publisher_id?: number
  mode?: string
  price?: number
  multiplayer?: boolean
  capacity?: number
  age_rating?: string
  average_rating?: number
  total_sales?: number
  total_revenue?: number
}

export interface GameWithPublisher extends Game {
  publisher_name: string
}

export interface GameWithDetails extends GameWithPublisher {
  genres: string[]
  platforms: string[]
  min_specs?: {
    cpu: string | null
    ram: string | null
    gpu: string | null
    storage: string | null
  } | null
  rec_specs?: {
    cpu: string | null
    ram: string | null
    gpu: string | null
    storage: string | null
  } | null
}

export class GameModel {
  // Get all games
  static async findAll(): Promise<Game[]> {
    const [rows] = await pool.execute('SELECT * FROM Game ORDER BY name')
    return rows as Game[]
  }

  // Get game by ID
  static async findById(gameId: number): Promise<Game | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Game WHERE game_id = ?',
      [gameId]
    )
    const games = rows as Game[]
    return games.length > 0 ? games[0]! : null
  }

  // Get game by name
  static async findByName(name: string): Promise<Game | null> {
    const [rows] = await pool.execute(
      'SELECT * FROM Game WHERE name = ?',
      [name]
    )
    const games = rows as Game[]
    return games.length > 0 ? games[0]! : null
  }

  // Search games by name (partial match)
  static async searchByName(searchTerm: string): Promise<Game[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM Game WHERE name LIKE ? ORDER BY name',
      [`%${searchTerm}%`]
    )
    return rows as Game[]
  }

  // Get games by publisher
  static async findByPublisher(publisherId: number): Promise<Game[]> {
    const [rows] = await pool.execute(
      'SELECT * FROM Game WHERE publisher_id = ? ORDER BY name',
      [publisherId]
    )
    return rows as Game[]
  }

  // Get games by genre
  static async findByGenre(genreId: number): Promise<Game[]> {
    const [rows] = await pool.execute(`
      SELECT g.* FROM Game g
      JOIN Game_Genre gg ON g.game_id = gg.game_id
      WHERE gg.genre_id = ?
      ORDER BY g.name
    `, [genreId])
    return rows as Game[]
  }

  // Get games by platform
  static async findByPlatform(platformId: number): Promise<Game[]> {
    const [rows] = await pool.execute(`
      SELECT g.* FROM Game g
      JOIN Game_Platform gp ON g.game_id = gp.game_id
      WHERE gp.platform_id = ?
      ORDER BY g.name
    `, [platformId])
    return rows as Game[]
  }

  // Get games with publisher information
  static async findAllWithPublisher(): Promise<GameWithPublisher[]> {
    const [rows] = await pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      ORDER BY g.name
    `)
    return rows as GameWithPublisher[]
  }

  // Get game with full details
  static async findByIdWithDetails(gameId: number): Promise<GameWithDetails | null> {
    // Get game with publisher
    const [gameRows] = await pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE g.game_id = ?
    `, [gameId])
    
    if ((gameRows as any[]).length === 0) return null
    
    const game = (gameRows as any[])[0] as GameWithPublisher

    // Get genres
    const [genreRows] = await pool.execute(`
      SELECT gen.name FROM Genre gen
      JOIN Game_Genre gg ON gen.genre_id = gg.genre_id
      WHERE gg.game_id = ?
    `, [gameId])
    const genres = (genreRows as any[]).map((row: any) => row.name)

    // Get platforms
    const [platformRows] = await pool.execute(`
      SELECT p.name FROM Platform p
      JOIN Game_Platform gp ON p.platform_id = gp.platform_id
      WHERE gp.game_id = ?
    `, [gameId])
    const platforms = (platformRows as any[]).map((row: any) => row.name)

    // Get specifications
    const [specRows] = await pool.execute(`
      SELECT type, cpu, ram, gpu, storage FROM Specification
      WHERE game_id = ?
    `, [gameId])
    const specs = specRows as any[]

    const minSpecs = specs.find((spec: any) => spec.type === 'MIN')
    const recSpecs = specs.find((spec: any) => spec.type === 'REC')

    return {
      ...game,
      genres,
      platforms,
      min_specs: minSpecs ? {
        cpu: minSpecs.cpu,
        ram: minSpecs.ram,
        gpu: minSpecs.gpu,
        storage: minSpecs.storage
      } : null,
      rec_specs: recSpecs ? {
        cpu: recSpecs.cpu,
        ram: recSpecs.ram,
        gpu: recSpecs.gpu,
        storage: recSpecs.storage
      } : null
    }
  }

  // Get top selling games
  static async findTopSelling(limit: number = 10): Promise<GameWithPublisher[]> {
    const [rows] = await pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      ORDER BY g.total_sales DESC
      LIMIT ?
    `, [limit])
    return rows as GameWithPublisher[]
  }

  // Get top rated games
  static async findTopRated(limit: number = 10): Promise<GameWithPublisher[]> {
    const [rows] = await pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE g.average_rating > 0
      ORDER BY g.average_rating DESC
      LIMIT ?
    `, [limit])
    return rows as GameWithPublisher[]
  }

  // Get games by price range
  static async findByPriceRange(minPrice: number, maxPrice: number): Promise<GameWithPublisher[]> {
    const [rows] = await pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE g.price BETWEEN ? AND ?
      ORDER BY g.price
    `, [minPrice, maxPrice])
    return rows as GameWithPublisher[]
  }

  // Create new game
  static async create(data: CreateGameData): Promise<number> {
    const [result] = await pool.execute(`
      INSERT INTO Game (name, release_year, publisher_id, mode, price, multiplayer, capacity, age_rating, average_rating, total_sales, total_revenue)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.name,
      data.release_year || null,
      data.publisher_id,
      data.mode || null,
      data.price,
      data.multiplayer || false,
      data.capacity || null,
      data.age_rating || null,
      data.average_rating || 0,
      data.total_sales || 0,
      data.total_revenue || 0
    ])
    return (result as any).insertId
  }

  // Update game
  static async update(gameId: number, data: UpdateGameData): Promise<boolean> {
    const fields: string[] = []
    const values: any[] = []

    if (data.name !== undefined) {
      fields.push('name = ?')
      values.push(data.name)
    }
    if (data.release_year !== undefined) {
      fields.push('release_year = ?')
      values.push(data.release_year)
    }
    if (data.publisher_id !== undefined) {
      fields.push('publisher_id = ?')
      values.push(data.publisher_id)
    }
    if (data.mode !== undefined) {
      fields.push('mode = ?')
      values.push(data.mode)
    }
    if (data.price !== undefined) {
      fields.push('price = ?')
      values.push(data.price)
    }
    if (data.multiplayer !== undefined) {
      fields.push('multiplayer = ?')
      values.push(data.multiplayer)
    }
    if (data.capacity !== undefined) {
      fields.push('capacity = ?')
      values.push(data.capacity)
    }
    if (data.age_rating !== undefined) {
      fields.push('age_rating = ?')
      values.push(data.age_rating)
    }
    if (data.average_rating !== undefined) {
      fields.push('average_rating = ?')
      values.push(data.average_rating)
    }
    if (data.total_sales !== undefined) {
      fields.push('total_sales = ?')
      values.push(data.total_sales)
    }
    if (data.total_revenue !== undefined) {
      fields.push('total_revenue = ?')
      values.push(data.total_revenue)
    }

    if (fields.length === 0) return false

    values.push(gameId)
    const [result] = await pool.execute(
      `UPDATE Game SET ${fields.join(', ')} WHERE game_id = ?`,
      values
    )
    return (result as any).affectedRows > 0
  }

  // Update game rating
  static async updateRating(gameId: number, newRating: number): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE Game SET average_rating = ? WHERE game_id = ?',
      [newRating, gameId]
    )
    return (result as any).affectedRows > 0
  }

  // Update game sales
  static async updateSales(gameId: number, newSales: number, newRevenue: number): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE Game SET total_sales = ?, total_revenue = ? WHERE game_id = ?',
      [newSales, newRevenue, gameId]
    )
    return (result as any).affectedRows > 0
  }

  // Delete game
  static async delete(gameId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'DELETE FROM Game WHERE game_id = ?',
      [gameId]
    )
    return (result as any).affectedRows > 0
  }
}

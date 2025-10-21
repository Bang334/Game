import { pool } from '../db'

export interface Game {
  game_id: number
  name: string
  description: string | null
  release_date: Date | null
  publisher_id: number
  mode: string | null
  price: number
  multiplayer: boolean
  capacity: number | null
  age_rating: string | null
  average_rating: number
  downloads: number
  image: string | null
  link_download: string | null
}

export interface CreateGameData {
  name: string
  description?: string
  release_date?: Date
  publisher_id: number
  mode?: string
  price: number
  multiplayer?: boolean
  capacity?: number
  age_rating?: string
  average_rating?: number
  downloads?: number
  image?: string
  link_download?: string
}

export interface UpdateGameData {
  name?: string
  description?: string
  release_date?: Date
  publisher_id?: number
  mode?: string
  price?: number
  multiplayer?: boolean
  capacity?: number
  age_rating?: string
  average_rating?: number
  downloads?: number
  image?: string
  link_download?: string
}

export interface GameWithPublisher extends Game {
  publisher_name: string
}

export interface GameWithDetails extends GameWithPublisher {
  genres: string[]
  platforms: string[]
  languages: string[]
  min_specs?: {
    cpu: string | null
    ram: string | null
    gpu: string | null
  } | null
  rec_specs?: {
    cpu: string | null
    ram: string | null
    gpu: string | null
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

  // Get all games with publisher and genres
  static async findAllWithPublisherAndGenres(): Promise<GameWithDetails[]> {
    const [rows] = await pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      ORDER BY g.name
    `)
    
    const games = rows as GameWithPublisher[]
    const gamesWithGenres: GameWithDetails[] = []
    
    for (const game of games) {
      // Get genres for each game
      const [genreRows] = await pool.execute(`
        SELECT gen.name FROM Genre gen
        JOIN Game_Genre gg ON gen.genre_id = gg.genre_id
        WHERE gg.game_id = ?
      `, [game.game_id])
      const genres = (genreRows as any[]).map((row: any) => row.name)

      // Get platforms for each game
      const [platformRows] = await pool.execute(`
        SELECT p.name FROM Platform p
        JOIN Game_Platform gp ON p.platform_id = gp.platform_id
        WHERE gp.game_id = ?
      `, [game.game_id])
      const platforms = (platformRows as any[]).map((row: any) => row.name)

      // Get languages for each game
      const [languageRows] = await pool.execute(`
        SELECT l.name FROM Language l
        JOIN Game_Language gl ON l.language_id = gl.language_id
        WHERE gl.game_id = ?
      `, [game.game_id])
      const languages = (languageRows as any[]).map((row: any) => row.name)

      // Get specifications
      const [specRows] = await pool.execute(`
        SELECT type, cpu, ram, gpu FROM Specification
        WHERE game_id = ?
      `, [game.game_id])
      const specs = specRows as any[]

      const minSpecs = specs.find((spec: any) => spec.type === 'MIN')
      const recSpecs = specs.find((spec: any) => spec.type === 'REC')

      gamesWithGenres.push({
        ...game,
        genres,
        platforms,
        languages,
        min_specs: minSpecs ? {
          cpu: minSpecs.cpu,
          ram: minSpecs.ram,
          gpu: minSpecs.gpu
        } : null,
        rec_specs: recSpecs ? {
          cpu: recSpecs.cpu,
          ram: recSpecs.ram,
          gpu: recSpecs.gpu
        } : null
      })
    }
    
    return gamesWithGenres
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

    // Get languages
    const [languageRows] = await pool.execute(`
      SELECT l.name FROM Language l
      JOIN Game_Language gl ON l.language_id = gl.language_id
      WHERE gl.game_id = ?
    `, [gameId])
    const languages = (languageRows as any[]).map((row: any) => row.name)

    // Get specifications
    const [specRows] = await pool.execute(`
      SELECT type, cpu, ram, gpu FROM Specification
      WHERE game_id = ?
    `, [gameId])
    const specs = specRows as any[]

    const minSpecs = specs.find((spec: any) => spec.type === 'MIN')
    const recSpecs = specs.find((spec: any) => spec.type === 'REC')

    return {
      ...game,
      genres,
      platforms,
      languages,
      min_specs: minSpecs ? {
        cpu: minSpecs.cpu,
        ram: minSpecs.ram,
        gpu: minSpecs.gpu
      } : null,
      rec_specs: recSpecs ? {
        cpu: recSpecs.cpu,
        ram: recSpecs.ram,
        gpu: recSpecs.gpu
      } : null
    }
  }

  // Get top downloaded games
  static async findTopDownloaded(limit: number = 10): Promise<GameWithPublisher[]> {
    // Ensure limit is a safe integer to prevent SQL injection
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)))
    const [rows] = await pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      ORDER BY g.downloads DESC
      LIMIT ${safeLimit}
    `)
    return rows as GameWithPublisher[]
  }

  // Get top rated games
  static async findTopRated(limit: number = 10): Promise<GameWithPublisher[]> {
    // Ensure limit is a safe integer to prevent SQL injection
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)))
    const [rows] = await pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE g.average_rating > 0
      ORDER BY g.average_rating DESC
      LIMIT ${safeLimit}
    `)
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

  // Get similar games based on a game
  static async findSimilarGames(gameId: number, limit: number = 8): Promise<GameWithDetails[]> {
    // First, get the target game's details
    const targetGame = await this.findByIdWithDetails(gameId)
    if (!targetGame) return []

    const safeLimit = Math.max(1, Math.min(20, Math.floor(limit)))
    
    // Find games with similar genres, similar price range, and good ratings
    const priceMin = Math.max(0, targetGame.price * 0.5) // 50% lower
    const priceMax = targetGame.price * 1.5 // 50% higher
    
    const [rows] = await pool.execute(`
      SELECT DISTINCT g.*, p.name as publisher_name,
        (SELECT COUNT(*) FROM Game_Genre gg1 
         JOIN Game_Genre gg2 ON gg1.genre_id = gg2.genre_id
         WHERE gg1.game_id = g.game_id AND gg2.game_id = ?) as genre_match_count
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE g.game_id != ?
        AND g.price BETWEEN ? AND ?
        AND EXISTS (
          SELECT 1 FROM Game_Genre gg1
          JOIN Game_Genre gg2 ON gg1.genre_id = gg2.genre_id
          WHERE gg1.game_id = g.game_id AND gg2.game_id = ?
        )
      ORDER BY genre_match_count DESC, g.average_rating DESC, g.downloads DESC
      LIMIT ${safeLimit}
    `, [gameId, gameId, priceMin, priceMax, gameId])

    const games = rows as GameWithPublisher[]
    const gamesWithDetails: GameWithDetails[] = []

    for (const game of games) {
      // Get genres
      const [genreRows] = await pool.execute(`
        SELECT gen.name FROM Genre gen
        JOIN Game_Genre gg ON gen.genre_id = gg.genre_id
        WHERE gg.game_id = ?
      `, [game.game_id])
      const genres = (genreRows as any[]).map((row: any) => row.name)

      // Get platforms
      const [platformRows] = await pool.execute(`
        SELECT p.name FROM Platform p
        JOIN Game_Platform gp ON p.platform_id = gp.platform_id
        WHERE gp.game_id = ?
      `, [game.game_id])
      const platforms = (platformRows as any[]).map((row: any) => row.name)

      // Get languages
      const [languageRows] = await pool.execute(`
        SELECT l.name FROM Language l
        JOIN Game_Language gl ON l.language_id = gl.language_id
        WHERE gl.game_id = ?
      `, [game.game_id])
      const languages = (languageRows as any[]).map((row: any) => row.name)

      gamesWithDetails.push({
        ...game,
        genres,
        platforms,
        languages,
        min_specs: null,
        rec_specs: null
      })
    }

    return gamesWithDetails
  }

  // Create new game
  static async create(data: CreateGameData): Promise<number> {
    const [result] = await pool.execute(`
      INSERT INTO Game (name, description, release_date, publisher_id, mode, price, multiplayer, capacity, age_rating, average_rating, downloads, image, link_download)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      data.name,
      data.description || null,
      data.release_date || null,
      data.publisher_id,
      data.mode || null,
      data.price,
      data.multiplayer || false,
      data.capacity || null,
      data.age_rating || null,
      data.average_rating || 0,
      data.downloads || 0,
      data.image || null,
      data.link_download || null
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
    if (data.description !== undefined) {
      fields.push('description = ?')
      values.push(data.description)
    }
    if (data.release_date !== undefined) {
      fields.push('release_date = ?')
      values.push(data.release_date)
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
    if (data.downloads !== undefined) {
      fields.push('downloads = ?')
      values.push(data.downloads)
    }
    if (data.image !== undefined) {
      fields.push('image = ?')
      values.push(data.image)
    }
    if (data.link_download !== undefined) {
      fields.push('link_download = ?')
      values.push(data.link_download)
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

  // Update game downloads
  static async updateDownloads(gameId: number, newDownloads: number): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE Game SET downloads = ? WHERE game_id = ?',
      [newDownloads, gameId]
    )
    return (result as any).affectedRows > 0
  }
  
  // Increment game downloads
  static async incrementDownloads(gameId: number): Promise<boolean> {
    const [result] = await pool.execute(
      'UPDATE Game SET downloads = downloads + 1 WHERE game_id = ?',
      [gameId]
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

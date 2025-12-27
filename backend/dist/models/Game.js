"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameModel = void 0;
const db_1 = require("../db");
class GameModel {
    // Get all games
    static async findAll() {
        const [rows] = await db_1.pool.execute('SELECT * FROM Game ORDER BY name');
        return rows;
    }
    // Get game by ID
    static async findById(gameId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Game WHERE game_id = ?', [gameId]);
        const games = rows;
        return games.length > 0 ? games[0] : null;
    }
    // Get game by name
    static async findByName(name) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Game WHERE name = ?', [name]);
        const games = rows;
        return games.length > 0 ? games[0] : null;
    }
    // Search games by name (partial match)
    static async searchByName(searchTerm) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Game WHERE name LIKE ? ORDER BY name', [`%${searchTerm}%`]);
        return rows;
    }
    // Get games by publisher
    static async findByPublisher(publisherId) {
        const [rows] = await db_1.pool.execute('SELECT * FROM Game WHERE publisher_id = ? ORDER BY name', [publisherId]);
        return rows;
    }
    // Get games by genre
    static async findByGenre(genreId) {
        const [rows] = await db_1.pool.execute(`
      SELECT g.* FROM Game g
      JOIN Game_Genre gg ON g.game_id = gg.game_id
      WHERE gg.genre_id = ?
      ORDER BY g.name
    `, [genreId]);
        return rows;
    }
    // Get games by platform
    static async findByPlatform(platformId) {
        const [rows] = await db_1.pool.execute(`
      SELECT g.* FROM Game g
      JOIN Game_Platform gp ON g.game_id = gp.game_id
      WHERE gp.platform_id = ?
      ORDER BY g.name
    `, [platformId]);
        return rows;
    }
    // Get games with publisher information
    static async findAllWithPublisher() {
        const [rows] = await db_1.pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      ORDER BY g.name
    `);
        return rows;
    }
    // Get all games with publisher and genres
    static async findAllWithPublisherAndGenres() {
        const [rows] = await db_1.pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      ORDER BY g.name
    `);
        const games = rows;
        const gamesWithGenres = [];
        for (const game of games) {
            // Get genres for each game
            const [genreRows] = await db_1.pool.execute(`
        SELECT gen.name FROM Genre gen
        JOIN Game_Genre gg ON gen.genre_id = gg.genre_id
        WHERE gg.game_id = ?
      `, [game.game_id]);
            const genres = genreRows.map((row) => row.name);
            // Get platforms for each game
            const [platformRows] = await db_1.pool.execute(`
        SELECT p.name FROM Platform p
        JOIN Game_Platform gp ON p.platform_id = gp.platform_id
        WHERE gp.game_id = ?
      `, [game.game_id]);
            const platforms = platformRows.map((row) => row.name);
            // Get languages for each game
            const [languageRows] = await db_1.pool.execute(`
        SELECT l.name FROM Language l
        JOIN Game_Language gl ON l.language_id = gl.language_id
        WHERE gl.game_id = ?
      `, [game.game_id]);
            const languages = languageRows.map((row) => row.name);
            // Get specifications
            const [specRows] = await db_1.pool.execute(`
        SELECT type, cpu, ram, gpu FROM Specification
        WHERE game_id = ?
      `, [game.game_id]);
            const specs = specRows;
            const minSpecs = specs.find((spec) => spec.type === 'MIN');
            const recSpecs = specs.find((spec) => spec.type === 'REC');
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
            });
        }
        return gamesWithGenres;
    }
    // Get game with full details
    static async findByIdWithDetails(gameId) {
        // Get game with publisher
        const [gameRows] = await db_1.pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE g.game_id = ?
    `, [gameId]);
        if (gameRows.length === 0)
            return null;
        const game = gameRows[0];
        // Get genres
        const [genreRows] = await db_1.pool.execute(`
      SELECT gen.name FROM Genre gen
      JOIN Game_Genre gg ON gen.genre_id = gg.genre_id
      WHERE gg.game_id = ?
    `, [gameId]);
        const genres = genreRows.map((row) => row.name);
        // Get platforms
        const [platformRows] = await db_1.pool.execute(`
      SELECT p.name FROM Platform p
      JOIN Game_Platform gp ON p.platform_id = gp.platform_id
      WHERE gp.game_id = ?
    `, [gameId]);
        const platforms = platformRows.map((row) => row.name);
        // Get languages
        const [languageRows] = await db_1.pool.execute(`
      SELECT l.name FROM Language l
      JOIN Game_Language gl ON l.language_id = gl.language_id
      WHERE gl.game_id = ?
    `, [gameId]);
        const languages = languageRows.map((row) => row.name);
        // Get specifications
        const [specRows] = await db_1.pool.execute(`
      SELECT type, cpu, ram, gpu FROM Specification
      WHERE game_id = ?
    `, [gameId]);
        const specs = specRows;
        const minSpecs = specs.find((spec) => spec.type === 'MIN');
        const recSpecs = specs.find((spec) => spec.type === 'REC');
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
        };
    }
    // Get top downloaded games
    static async findTopDownloaded(limit = 10) {
        // Ensure limit is a safe integer to prevent SQL injection
        const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
        const [rows] = await db_1.pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      ORDER BY g.downloads DESC
      LIMIT ${safeLimit}
    `);
        return rows;
    }
    // Get top rated games
    static async findTopRated(limit = 10) {
        // Ensure limit is a safe integer to prevent SQL injection
        const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
        const [rows] = await db_1.pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE g.average_rating > 0
      ORDER BY g.average_rating DESC
      LIMIT ${safeLimit}
    `);
        return rows;
    }
    // Get newest released games
    static async findNewestReleases(limit = 10) {
        // Ensure limit is a safe integer to prevent SQL injection
        const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
        const [rows] = await db_1.pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE g.release_date IS NOT NULL
      ORDER BY g.release_date DESC
      LIMIT ${safeLimit}
    `);
        return rows;
    }
    // Get games by price range
    static async findByPriceRange(minPrice, maxPrice) {
        const [rows] = await db_1.pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE g.price BETWEEN ? AND ?
      ORDER BY g.price
    `, [minPrice, maxPrice]);
        return rows;
    }
    // Get similar games based on a game
    static async findSimilarGames(gameId, limit = 8) {
        // First, get the target game's details
        const targetGame = await this.findByIdWithDetails(gameId);
        if (!targetGame)
            return [];
        const safeLimit = Math.max(1, Math.min(20, Math.floor(limit)));
        // Find games with similar genres, similar price range, and good ratings
        const priceMin = Math.max(0, targetGame.price * 0.5); // 50% lower
        const priceMax = targetGame.price * 1.5; // 50% higher
        const [rows] = await db_1.pool.execute(`
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
    `, [gameId, gameId, priceMin, priceMax, gameId]);
        const games = rows;
        const gamesWithDetails = [];
        for (const game of games) {
            // Get genres
            const [genreRows] = await db_1.pool.execute(`
        SELECT gen.name FROM Genre gen
        JOIN Game_Genre gg ON gen.genre_id = gg.genre_id
        WHERE gg.game_id = ?
      `, [game.game_id]);
            const genres = genreRows.map((row) => row.name);
            // Get platforms
            const [platformRows] = await db_1.pool.execute(`
        SELECT p.name FROM Platform p
        JOIN Game_Platform gp ON p.platform_id = gp.platform_id
        WHERE gp.game_id = ?
      `, [game.game_id]);
            const platforms = platformRows.map((row) => row.name);
            // Get languages
            const [languageRows] = await db_1.pool.execute(`
        SELECT l.name FROM Language l
        JOIN Game_Language gl ON l.language_id = gl.language_id
        WHERE gl.game_id = ?
      `, [game.game_id]);
            const languages = languageRows.map((row) => row.name);
            gamesWithDetails.push({
                ...game,
                genres,
                platforms,
                languages,
                min_specs: null,
                rec_specs: null
            });
        }
        return gamesWithDetails;
    }
    // Create new game
    static async create(data) {
        const [result] = await db_1.pool.execute(`
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
        ]);
        return result.insertId;
    }
    // Update game
    static async update(gameId, data) {
        const fields = [];
        const values = [];
        if (data.name !== undefined) {
            fields.push('name = ?');
            values.push(data.name);
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            values.push(data.description);
        }
        if (data.release_date !== undefined) {
            fields.push('release_date = ?');
            values.push(data.release_date);
        }
        if (data.publisher_id !== undefined) {
            fields.push('publisher_id = ?');
            values.push(data.publisher_id);
        }
        if (data.mode !== undefined) {
            fields.push('mode = ?');
            values.push(data.mode);
        }
        if (data.price !== undefined) {
            fields.push('price = ?');
            values.push(data.price);
        }
        if (data.multiplayer !== undefined) {
            fields.push('multiplayer = ?');
            values.push(data.multiplayer);
        }
        if (data.capacity !== undefined) {
            fields.push('capacity = ?');
            values.push(data.capacity);
        }
        if (data.age_rating !== undefined) {
            fields.push('age_rating = ?');
            values.push(data.age_rating);
        }
        if (data.average_rating !== undefined) {
            fields.push('average_rating = ?');
            values.push(data.average_rating);
        }
        if (data.downloads !== undefined) {
            fields.push('downloads = ?');
            values.push(data.downloads);
        }
        if (data.image !== undefined) {
            fields.push('image = ?');
            values.push(data.image);
        }
        if (data.link_download !== undefined) {
            fields.push('link_download = ?');
            values.push(data.link_download);
        }
        if (fields.length === 0)
            return false;
        values.push(gameId);
        const [result] = await db_1.pool.execute(`UPDATE Game SET ${fields.join(', ')} WHERE game_id = ?`, values);
        return result.affectedRows > 0;
    }
    // Update game rating
    static async updateRating(gameId, newRating) {
        const [result] = await db_1.pool.execute('UPDATE Game SET average_rating = ? WHERE game_id = ?', [newRating, gameId]);
        return result.affectedRows > 0;
    }
    // Update game downloads
    static async updateDownloads(gameId, newDownloads) {
        const [result] = await db_1.pool.execute('UPDATE Game SET downloads = ? WHERE game_id = ?', [newDownloads, gameId]);
        return result.affectedRows > 0;
    }
    // Increment game downloads
    static async incrementDownloads(gameId) {
        const [result] = await db_1.pool.execute('UPDATE Game SET downloads = downloads + 1 WHERE game_id = ?', [gameId]);
        return result.affectedRows > 0;
    }
    // Delete game
    static async delete(gameId) {
        const [result] = await db_1.pool.execute('DELETE FROM Game WHERE game_id = ?', [gameId]);
        return result.affectedRows > 0;
    }
}
exports.GameModel = GameModel;
//# sourceMappingURL=Game.js.map
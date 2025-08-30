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
        // Get specifications
        const [specRows] = await db_1.pool.execute(`
      SELECT type, cpu, ram, gpu, storage FROM Specification
      WHERE game_id = ?
    `, [gameId]);
        const specs = specRows;
        const minSpecs = specs.find((spec) => spec.type === 'MIN');
        const recSpecs = specs.find((spec) => spec.type === 'REC');
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
        };
    }
    // Get top selling games
    static async findTopSelling(limit = 10) {
        const [rows] = await db_1.pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      ORDER BY g.total_sales DESC
      LIMIT ?
    `, [limit]);
        return rows;
    }
    // Get top rated games
    static async findTopRated(limit = 10) {
        const [rows] = await db_1.pool.execute(`
      SELECT g.*, p.name as publisher_name
      FROM Game g
      JOIN Publisher p ON g.publisher_id = p.publisher_id
      WHERE g.average_rating > 0
      ORDER BY g.average_rating DESC
      LIMIT ?
    `, [limit]);
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
    // Create new game
    static async create(data) {
        const [result] = await db_1.pool.execute(`
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
        if (data.release_year !== undefined) {
            fields.push('release_year = ?');
            values.push(data.release_year);
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
        if (data.total_sales !== undefined) {
            fields.push('total_sales = ?');
            values.push(data.total_sales);
        }
        if (data.total_revenue !== undefined) {
            fields.push('total_revenue = ?');
            values.push(data.total_revenue);
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
    // Update game sales
    static async updateSales(gameId, newSales, newRevenue) {
        const [result] = await db_1.pool.execute('UPDATE Game SET total_sales = ?, total_revenue = ? WHERE game_id = ?', [newSales, newRevenue, gameId]);
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
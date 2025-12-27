"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameController = void 0;
const models_1 = require("../models");
const db_1 = require("../db");
class GameController {
    /**
     * Get all games with filters and pagination
     */
    static async getAllGames(req, res) {
        try {
            const { search, genre, platform, publisher, minPrice, maxPrice, sortBy = 'name', page = '1', limit } = req.query;
            let games = await models_1.GameModel.findAllWithPublisherAndGenres();
            // Apply filters
            if (search) {
                games = games.filter(game => game.name.toLowerCase().includes(search.toLowerCase()));
            }
            if (genre) {
                const genreId = parseInt(genre);
                const genreGames = await models_1.GameModel.findByGenre(genreId);
                const genreGameIds = genreGames.map(g => g.game_id);
                games = games.filter(game => genreGameIds.includes(game.game_id));
            }
            if (platform) {
                const platformId = parseInt(platform);
                const platformGames = await models_1.GameModel.findByPlatform(platformId);
                const platformGameIds = platformGames.map(g => g.game_id);
                games = games.filter(game => platformGameIds.includes(game.game_id));
            }
            if (publisher) {
                const publisherId = parseInt(publisher);
                games = games.filter(game => game.publisher_id === publisherId);
            }
            if (minPrice || maxPrice) {
                const min = minPrice ? parseFloat(minPrice) : 0;
                const max = maxPrice ? parseFloat(maxPrice) : Number.MAX_SAFE_INTEGER;
                games = games.filter(game => game.price >= min && game.price <= max);
            }
            // Apply sorting
            switch (sortBy) {
                case 'price_asc':
                    games.sort((a, b) => a.price - b.price);
                    break;
                case 'price_desc':
                    games.sort((a, b) => b.price - a.price);
                    break;
                case 'rating':
                    games.sort((a, b) => b.average_rating - a.average_rating);
                    break;
                case 'release_year':
                    games.sort((a, b) => {
                        const dateA = new Date(a.release_date || '2020-01-01').getFullYear();
                        const dateB = new Date(b.release_date || '2020-01-01').getFullYear();
                        return dateB - dateA;
                    });
                    break;
                default:
                    games.sort((a, b) => a.name.localeCompare(b.name));
            }
            // Apply pagination - if no limit is provided, return all games
            const pageNum = parseInt(page);
            const limitNum = limit ? parseInt(limit) : games.length; // Return all games if no limit
            const totalGames = games.length;
            const totalPages = Math.ceil(totalGames / limitNum);
            const startIndex = (pageNum - 1) * limitNum;
            const endIndex = startIndex + limitNum;
            const paginatedGames = games.slice(startIndex, endIndex);
            res.json({
                games: paginatedGames,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    totalGames,
                    totalPages
                }
            });
        }
        catch (error) {
            console.error('Error in getAllGames:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Get game by ID with full details
     */
    static async getGameById(req, res) {
        try {
            const gameId = parseInt(req.params.id || '0');
            const game = await models_1.GameModel.findByIdWithDetails(gameId);
            if (!game) {
                return res.status(404).json({ error: 'GAME_NOT_FOUND' });
            }
            // Format game with proper image handling
            const formattedGame = {
                ...game,
                image: game.image || null,
                screenshots: game.image ? [game.image] : [],
                genres: game.genres || [],
                platforms: game.platforms || []
            };
            res.json({ game: formattedGame });
        }
        catch (error) {
            console.error('Error in getGameById:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Get top downloaded games
     */
    static async getTopDownloaded(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const topGames = await models_1.GameModel.findTopDownloaded(limit);
            // Enrich with genres and platforms
            const gamesWithDetails = await Promise.all(topGames.map(async (game) => {
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
                return {
                    ...game,
                    genres,
                    platforms
                };
            }));
            res.json({ games: gamesWithDetails });
        }
        catch (error) {
            console.error('Error in getTopDownloaded:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Get top rated games
     */
    static async getTopRated(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const games = await models_1.GameModel.findTopRated(limit);
            res.json({ games });
        }
        catch (error) {
            console.error('Error in getTopRated:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Get newest released games
     */
    static async getNewestReleases(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const topGames = await models_1.GameModel.findNewestReleases(limit);
            // Enrich with genres and platforms
            const gamesWithDetails = await Promise.all(topGames.map(async (game) => {
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
                return {
                    ...game,
                    genres,
                    platforms
                };
            }));
            res.json({ games: gamesWithDetails });
        }
        catch (error) {
            console.error('Error in getNewestReleases:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Get all genres
     */
    static async getAllGenres(req, res) {
        try {
            const genres = await models_1.GenreModel.findAll();
            res.json({ genres });
        }
        catch (error) {
            console.error('Error in getAllGenres:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Get all platforms
     */
    static async getAllPlatforms(req, res) {
        try {
            const platforms = await models_1.PlatformModel.findAll();
            res.json({ platforms });
        }
        catch (error) {
            console.error('Error in getAllPlatforms:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
    /**
     * Get all publishers
     */
    static async getAllPublishers(req, res) {
        try {
            const publishers = await models_1.PublisherModel.findAll();
            res.json({ publishers });
        }
        catch (error) {
            console.error('Error in getAllPublishers:', error);
            res.status(500).json({ error: 'DB_ERROR' });
        }
    }
}
exports.GameController = GameController;
//# sourceMappingURL=gameController.js.map
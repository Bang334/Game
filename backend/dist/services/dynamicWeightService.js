"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DynamicWeightService = void 0;
const db_1 = require("../db");
/**
 * Kiểm tra xem Dynamic Multiplier có được bật không
 */
async function isDynamicMultiplierEnabled() {
    try {
        const [rows] = await db_1.pool.query('SELECT config_value FROM system_config WHERE config_key = ?', ['dynamic_multiplier_enabled']);
        if (Array.isArray(rows) && rows.length > 0) {
            return rows[0].config_value === 'true';
        }
        return true; // Default to enabled if config not found
    }
    catch (error) {
        console.error('❌ Error checking dynamic multiplier config:', error);
        return true; // Default to enabled on error
    }
}
class DynamicWeightService {
    /**
     * Phân tích hành vi người dùng từ 7 ngày gần nhất
     */
    static async analyzeUserBehavior(userId) {
        try {
            console.log(`🧠 Analyzing behavior for user ${userId}...`);
            // Lấy tương tác 7 ngày gần nhất
            const [interactions] = await db_1.pool.query(`
        SELECT 
          ui.game_id,
          ui.interaction_type,
          ui.timestamp,
          g.price,
          g.release_date,
          g.genre,
          g.publisher,
          g.platform
        FROM user_interactions ui
        JOIN game g ON ui.game_id = g.id
        WHERE ui.user_id = ? 
          AND ui.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        ORDER BY ui.timestamp DESC
      `, [userId]);
            if (interactions.length === 0) {
                console.log(`❌ No interactions found for user ${userId} in last 7 days`);
                return null;
            }
            const userInteractions = interactions;
            console.log(`📊 Found ${userInteractions.length} interactions for user ${userId}`);
            // Phân tích giá cả
            const priceAnalysis = this.analyzePricePreferences(userInteractions);
            // Phân tích ngày phát hành
            const releaseDateAnalysis = this.analyzeReleaseDatePreferences(userInteractions);
            // Phân tích thể loại
            const genreAnalysis = this.analyzeGenrePreferences(userInteractions);
            // Phân tích nhà phát hành
            const publisherAnalysis = this.analyzePublisherPreferences(userInteractions);
            // Phân tích nền tảng
            const platformAnalysis = this.analyzePlatformPreferences(userInteractions);
            const pattern = {
                user_id: userId,
                price_preferences: priceAnalysis,
                release_date_preferences: releaseDateAnalysis,
                genre_preferences: genreAnalysis,
                publisher_preferences: publisherAnalysis,
                platform_preferences: platformAnalysis,
                total_interactions: userInteractions.length,
                last_analyzed: new Date().toISOString()
            };
            console.log(`✅ Behavior analysis completed for user ${userId}`);
            return pattern;
        }
        catch (error) {
            console.error(`❌ Error analyzing user behavior for ${userId}:`, error);
            return null;
        }
    }
    /**
     * Phân tích sở thích giá cả
     */
    static analyzePricePreferences(interactions) {
        const prices = interactions
            .map(i => i.price)
            .filter(price => price && price > 0);
        if (prices.length === 0) {
            return {
                min_price: 0,
                max_price: 0,
                avg_price: 0,
                price_weight: 1.0
            };
        }
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        // Tính trọng số dựa trên độ tập trung của giá
        const priceRange = maxPrice - minPrice;
        const priceVariance = prices.reduce((sum, price) => sum + Math.pow(price - avgPrice, 2), 0) / prices.length;
        const priceStdDev = Math.sqrt(priceVariance);
        // Trọng số cao nếu giá tập trung (std dev thấp)
        const priceWeight = Math.max(1.0, Math.min(3.0, 3.0 - (priceStdDev / avgPrice)));
        console.log(`💰 Price analysis: min=${minPrice}, max=${maxPrice}, avg=${avgPrice.toFixed(0)}, weight=${priceWeight.toFixed(2)}`);
        return {
            min_price: minPrice,
            max_price: maxPrice,
            avg_price: avgPrice,
            price_weight: priceWeight
        };
    }
    /**
     * Phân tích sở thích ngày phát hành
     */
    static analyzeReleaseDatePreferences(interactions) {
        const years = interactions
            .map(i => {
            try {
                return new Date(i.release_date).getFullYear();
            }
            catch {
                return null;
            }
        })
            .filter(year => year && year > 1990);
        if (years.length === 0) {
            return {
                preferred_years: [],
                release_date_weight: 1.0
            };
        }
        // Tìm năm được ưa thích (xuất hiện nhiều nhất)
        const yearCounts = {};
        years.forEach(year => {
            if (year !== null) {
                yearCounts[year] = (yearCounts[year] || 0) + 1;
            }
        });
        const sortedYears = Object.entries(yearCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3) // Top 3 năm
            .map(([year]) => parseInt(year));
        // Tính trọng số dựa trên độ tập trung của năm
        const validYears = years.filter(year => year !== null);
        if (validYears.length === 0) {
            return {
                preferred_years: [],
                release_date_weight: 1.0
            };
        }
        const yearVariance = validYears.reduce((sum, year) => sum + Math.pow(year - 2020, 2), 0) / validYears.length;
        const yearStdDev = Math.sqrt(yearVariance);
        // Trọng số cao nếu thích game mới (năm gần 2024)
        const currentYear = new Date().getFullYear();
        const avgYear = validYears.reduce((sum, year) => sum + year, 0) / validYears.length;
        const yearRecency = (avgYear - 2000) / (currentYear - 2000); // 0-1 scale
        const releaseDateWeight = Math.max(1.0, Math.min(3.0, 1.0 + yearRecency * 2.0));
        console.log(`📅 Release date analysis: preferred_years=${sortedYears}, avg_year=${avgYear.toFixed(0)}, weight=${releaseDateWeight.toFixed(2)}`);
        return {
            preferred_years: sortedYears,
            release_date_weight: releaseDateWeight
        };
    }
    /**
     * Phân tích sở thích thể loại
     */
    static analyzeGenrePreferences(interactions) {
        const genreCounts = {};
        interactions.forEach(interaction => {
            try {
                const genres = JSON.parse(interaction.genre || '[]');
                genres.forEach((genre) => {
                    genreCounts[genre] = (genreCounts[genre] || 0) + 1;
                });
            }
            catch {
                // Ignore invalid JSON
            }
        });
        if (Object.keys(genreCounts).length === 0) {
            return {
                preferred_genres: [],
                genre_weights: {}
            };
        }
        // Sắp xếp theo tần suất
        const sortedGenres = Object.entries(genreCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5); // Top 5 genres
        const preferredGenres = sortedGenres.map(([genre]) => genre);
        // Tính trọng số cho từng genre
        const totalInteractions = interactions.length;
        const genreWeights = {};
        sortedGenres.forEach(([genre, count]) => {
            const frequency = count / totalInteractions;
            genreWeights[genre] = Math.max(1.0, Math.min(3.0, 1.0 + frequency * 2.0));
        });
        console.log(`🎮 Genre analysis: preferred=${preferredGenres}, weights=${JSON.stringify(genreWeights)}`);
        return {
            preferred_genres: preferredGenres,
            genre_weights: genreWeights
        };
    }
    /**
     * Phân tích sở thích nhà phát hành
     */
    static analyzePublisherPreferences(interactions) {
        const publisherCounts = {};
        interactions.forEach(interaction => {
            const publisher = interaction.publisher;
            if (publisher) {
                publisherCounts[publisher] = (publisherCounts[publisher] || 0) + 1;
            }
        });
        if (Object.keys(publisherCounts).length === 0) {
            return {
                preferred_publishers: [],
                publisher_weight: 1.0
            };
        }
        const sortedPublishers = Object.entries(publisherCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3) // Top 3 publishers
            .map(([publisher]) => publisher);
        // Tính trọng số dựa trên độ tập trung
        const totalInteractions = interactions.length;
        const topPublisherCount = Math.max(...Object.values(publisherCounts));
        const publisherConcentration = topPublisherCount / totalInteractions;
        const publisherWeight = Math.max(1.0, Math.min(3.0, 1.0 + publisherConcentration * 2.0));
        console.log(`🏢 Publisher analysis: preferred=${sortedPublishers}, weight=${publisherWeight.toFixed(2)}`);
        return {
            preferred_publishers: sortedPublishers,
            publisher_weight: publisherWeight
        };
    }
    /**
     * Phân tích sở thích nền tảng
     */
    static analyzePlatformPreferences(interactions) {
        const platformCounts = {};
        interactions.forEach(interaction => {
            try {
                const platforms = JSON.parse(interaction.platform || '[]');
                platforms.forEach((platform) => {
                    platformCounts[platform] = (platformCounts[platform] || 0) + 1;
                });
            }
            catch {
                // Ignore invalid JSON
            }
        });
        if (Object.keys(platformCounts).length === 0) {
            return {
                preferred_platforms: [],
                platform_weight: 1.0
            };
        }
        const sortedPlatforms = Object.entries(platformCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3) // Top 3 platforms
            .map(([platform]) => platform);
        // Tính trọng số dựa trên độ tập trung
        const totalInteractions = interactions.length;
        const topPlatformCount = Math.max(...Object.values(platformCounts));
        const platformConcentration = topPlatformCount / totalInteractions;
        const platformWeight = Math.max(1.0, Math.min(3.0, 1.0 + platformConcentration * 2.0));
        console.log(`💻 Platform analysis: preferred=${sortedPlatforms}, weight=${platformWeight.toFixed(2)}`);
        return {
            preferred_platforms: sortedPlatforms,
            platform_weight: platformWeight
        };
    }
    /**
     * Tính trọng số động cho game dựa trên điểm tương tác thực tế
     */
    static async calculateDynamicGameScore(userId, game, baseScore) {
        try {
            // Kiểm tra xem Dynamic Multiplier có được bật không
            const isEnabled = await isDynamicMultiplierEnabled();
            if (!isEnabled) {
                console.log(`⚠️  Dynamic Multiplier is DISABLED - returning base score`);
                return baseScore;
            }
            // Lấy điểm tương tác thực tế của user với game tương tự
            const interactionScore = await this.calculateInteractionBasedScore(userId, game);
            if (interactionScore === 0) {
                return baseScore; // Không có dữ liệu tương tác, trả về điểm gốc
            }
            // Dynamic Multiplier = điểm tương tác thực tế / điểm trung bình
            const avgInteractionScore = await this.getAverageInteractionScore(userId);
            const dynamicMultiplier = interactionScore / avgInteractionScore;
            // Áp dụng multiplier với giới hạn hợp lý (giảm từ 3.0x xuống 1.5x)
            const finalMultiplier = Math.max(0.7, Math.min(1.5, dynamicMultiplier));
            const dynamicScore = baseScore * finalMultiplier;
            console.log(`🎯 Dynamic score for user ${userId}, game ${game.name}:`);
            console.log(`   Base score: ${baseScore.toFixed(3)}`);
            console.log(`   Interaction score: ${interactionScore.toFixed(3)}`);
            console.log(`   Avg interaction: ${avgInteractionScore.toFixed(3)}`);
            console.log(`   Multiplier: ${finalMultiplier.toFixed(3)}x`);
            console.log(`   Final score: ${dynamicScore.toFixed(3)}`);
            return dynamicScore;
        }
        catch (error) {
            console.error(`❌ Error calculating dynamic score:`, error);
            return baseScore;
        }
    }
    /**
     * Tính điểm tương tác dựa trên game tương tự user đã tương tác
     */
    static async calculateInteractionBasedScore(userId, game) {
        try {
            // Lấy tất cả tương tác của user trong 7 ngày gần nhất
            const [interactions] = await db_1.pool.query(`
        SELECT 
          ui.game_id,
          ui.interaction_type,
          g.price,
          g.release_date,
          g.genre,
          g.publisher,
          g.platform
        FROM user_interactions ui
        JOIN game g ON ui.game_id = g.id
        WHERE ui.user_id = ? 
          AND ui.timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `, [userId]);
            if (interactions.length === 0) {
                return 0;
            }
            const userInteractions = interactions;
            let totalScore = 0;
            let totalWeight = 0;
            // Tính điểm cho từng game user đã tương tác
            for (const interaction of userInteractions) {
                const gameScore = this.calculateGameSimilarityScore(game, interaction);
                // Điểm tương tác: thích=5, tải=3, xem=1
                let interactionWeight = 0;
                switch (interaction.interaction_type) {
                    case 'like':
                    case 'favorite':
                        interactionWeight = 5.0;
                        break;
                    case 'purchase':
                    case 'download':
                        interactionWeight = 3.0;
                        break;
                    case 'view':
                    case 'click':
                        interactionWeight = 1.0;
                        break;
                    case 'review':
                        interactionWeight = 4.0;
                        break;
                    case 'wishlist':
                        interactionWeight = 2.0;
                        break;
                    default:
                        interactionWeight = 1.0;
                }
                totalScore += gameScore * interactionWeight;
                totalWeight += interactionWeight;
            }
            return totalWeight > 0 ? totalScore / totalWeight : 0;
        }
        catch (error) {
            console.error(`❌ Error calculating interaction-based score:`, error);
            return 0;
        }
    }
    /**
     * Tính độ tương đồng giữa game hiện tại và game user đã tương tác
     */
    static calculateGameSimilarityScore(targetGame, interactedGame) {
        let similarityScore = 0;
        let totalFactors = 0;
        // 1. Tương đồng giá cả (trọng số 0.3)
        if (targetGame.price && interactedGame.price) {
            const priceDiff = Math.abs(targetGame.price - interactedGame.price) / Math.max(targetGame.price, interactedGame.price);
            const priceSimilarity = Math.max(0, 1 - priceDiff);
            similarityScore += priceSimilarity * 0.3;
            totalFactors += 0.3;
        }
        // 2. Tương đồng ngày phát hành (trọng số 0.2)
        if (targetGame.release_date && interactedGame.release_date) {
            try {
                const targetYear = new Date(targetGame.release_date).getFullYear();
                const interactedYear = new Date(interactedGame.release_date).getFullYear();
                const yearDiff = Math.abs(targetYear - interactedYear);
                const yearSimilarity = Math.max(0, 1 - (yearDiff / 10)); // Giảm 0.1 mỗi năm
                similarityScore += yearSimilarity * 0.2;
                totalFactors += 0.2;
            }
            catch {
                // Ignore date parsing errors
            }
        }
        // 3. Tương đồng thể loại (trọng số 0.3)
        if (targetGame.genre && interactedGame.genre) {
            try {
                const targetGenres = JSON.parse(targetGame.genre || '[]');
                const interactedGenres = JSON.parse(interactedGame.genre || '[]');
                const commonGenres = targetGenres.filter((genre) => interactedGenres.includes(genre));
                const genreSimilarity = commonGenres.length / Math.max(targetGenres.length, interactedGenres.length, 1);
                similarityScore += genreSimilarity * 0.3;
                totalFactors += 0.3;
            }
            catch {
                // Ignore JSON parsing errors
            }
        }
        // 4. Tương đồng nhà phát hành (trọng số 0.1)
        if (targetGame.publisher && interactedGame.publisher) {
            const publisherSimilarity = targetGame.publisher === interactedGame.publisher ? 1.0 : 0.0;
            similarityScore += publisherSimilarity * 0.1;
            totalFactors += 0.1;
        }
        // 5. Tương đồng nền tảng (trọng số 0.1)
        if (targetGame.platform && interactedGame.platform) {
            try {
                const targetPlatforms = JSON.parse(targetGame.platform || '[]');
                const interactedPlatforms = JSON.parse(interactedGame.platform || '[]');
                const commonPlatforms = targetPlatforms.filter((platform) => interactedPlatforms.includes(platform));
                const platformSimilarity = commonPlatforms.length / Math.max(targetPlatforms.length, interactedPlatforms.length, 1);
                similarityScore += platformSimilarity * 0.1;
                totalFactors += 0.1;
            }
            catch {
                // Ignore JSON parsing errors
            }
        }
        return totalFactors > 0 ? similarityScore / totalFactors : 0;
    }
    /**
     * Lấy điểm tương tác trung bình của user
     */
    static async getAverageInteractionScore(userId) {
        try {
            const [interactions] = await db_1.pool.query(`
        SELECT interaction_type, COUNT(*) as count
        FROM user_interactions 
        WHERE user_id = ? 
          AND timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY interaction_type
      `, [userId]);
            if (interactions.length === 0) {
                return 1.0; // Default average
            }
            let totalScore = 0;
            let totalCount = 0;
            interactions.forEach(interaction => {
                let score = 0;
                switch (interaction.interaction_type) {
                    case 'like':
                    case 'favorite':
                        score = 5.0;
                        break;
                    case 'purchase':
                    case 'download':
                        score = 3.0;
                        break;
                    case 'view':
                    case 'click':
                        score = 1.0;
                        break;
                    case 'review':
                        score = 4.0;
                        break;
                    case 'wishlist':
                        score = 2.0;
                        break;
                    default:
                        score = 1.0;
                }
                totalScore += score * interaction.count;
                totalCount += interaction.count;
            });
            return totalCount > 0 ? totalScore / totalCount : 1.0;
        }
        catch (error) {
            console.error(`❌ Error getting average interaction score:`, error);
            return 1.0;
        }
    }
    /**
     * Tính độ khớp giá cả
     */
    static calculatePriceMatch(price, pricePrefs) {
        const { min_price, max_price, avg_price, price_weight } = pricePrefs;
        if (price >= min_price && price <= max_price) {
            // Giá trong khoảng ưa thích
            const distanceFromAvg = Math.abs(price - avg_price) / avg_price;
            return Math.max(1.0, price_weight - distanceFromAvg);
        }
        else {
            // Giá ngoài khoảng ưa thích
            const distanceFromRange = Math.min(Math.abs(price - min_price) / avg_price, Math.abs(price - max_price) / avg_price);
            return Math.max(0.5, 1.0 - distanceFromRange);
        }
    }
    /**
     * Tính độ khớp ngày phát hành
     */
    static calculateReleaseDateMatch(releaseDate, releaseDatePrefs) {
        try {
            const gameYear = new Date(releaseDate).getFullYear();
            const { preferred_years, release_date_weight } = releaseDatePrefs;
            if (preferred_years.includes(gameYear)) {
                return release_date_weight; // Năm được ưa thích
            }
            else {
                // Tính khoảng cách với năm gần nhất
                const distances = preferred_years.map((year) => Math.abs(gameYear - year));
                const minDistance = Math.min(...distances);
                return Math.max(0.5, release_date_weight - (minDistance / 10)); // Giảm 0.1 mỗi năm
            }
        }
        catch {
            return 1.0; // Không thể parse ngày
        }
    }
    /**
     * Tính độ khớp thể loại
     */
    static calculateGenreMatch(genre, genrePrefs) {
        try {
            const gameGenres = JSON.parse(genre || '[]');
            const { genre_weights } = genrePrefs;
            let maxMatch = 1.0;
            gameGenres.forEach((gameGenre) => {
                if (genre_weights[gameGenre]) {
                    maxMatch = Math.max(maxMatch, genre_weights[gameGenre]);
                }
            });
            return maxMatch;
        }
        catch {
            return 1.0; // Không thể parse genre
        }
    }
    /**
     * Tính độ khớp nhà phát hành
     */
    static calculatePublisherMatch(publisher, publisherPrefs) {
        const { preferred_publishers, publisher_weight } = publisherPrefs;
        if (preferred_publishers.includes(publisher)) {
            return publisher_weight;
        }
        else {
            return 1.0; // Không khớp
        }
    }
    /**
     * Tính độ khớp nền tảng
     */
    static calculatePlatformMatch(platform, platformPrefs) {
        try {
            const gamePlatforms = JSON.parse(platform || '[]');
            const { preferred_platforms, platform_weight } = platformPrefs;
            const hasMatch = gamePlatforms.some((gamePlatform) => preferred_platforms.includes(gamePlatform));
            return hasMatch ? platform_weight : 1.0;
        }
        catch {
            return 1.0; // Không thể parse platform
        }
    }
    /**
     * Lưu pattern hành vi vào database
     */
    static async saveBehaviorPattern(pattern) {
        try {
            await db_1.pool.query(`
        INSERT INTO user_behavior_patterns (
          user_id, preferred_genres, avg_price_range, prefers_new_games,
          engagement_score, last_analyzed, pattern_data
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          preferred_genres = VALUES(preferred_genres),
          avg_price_range = VALUES(avg_price_range),
          prefers_new_games = VALUES(prefers_new_games),
          engagement_score = VALUES(engagement_score),
          last_analyzed = VALUES(last_analyzed),
          pattern_data = VALUES(pattern_data)
      `, [
                pattern.user_id,
                JSON.stringify(pattern.genre_preferences.preferred_genres),
                pattern.price_preferences.avg_price,
                pattern.release_date_preferences.preferred_years.includes(2024) ? 1 : 0,
                pattern.total_interactions / 7, // Engagement score = interactions per day
                pattern.last_analyzed,
                JSON.stringify(pattern)
            ]);
            console.log(`💾 Behavior pattern saved for user ${pattern.user_id}`);
        }
        catch (error) {
            console.error(`❌ Error saving behavior pattern:`, error);
        }
    }
}
exports.DynamicWeightService = DynamicWeightService;
//# sourceMappingURL=dynamicWeightService.js.map
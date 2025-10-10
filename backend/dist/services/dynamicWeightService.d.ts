interface UserInteractionPattern {
    user_id: number;
    price_preferences: {
        min_price: number;
        max_price: number;
        avg_price: number;
        price_weight: number;
    };
    release_date_preferences: {
        preferred_years: number[];
        release_date_weight: number;
    };
    genre_preferences: {
        preferred_genres: string[];
        genre_weights: Record<string, number>;
    };
    publisher_preferences: {
        preferred_publishers: string[];
        publisher_weight: number;
    };
    platform_preferences: {
        preferred_platforms: string[];
        platform_weight: number;
    };
    total_interactions: number;
    last_analyzed: string;
}
export declare class DynamicWeightService {
    /**
     * Phân tích hành vi người dùng từ 7 ngày gần nhất
     */
    static analyzeUserBehavior(userId: number): Promise<UserInteractionPattern | null>;
    /**
     * Phân tích sở thích giá cả
     */
    private static analyzePricePreferences;
    /**
     * Phân tích sở thích ngày phát hành
     */
    private static analyzeReleaseDatePreferences;
    /**
     * Phân tích sở thích thể loại
     */
    private static analyzeGenrePreferences;
    /**
     * Phân tích sở thích nhà phát hành
     */
    private static analyzePublisherPreferences;
    /**
     * Phân tích sở thích nền tảng
     */
    private static analyzePlatformPreferences;
    /**
     * Tính trọng số động cho game dựa trên điểm tương tác thực tế
     */
    static calculateDynamicGameScore(userId: number, game: any, baseScore: number): Promise<number>;
    /**
     * Tính điểm tương tác dựa trên game tương tự user đã tương tác
     */
    private static calculateInteractionBasedScore;
    /**
     * Tính độ tương đồng giữa game hiện tại và game user đã tương tác
     */
    private static calculateGameSimilarityScore;
    /**
     * Lấy điểm tương tác trung bình của user
     */
    private static getAverageInteractionScore;
    /**
     * Tính độ khớp giá cả
     */
    private static calculatePriceMatch;
    /**
     * Tính độ khớp ngày phát hành
     */
    private static calculateReleaseDateMatch;
    /**
     * Tính độ khớp thể loại
     */
    private static calculateGenreMatch;
    /**
     * Tính độ khớp nhà phát hành
     */
    private static calculatePublisherMatch;
    /**
     * Tính độ khớp nền tảng
     */
    private static calculatePlatformMatch;
    /**
     * Lưu pattern hành vi vào database
     */
    static saveBehaviorPattern(pattern: UserInteractionPattern): Promise<void>;
}
export {};
//# sourceMappingURL=dynamicWeightService.d.ts.map
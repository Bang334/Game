export interface Review {
    review_id: number;
    user_id: number;
    game_id: number;
    rating: number;
    comment: string | null;
    review_date: Date;
}
export interface CreateReviewData {
    user_id: number;
    game_id: number;
    rating: number;
    comment?: string;
}
export interface UpdateReviewData {
    rating?: number;
    comment?: string;
}
export interface ReviewWithDetails extends Review {
    username: string;
    game_name: string;
    publisher_name: string;
}
export declare class ReviewModel {
    static findAll(): Promise<Review[]>;
    static findById(reviewId: number): Promise<Review | null>;
    static findByUserId(userId: number): Promise<Review[]>;
    static findByGameId(gameId: number): Promise<Review[]>;
    static findByUserAndGame(userId: number, gameId: number): Promise<Review | null>;
    static findAllWithDetails(): Promise<ReviewWithDetails[]>;
    static findByGameIdWithDetails(gameId: number): Promise<ReviewWithDetails[]>;
    static findByUserIdWithDetails(userId: number): Promise<ReviewWithDetails[]>;
    static userHasReviewed(userId: number, gameId: number): Promise<boolean>;
    static getAverageRating(gameId: number): Promise<number>;
    static getRatingDistribution(gameId: number): Promise<{
        rating: number;
        count: number;
    }[]>;
    static create(data: CreateReviewData): Promise<number>;
    static createOrUpdate(data: CreateReviewData): Promise<{
        review_id: number;
        isNew: boolean;
    }>;
    static update(reviewId: number, data: UpdateReviewData): Promise<boolean>;
    static delete(reviewId: number): Promise<boolean>;
    static deleteByUserAndGame(userId: number, gameId: number): Promise<boolean>;
    static getReviewStats(): Promise<{
        total_reviews: number;
        average_rating: number;
        unique_users: number;
        unique_games: number;
    }>;
    static getUserReviewStats(userId: number): Promise<{
        total_reviews: number;
        average_rating: number;
        highest_rating: number;
        lowest_rating: number;
    }>;
    static findRecentReviews(days?: number): Promise<ReviewWithDetails[]>;
    static getTopRatedGames(limit?: number): Promise<{
        game_id: number;
        game_name: string;
        publisher_name: string;
        average_rating: number;
        review_count: number;
    }[]>;
}
//# sourceMappingURL=Review.d.ts.map
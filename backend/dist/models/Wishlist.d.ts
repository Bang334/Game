export interface Wishlist {
    wishlist_id: number;
    user_id: number;
    game_id: number;
}
export interface CreateWishlistData {
    user_id: number;
    game_id: number;
}
export interface WishlistWithDetails extends Wishlist {
    username: string;
    game_name: string;
    publisher_name: string;
    price: number;
    average_rating: number;
}
export declare class WishlistModel {
    static findAll(): Promise<Wishlist[]>;
    static findById(wishlistId: number): Promise<Wishlist | null>;
    static findByUserId(userId: number): Promise<Wishlist[]>;
    static findByGameId(gameId: number): Promise<Wishlist[]>;
    static findByUserIdWithDetails(userId: number): Promise<WishlistWithDetails[]>;
    static isInWishlist(userId: number, gameId: number): Promise<boolean>;
    static addToWishlist(data: CreateWishlistData): Promise<number>;
    static removeFromWishlist(userId: number, gameId: number): Promise<boolean>;
    static delete(wishlistId: number): Promise<boolean>;
    static getWishlistStats(): Promise<{
        total_items: number;
        unique_users: number;
        unique_games: number;
    }>;
    static getUserWishlistStats(userId: number): Promise<{
        total_items: number;
        total_value: number;
        average_rating: number;
    }>;
    static getMostWishedGames(limit?: number): Promise<{
        game_id: number;
        game_name: string;
        publisher_name: string;
        wishlist_count: number;
        price: number;
        average_rating: number;
    }[]>;
    static clearUserWishlist(userId: number): Promise<boolean>;
}
//# sourceMappingURL=Wishlist.d.ts.map
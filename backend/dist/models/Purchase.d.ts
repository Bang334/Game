export interface Purchase {
    purchase_id: number;
    user_id: number;
    game_id: number;
    purchase_date: Date;
    payment_method: string;
}
export interface CreatePurchaseData {
    user_id: number;
    game_id: number;
    payment_method?: string;
}
export interface PurchaseWithDetails extends Purchase {
    username: string;
    game_name: string;
    image: string | null;
    description: string | null;
    publisher_name: string;
    price: number;
    average_rating: number;
    link_download: string | null;
}
export declare class PurchaseModel {
    static findAll(): Promise<Purchase[]>;
    static findById(purchaseId: number): Promise<Purchase | null>;
    static findByUserId(userId: number): Promise<Purchase[]>;
    static findByGameId(gameId: number): Promise<Purchase[]>;
    static findAllWithDetails(): Promise<PurchaseWithDetails[]>;
    static findByUserIdWithDetails(userId: number): Promise<PurchaseWithDetails[]>;
    static userHasPurchased(userId: number, gameId: number): Promise<boolean>;
    static getPurchaseStats(): Promise<{
        total_purchases: number;
    }>;
    static getUserPurchaseStats(userId: number): Promise<{
        total_purchases: number;
    }>;
    static create(data: CreatePurchaseData): Promise<number>;
    static delete(purchaseId: number): Promise<boolean>;
    static findRecentPurchases(days?: number): Promise<PurchaseWithDetails[]>;
    static getTopSellingGames(limit?: number): Promise<{
        game_id: number;
        game_name: string;
        publisher_name: string;
        purchase_count: number;
    }[]>;
}
//# sourceMappingURL=Purchase.d.ts.map
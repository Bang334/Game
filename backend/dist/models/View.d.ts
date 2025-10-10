export interface View {
    view_id: number;
    user_id: number;
    game_id: number;
    viewed_at?: string;
    view_count?: number;
}
export interface ViewWithDetails extends View {
    name: string;
    price: number;
    image?: string;
    description?: string;
    average_rating?: number;
    publisher_name?: string;
    genres?: string[];
    platforms?: string[];
}
export declare class ViewModel {
    static create(data: {
        user_id: number;
        game_id: number;
    }): Promise<number>;
    static findByUserId(userId: number): Promise<View[]>;
    static findByUserIdWithDetails(userId: number): Promise<ViewWithDetails[]>;
    static findByUserAndGame(userId: number, gameId: number): Promise<View | null>;
    static delete(viewId: number): Promise<boolean>;
    static deleteByUserAndGame(userId: number, gameId: number): Promise<boolean>;
    static addView(userId: number, gameId: number): Promise<number>;
}
//# sourceMappingURL=View.d.ts.map
export interface Game {
    game_id: number;
    name: string;
    release_year: number | null;
    publisher_id: number;
    mode: string | null;
    price: number;
    multiplayer: boolean;
    capacity: number | null;
    age_rating: string | null;
    average_rating: number;
    total_sales: number;
    total_revenue: number;
}
export interface CreateGameData {
    name: string;
    release_year?: number;
    publisher_id: number;
    mode?: string;
    price: number;
    multiplayer?: boolean;
    capacity?: number;
    age_rating?: string;
    average_rating?: number;
    total_sales?: number;
    total_revenue?: number;
}
export interface UpdateGameData {
    name?: string;
    release_year?: number;
    publisher_id?: number;
    mode?: string;
    price?: number;
    multiplayer?: boolean;
    capacity?: number;
    age_rating?: string;
    average_rating?: number;
    total_sales?: number;
    total_revenue?: number;
}
export interface GameWithPublisher extends Game {
    publisher_name: string;
}
export interface GameWithDetails extends GameWithPublisher {
    genres: string[];
    platforms: string[];
    min_specs?: {
        cpu: string | null;
        ram: string | null;
        gpu: string | null;
        storage: string | null;
    } | null;
    rec_specs?: {
        cpu: string | null;
        ram: string | null;
        gpu: string | null;
        storage: string | null;
    } | null;
}
export declare class GameModel {
    static findAll(): Promise<Game[]>;
    static findById(gameId: number): Promise<Game | null>;
    static findByName(name: string): Promise<Game | null>;
    static searchByName(searchTerm: string): Promise<Game[]>;
    static findByPublisher(publisherId: number): Promise<Game[]>;
    static findByGenre(genreId: number): Promise<Game[]>;
    static findByPlatform(platformId: number): Promise<Game[]>;
    static findAllWithPublisher(): Promise<GameWithPublisher[]>;
    static findByIdWithDetails(gameId: number): Promise<GameWithDetails | null>;
    static findTopSelling(limit?: number): Promise<GameWithPublisher[]>;
    static findTopRated(limit?: number): Promise<GameWithPublisher[]>;
    static findByPriceRange(minPrice: number, maxPrice: number): Promise<GameWithPublisher[]>;
    static create(data: CreateGameData): Promise<number>;
    static update(gameId: number, data: UpdateGameData): Promise<boolean>;
    static updateRating(gameId: number, newRating: number): Promise<boolean>;
    static updateSales(gameId: number, newSales: number, newRevenue: number): Promise<boolean>;
    static delete(gameId: number): Promise<boolean>;
}
//# sourceMappingURL=Game.d.ts.map
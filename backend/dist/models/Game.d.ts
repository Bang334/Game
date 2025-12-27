export interface Game {
    game_id: number;
    name: string;
    description: string | null;
    release_date: Date | null;
    publisher_id: number;
    mode: string | null;
    price: number;
    multiplayer: boolean;
    capacity: number | null;
    age_rating: string | null;
    average_rating: number;
    downloads: number;
    image: string | null;
    link_download: string | null;
}
export interface CreateGameData {
    name: string;
    description?: string;
    release_date?: Date;
    publisher_id: number;
    mode?: string;
    price: number;
    multiplayer?: boolean;
    capacity?: number;
    age_rating?: string;
    average_rating?: number;
    downloads?: number;
    image?: string;
    link_download?: string;
}
export interface UpdateGameData {
    name?: string;
    description?: string;
    release_date?: Date;
    publisher_id?: number;
    mode?: string;
    price?: number;
    multiplayer?: boolean;
    capacity?: number;
    age_rating?: string;
    average_rating?: number;
    downloads?: number;
    image?: string;
    link_download?: string;
}
export interface GameWithPublisher extends Game {
    publisher_name: string;
}
export interface GameWithDetails extends GameWithPublisher {
    genres: string[];
    platforms: string[];
    languages: string[];
    min_specs?: {
        cpu: string | null;
        ram: string | null;
        gpu: string | null;
    } | null;
    rec_specs?: {
        cpu: string | null;
        ram: string | null;
        gpu: string | null;
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
    static findAllWithPublisherAndGenres(): Promise<GameWithDetails[]>;
    static findByIdWithDetails(gameId: number): Promise<GameWithDetails | null>;
    static findTopDownloaded(limit?: number): Promise<GameWithPublisher[]>;
    static findTopRated(limit?: number): Promise<GameWithPublisher[]>;
    static findNewestReleases(limit?: number): Promise<GameWithPublisher[]>;
    static findByPriceRange(minPrice: number, maxPrice: number): Promise<GameWithPublisher[]>;
    static findSimilarGames(gameId: number, limit?: number): Promise<GameWithDetails[]>;
    static create(data: CreateGameData): Promise<number>;
    static update(gameId: number, data: UpdateGameData): Promise<boolean>;
    static updateRating(gameId: number, newRating: number): Promise<boolean>;
    static updateDownloads(gameId: number, newDownloads: number): Promise<boolean>;
    static incrementDownloads(gameId: number): Promise<boolean>;
    static delete(gameId: number): Promise<boolean>;
}
//# sourceMappingURL=Game.d.ts.map
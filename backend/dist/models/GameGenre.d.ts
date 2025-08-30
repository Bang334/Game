export interface GameGenre {
    game_id: number;
    genre_id: number;
}
export declare class GameGenreModel {
    static findByGameId(gameId: number): Promise<number[]>;
    static findByGenreId(genreId: number): Promise<number[]>;
    static addGenreToGame(gameId: number, genreId: number): Promise<boolean>;
    static removeGenreFromGame(gameId: number, genreId: number): Promise<boolean>;
    static setGenresForGame(gameId: number, genreIds: number[]): Promise<boolean>;
    static gameHasGenre(gameId: number, genreId: number): Promise<boolean>;
    static findAll(): Promise<GameGenre[]>;
}
//# sourceMappingURL=GameGenre.d.ts.map
export interface GameLanguage {
    game_id: number;
    language_id: number;
}
export declare class GameLanguageModel {
    static findByGameId(gameId: number): Promise<number[]>;
    static findByLanguageId(languageId: number): Promise<number[]>;
    static addLanguageToGame(gameId: number, languageId: number): Promise<boolean>;
    static removeLanguageFromGame(gameId: number, languageId: number): Promise<boolean>;
    static setLanguagesForGame(gameId: number, languageIds: number[]): Promise<boolean>;
    static gameHasLanguage(gameId: number, languageId: number): Promise<boolean>;
    static findAll(): Promise<GameLanguage[]>;
}
//# sourceMappingURL=GameLanguage.d.ts.map
export interface GamePlatform {
    game_id: number;
    platform_id: number;
}
export declare class GamePlatformModel {
    static findByGameId(gameId: number): Promise<number[]>;
    static findByPlatformId(platformId: number): Promise<number[]>;
    static addPlatformToGame(gameId: number, platformId: number): Promise<boolean>;
    static removePlatformFromGame(gameId: number, platformId: number): Promise<boolean>;
    static setPlatformsForGame(gameId: number, platformIds: number[]): Promise<boolean>;
    static gameHasPlatform(gameId: number, platformId: number): Promise<boolean>;
    static findAll(): Promise<GamePlatform[]>;
}
//# sourceMappingURL=GamePlatform.d.ts.map
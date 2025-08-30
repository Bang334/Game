export interface Platform {
    platform_id: number;
    name: string;
}
export interface CreatePlatformData {
    name: string;
}
export interface UpdatePlatformData {
    name?: string;
}
export declare class PlatformModel {
    static findAll(): Promise<Platform[]>;
    static findById(platformId: number): Promise<Platform | null>;
    static findByName(name: string): Promise<Platform | null>;
    static searchByName(searchTerm: string): Promise<Platform[]>;
    static create(data: CreatePlatformData): Promise<number>;
    static update(platformId: number, data: UpdatePlatformData): Promise<boolean>;
    static delete(platformId: number): Promise<boolean>;
    static findWithGameCount(): Promise<(Platform & {
        game_count: number;
    })[]>;
}
//# sourceMappingURL=Platform.d.ts.map
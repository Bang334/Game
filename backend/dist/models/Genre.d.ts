export interface Genre {
    genre_id: number;
    name: string;
}
export interface CreateGenreData {
    name: string;
}
export interface UpdateGenreData {
    name?: string;
}
export declare class GenreModel {
    static findAll(): Promise<Genre[]>;
    static findById(genreId: number): Promise<Genre | null>;
    static findByName(name: string): Promise<Genre | null>;
    static searchByName(searchTerm: string): Promise<Genre[]>;
    static create(data: CreateGenreData): Promise<number>;
    static update(genreId: number, data: UpdateGenreData): Promise<boolean>;
    static delete(genreId: number): Promise<boolean>;
    static findWithGameCount(): Promise<(Genre & {
        game_count: number;
    })[]>;
}
//# sourceMappingURL=Genre.d.ts.map
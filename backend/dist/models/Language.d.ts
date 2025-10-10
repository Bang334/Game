export interface Language {
    language_id: number;
    name: string;
}
export interface CreateLanguageData {
    name: string;
}
export interface UpdateLanguageData {
    name?: string;
}
export declare class LanguageModel {
    static findAll(): Promise<Language[]>;
    static findById(languageId: number): Promise<Language | null>;
    static findByName(name: string): Promise<Language | null>;
    static searchByName(searchTerm: string): Promise<Language[]>;
    static create(data: CreateLanguageData): Promise<number>;
    static update(languageId: number, data: UpdateLanguageData): Promise<boolean>;
    static delete(languageId: number): Promise<boolean>;
    static findWithGameCount(): Promise<(Language & {
        game_count: number;
    })[]>;
}
//# sourceMappingURL=Language.d.ts.map
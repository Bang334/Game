export interface Specification {
    spec_id: number;
    game_id: number;
    type: 'MIN' | 'REC';
    cpu: string | null;
    ram: string | null;
    gpu: string | null;
}
export interface CreateSpecificationData {
    game_id: number;
    type: 'MIN' | 'REC';
    cpu?: string;
    ram?: string;
    gpu?: string;
}
export interface UpdateSpecificationData {
    cpu?: string;
    ram?: string;
    gpu?: string;
}
export declare class SpecificationModel {
    static findAll(): Promise<Specification[]>;
    static findById(specId: number): Promise<Specification | null>;
    static findByGameId(gameId: number): Promise<Specification[]>;
    static findMinSpecsByGameId(gameId: number): Promise<Specification | null>;
    static findRecSpecsByGameId(gameId: number): Promise<Specification | null>;
    static create(data: CreateSpecificationData): Promise<number>;
    static update(specId: number, data: UpdateSpecificationData): Promise<boolean>;
    static delete(specId: number): Promise<boolean>;
    static deleteByGameId(gameId: number): Promise<boolean>;
    static upsertSpecsForGame(gameId: number, minSpecs: Omit<CreateSpecificationData, 'game_id' | 'type'> | null, recSpecs: Omit<CreateSpecificationData, 'game_id' | 'type'> | null): Promise<boolean>;
}
//# sourceMappingURL=Specification.d.ts.map
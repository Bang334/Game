export interface Publisher {
    publisher_id: number;
    name: string;
}
export interface CreatePublisherData {
    name: string;
}
export interface UpdatePublisherData {
    name?: string;
}
export declare class PublisherModel {
    static findAll(): Promise<Publisher[]>;
    static findById(publisherId: number): Promise<Publisher | null>;
    static findByName(name: string): Promise<Publisher | null>;
    static searchByName(searchTerm: string): Promise<Publisher[]>;
    static create(data: CreatePublisherData): Promise<number>;
    static update(publisherId: number, data: UpdatePublisherData): Promise<boolean>;
    static delete(publisherId: number): Promise<boolean>;
    static findWithGameCount(): Promise<(Publisher & {
        game_count: number;
    })[]>;
}
//# sourceMappingURL=Publisher.d.ts.map
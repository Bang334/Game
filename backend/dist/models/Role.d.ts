export interface Role {
    role_id: number;
    name: string;
}
export interface CreateRoleData {
    name: string;
}
export interface UpdateRoleData {
    name?: string;
}
export declare class RoleModel {
    static findAll(): Promise<Role[]>;
    static findById(roleId: number): Promise<Role | null>;
    static findByName(name: string): Promise<Role | null>;
    static create(data: CreateRoleData): Promise<number>;
    static update(roleId: number, data: UpdateRoleData): Promise<boolean>;
    static delete(roleId: number): Promise<boolean>;
}
//# sourceMappingURL=Role.d.ts.map
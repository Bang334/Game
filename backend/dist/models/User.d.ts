export interface User {
    user_id: number;
    username: string;
    email: string;
    password: string;
    age: number | null;
    gender: string | null;
    balance: number;
    role_id: number;
}
export interface CreateUserData {
    username: string;
    email: string;
    password: string;
    age?: number;
    gender?: string;
    balance?: number;
    role_id: number;
}
export interface UpdateUserData {
    username?: string;
    email?: string;
    password?: string;
    age?: number;
    gender?: string;
    balance?: number;
    role_id?: number;
}
export interface UserWithRole extends User {
    role_name: string;
}
export declare class UserModel {
    static findAll(): Promise<User[]>;
    static findById(userId: number): Promise<User | null>;
    static findByEmail(email: string): Promise<User | null>;
    static findByUsername(username: string): Promise<User | null>;
    static findByIdWithRole(userId: number): Promise<UserWithRole | null>;
    static findAllWithRole(): Promise<UserWithRole[]>;
    static create(data: CreateUserData): Promise<number>;
    static update(userId: number, data: UpdateUserData): Promise<boolean>;
    static updateBalance(userId: number, newBalance: number): Promise<boolean>;
    static delete(userId: number): Promise<boolean>;
    static emailExists(email: string, excludeUserId?: number): Promise<boolean>;
    static usernameExists(username: string, excludeUserId?: number): Promise<boolean>;
}
//# sourceMappingURL=User.d.ts.map
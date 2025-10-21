export interface BalanceTransaction {
    transaction_id: number;
    user_id: number;
    amount: number;
    balance_before: number;
    balance_after: number;
    transaction_type: 'DEPOSIT' | 'PURCHASE' | 'REFUND' | 'ADMIN_ADJUST';
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    description: string | null;
    related_game_id: number | null;
    reviewed_by: number | null;
    reviewed_at: string | null;
    created_at: string;
    updated_at: string;
}
export interface BalanceTransactionWithGame extends BalanceTransaction {
    game_name?: string;
    game_image?: string;
    username?: string;
    user_email?: string;
    reviewer_name?: string;
}
export declare const BalanceTransactionModel: {
    create(data: {
        user_id: number;
        amount: number;
        balance_before: number;
        balance_after: number;
        transaction_type: "DEPOSIT" | "PURCHASE" | "REFUND" | "ADMIN_ADJUST";
        status?: "PENDING" | "APPROVED" | "REJECTED";
        description?: string;
        related_game_id?: number;
    }): Promise<number>;
    findByUserId(userId: number, limit?: number): Promise<BalanceTransactionWithGame[]>;
    findById(transactionId: number): Promise<BalanceTransaction | null>;
    getStatsByUserId(userId: number): Promise<{
        total_deposits: number;
        total_purchases: number;
        transaction_count: number;
    }>;
    findPendingDeposits(limit?: number): Promise<BalanceTransactionWithGame[]>;
    approveDeposit(transactionId: number, adminUserId: number): Promise<boolean>;
    rejectDeposit(transactionId: number, adminUserId: number, reason?: string): Promise<boolean>;
    getUserPendingDeposits(userId: number): Promise<BalanceTransactionWithGame[]>;
};
//# sourceMappingURL=BalanceTransaction.d.ts.map
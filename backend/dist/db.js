"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pool = void 0;
exports.pingDatabase = pingDatabase;
const promise_1 = __importDefault(require("mysql2/promise"));
exports.pool = promise_1.default.createPool({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 3307),
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '123456',
    database: process.env.DB_NAME ?? 'gamestore',
    connectionLimit: 10,
    decimalNumbers: true,
});
async function pingDatabase() {
    const conn = await exports.pool.getConnection();
    try {
        await conn.ping();
    }
    finally {
        conn.release();
    }
}
//# sourceMappingURL=db.js.map
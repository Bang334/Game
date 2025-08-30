import mysql from 'mysql2/promise'

export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3307),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '123456',
  database: process.env.DB_NAME ?? 'game',
  connectionLimit: 10,
  decimalNumbers: true,
})

export async function pingDatabase(): Promise<void> {
  const conn = await pool.getConnection()
  try {
    await conn.ping()
  } finally {
    conn.release()
  }
}


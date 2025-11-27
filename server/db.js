import mysql from 'mysql2/promise';
import 'dotenv/config';

const {
  MYSQL_HOST = '95.217.40.204',
  MYSQL_PORT = '50282',
  MYSQL_USER,
  MYSQL_PASSWORD,
  MYSQL_DATABASE,
  MYSQL_SSL = 'false',
} = process.env;

if (!MYSQL_USER || !MYSQL_PASSWORD || !MYSQL_DATABASE) {
  console.warn(
    'Missing one of MYSQL_USER, MYSQL_PASSWORD, or MYSQL_DATABASE. Database queries will fail until these are provided.'
  );
}

export const pool = mysql.createPool({
  host: MYSQL_HOST,
  port: Number(MYSQL_PORT),
  user: MYSQL_USER,
  password: MYSQL_PASSWORD,
  database: MYSQL_DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  namedPlaceholders: true,
  ssl: MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (error) => {
  console.error('Unexpected database pool error:', error);
});

export async function testConnection() {
  let connection;

  try {
    connection = await pool.getConnection();
    await connection.ping();
  } catch (error) {
    console.error('Database connection test failed:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function getServerTime() {
  try {
    const [rows] = await pool.query('SELECT NOW() as serverTime');
    return rows[0].serverTime;
  } catch (error) {
    console.error('Database query failed while retrieving server time:', error);
    throw error;
  }
}
